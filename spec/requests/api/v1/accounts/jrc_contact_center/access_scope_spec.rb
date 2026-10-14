# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'JRC Contact Center access scope', type: :request do
  let(:account) { create(:account) }
  let(:agent) { create(:user, account: account, role: :agent) }
  let(:member) { account.account_users.find_by!(user: agent) }
  let(:headers) { agent.create_new_auth_token }
  let(:unit) { JrcContactCenter::Unit.create!(account: account, code: 'SAC', name: 'SAC', kind: 'sac') }
  let(:allowed_queue) { JrcContactCenter::Queue.create!(account: account, unit: unit, code: 'Q1', name: 'Fila 1') }
  let(:hidden_queue) { JrcContactCenter::Queue.create!(account: account, unit: unit, code: 'Q2', name: 'Fila 2') }

  before do
    account.enable_features!('jrc_contact_center')
    JrcContactCenter::QueueMembership.create!(account: account, queue: allowed_queue, account_user: member)
  end

  it 'limits ordinary agents to queues explicitly assigned to them' do
    allowed_case = JrcContactCenter::Case.create!(
      account: account, queue: allowed_queue, protocol: 'CC-ALLOW', channel: 'voice', category: 'general', summary: 'Visible'
    )
    JrcContactCenter::Case.create!(
      account: account, queue: hidden_queue, protocol: 'CC-HIDDEN', channel: 'voice', category: 'general', summary: 'Hidden'
    )

    get "/api/v1/accounts/#{account.id}/jrc_contact_center/cases", headers: headers, as: :json

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch('items').pluck('id')).to eq([allowed_case.id])
  end

  it 'rejects an ordinary agent writing an occurrence outside the assigned queues' do
    post "/api/v1/accounts/#{account.id}/jrc_contact_center/cases",
         params: { case: { queue_id: hidden_queue.id, category: 'general', summary: 'Denied' } }, headers: headers, as: :json

    expect(response).to have_http_status(:unauthorized)
    expect(JrcContactCenter::Case.where(account: account)).to be_empty
  end

  it 'rejects an unassigned occurrence that would disappear from the agent scope' do
    post "/api/v1/accounts/#{account.id}/jrc_contact_center/cases",
         params: { case: { category: 'general', summary: 'No assignment' } }, headers: headers, as: :json

    expect(response).to have_http_status(:unauthorized)
    expect(JrcContactCenter::Case.where(account: account)).to be_empty
  end
end
