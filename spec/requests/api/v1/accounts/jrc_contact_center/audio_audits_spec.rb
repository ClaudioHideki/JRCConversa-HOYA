require 'rails_helper'

RSpec.describe 'Recording metrics and filtered history', type: :request do
  let(:account) { create(:account) }
  let(:admin) { create(:user, account: account, role: :administrator) }
  let(:headers) { admin.create_new_auth_token }
  let(:url) { "/api/v1/accounts/#{account.id}/jrc_contact_center/audio_audits" }
  let(:results) do
    Array.new(23) do |index|
      { 'nota_final' => 80, 'pontuacao_geral' => { 'versao' => 2, 'parcial' => false },
        'alerta_supervisao' => index.even?, 'classificacao_ligacao' => index.modulo(3).zero? ? 'critica' : 'boa',
        'temperatura_conversa' => index.modulo(4).zero? ? 'quente' : 'neutra',
        'risco_churn' => index.modulo(5).zero? ? 'alto' : 'baixo' }
    end
  end
  let!(:recordings) do
    JrcVoiceQuality::AudioAudit.insert_all!(results.each_with_index.map do |result, index|
      { account_id: account.id, filename: "call-#{index}.wav", status: 'completed', result: result,
        created_at: Time.zone.parse('2026-10-31 12:00:00'), updated_at: Time.current }
    end).rows.flatten
  end

  before do
    account.enable_features!('jrc_contact_center')
    allow(JrcVoiceQuality::OpenaiClient).to receive(:new).and_return(double(configured?: true))
  end

  it 'returns ten records per page in stable order without changing the account totals' do
    get url, headers: headers, as: :json
    expect(response).to have_http_status(:ok)
    first = response.parsed_body
    expect(first).to include('total' => 23, 'per_page' => 10, 'page' => 1, 'filter' => 'all')
    expect(first['items'].pluck('id')).to eq(recordings.reverse.first(10))
    expect(first['metrics']).to include('total' => 23, 'average_score' => 80.0, 'average_count' => 23, 'partial_count' => 0)
    get url, params: { page: 2 }, headers: headers, as: :json
    second = response.parsed_body
    expect(second['items'].pluck('id')).to eq(recordings.reverse.drop(10).first(10))
    get url, params: { page: 3 }, headers: headers, as: :json
    expect(response.parsed_body['items'].pluck('id')).to eq(recordings.reverse.last(3))
  end

  { 'audited' => (0...23).to_a, 'scored' => (0...23).to_a, 'alerts' => (0...23).select(&:even?),
    'critical' => [0, 3, 6, 9, 12, 15, 18, 21], 'hot' => [0, 4, 8, 12, 16, 20], 'churn' => [0, 5, 10, 15, 20] }.each do |filter, indices|
    it "filters #{filter} before pagination and keeps every metric scoped to the account" do
      other = create(:account)
      JrcVoiceQuality::AudioAudit.insert_all!([{ account_id: other.id, filename: 'other-account.wav', status: 'completed',
                                               result: results.first, created_at: Time.current, updated_at: Time.current }])
      get url, params: { filter: filter }, headers: headers, as: :json
      expect(response).to have_http_status(:ok)
      data = response.parsed_body
      expect(data['total']).to eq(indices.size)
      expect(data['items'].pluck('id')).to eq(indices.reverse.first(10).map { |index| recordings[index] })
      expect(data['metrics']).to include('total' => 23, 'alerts' => 12, 'critical' => 8, 'hot' => 6, 'average_score' => 80.0)
      expect(data['items'].pluck('filename')).not_to include('other-account.wav')
    end
  end

  it 'counts only completed audits in the audited and alert views' do
    JrcVoiceQuality::AudioAudit.insert_all!([{ account_id: account.id, filename: 'queued.wav', status: 'queued',
                                             result: results.first, created_at: Time.current, updated_at: Time.current }])
    get url, headers: headers, as: :json
    expect(response.parsed_body['total']).to eq(24)
    expect(response.parsed_body['metrics']['total']).to eq(23)
    get url, params: { filter: 'audited' }, headers: headers, as: :json
    expect(response.parsed_body['total']).to eq(23)
    get url, params: { filter: 'alerts' }, headers: headers, as: :json
    expect(response.parsed_body['total']).to eq(12)
  end

  it 'rejects an invalid filter without listing any recordings' do
    get url, params: { filter: 'unknown' }, headers: headers, as: :json
    expect(response).to have_http_status(:bad_request)
    expect(response.parsed_body['error']).to eq('invalid_filter')
    expect(response.parsed_body).not_to have_key('items')
  end

  it 'preserves the feature flag and Account membership gates' do
    account.disable_features!('jrc_contact_center')
    get url, headers: headers, as: :json
    expect(response).to have_http_status(:unauthorized)
    account.enable_features!('jrc_contact_center')
    other = create(:account)
    other.enable_features!('jrc_contact_center')
    get "/api/v1/accounts/#{other.id}/jrc_contact_center/audio_audits", headers: headers, as: :json
    expect(response).not_to have_http_status(:ok)
  end

  context 'when partial, legacy, zero and missing scores coexist' do
    let(:results) do
      [{ 'nota_final' => 80, 'pontuacao_geral' => { 'versao' => 2, 'parcial' => false } },
       { 'nota_final' => 0, 'pontuacao_geral' => { 'versao' => 2, 'parcial' => false } },
       { 'nota_final' => 100, 'pontuacao_geral' => { 'versao' => 2, 'parcial' => true } },
       { 'nota_final' => 100, 'pontuacao_geral' => { 'versao' => 1, 'parcial' => false } },
       { 'nota_final' => nil, 'pontuacao_geral' => { 'versao' => 2, 'parcial' => false } },
       { 'nota_final' => 'invalid', 'pontuacao_geral' => { 'versao' => 2, 'parcial' => false } }]
    end

    it 'keeps the average complete-only, includes a real zero, and explains the excluded partial count' do
      get url, params: { filter: 'scored' }, headers: headers, as: :json
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body['metrics']).to include('average_score' => 40.0, 'average_count' => 2, 'partial_count' => 1)
      expect(response.parsed_body['total']).to eq(2)
      expect(response.parsed_body['items'].pluck('id')).to eq(recordings.first(2).reverse)
    end
  end

  context 'when all scores are partial' do
    let(:results) { [{ 'nota_final' => 86, 'pontuacao_geral' => { 'versao' => 2, 'parcial' => true } }] }

    it 'reports a missing average without treating partial scores as complete or as zero' do
      get url, headers: headers, as: :json
      expect(response.parsed_body['metrics']).to include('average_score' => nil, 'average_count' => 0, 'partial_count' => 1)
      get url, params: { filter: 'scored' }, headers: headers, as: :json
      expect(response.parsed_body).to include('total' => 0, 'items' => [])
    end
  end
end
