require 'minitest/autorun'
require 'minitest/mock'
require 'active_support/all'
require 'json_schemer'
require 'faraday'
require 'faraday/adapter/test'
require 'tempfile'
require_relative '../../app/services/jrc_voice_quality'
require_relative '../../app/services/jrc_voice_quality/emotional_profile'
require_relative '../../app/services/jrc_voice_quality/service_emotional_profile'
require_relative '../../app/services/jrc_voice_quality/local_analyzer'
require_relative '../../app/services/jrc_voice_quality/openai_client'
require_relative '../../app/services/jrc_voice_quality/monitoring_client'
require_relative '../../app/services/jrc_voice_quality/vocal_client'
require_relative '../../app/services/jrc_voice_quality/overall_score'

class ServiceEmotionalProfileTest < Minitest::Test
  Profile = JrcVoiceQuality::ServiceEmotionalProfile

  def setup
    @transcript = 'Atendente: Bom dia, vou ajudar. Cliente: Estou preocupado. Atendente: O acesso foi restabelecido. Cliente: Agora funciona.'
    @metric = { 'nota' => 10, 'confianca' => 'alta', 'evidencias' => ['Bom dia, vou ajudar.'], 'observacao' => 'Conduta verificável.' }
    @profile = { 'versao' => Profile::VERSION, 'limitacoes' => [] }
    Profile::ROLES.each_key do |role|
      quote = role == 'atendente' ? 'Bom dia, vou ajudar.' : 'Agora funciona.'
      metric = @metric.merge('evidencias' => [quote])
      @profile[role] = { 'identificado' => true, 'justificativa_identificacao' => 'Papel explícito no contexto.',
                         'evidencias_identificacao' => [quote],
                         'positivos' => Profile::POSITIVE_WEIGHTS.except('sorriso_na_voz').keys.index_with { metric.deep_dup },
                         'negativos' => Profile::NEGATIVE_WEIGHTS.keys.index_with { metric.deep_dup.merge('nota' => 0) } }
    end
    @profile['resolucao'] = { 'situacao' => 'resolvido', 'justificativa' => 'Acesso confirmado.', 'evidencias' => ['Agora funciona.'] }
    @profile['evolucao'] = { 'resultado' => 'melhorou', 'justificativa' => 'Dois momentos.',
                            'inicio' => { 'observacao' => 'Preocupado.', 'evidencias' => ['Estou preocupado.'] },
                            'meio' => { 'observacao' => '', 'evidencias' => [] },
                            'fim' => { 'observacao' => 'Acesso confirmado.', 'evidencias' => ['Agora funciona.'] } }
    @voice = { 'versao' => 3, 'limitacoes' => '' }
    Profile::ROLES.each_key do |role|
      @voice[role] = @profile[role].slice('identificado', 'evidencias_identificacao', 'justificativa_identificacao').deep_dup
      @voice[role]['sorriso_na_voz'] = @metric.deep_dup
    end
    @result = { 'perfil_emocional' => @profile, 'avaliacao_atendente' => { 'nota_final' => 100 },
                'analise_vocal' => @voice, 'alerta_supervisao' => false }
  end

  def test_reference_weights_are_exact_and_resolution_is_not_duplicated_as_an_emotion
    assert_equal [10, 9, 8, 8, 7, 6, 5], Profile::POSITIVE_WEIGHTS.values
    assert_equal [9, 8, 8, 7, 6], Profile::NEGATIVE_WEIGHTS.values
    assert_equal 53, Profile::POSITIVE_WEIGHTS.values.sum
    assert_equal 38, Profile::NEGATIVE_WEIGHTS.values.sum
    assert_equal({ 'atendente' => 0.8, 'cliente' => 0.2 }, Profile::ROLES)
    refute Profile::NEGATIVE_WEIGHTS.key?('falta_resolucao')
    assert_equal 10, JrcVoiceQuality::OverallScore::WEIGHTS['resolucao']
  end

  def test_valid_roles_remain_separate_and_input_is_not_mutated
    before = @profile.deep_dup
    result = Profile.normalize(@profile, transcript: @transcript)
    assert_equal before, result
    refute_same @profile, result
    refute_same result['atendente']['positivos'], result['cliente']['positivos']
    assert_equal result, Profile.validate!(result, transcript: @transcript)
  end

  def test_invalid_customer_evidence_cannot_change_or_become_an_agent_score
    @profile['cliente']['positivos']['satisfacao']['evidencias'] = ['Inventada.']
    @profile['cliente']['negativos']['agressividade']['confianca'] = 'insuficiente'
    result = Profile.normalize(@profile, transcript: @transcript)
    assert_nil result.dig('cliente', 'positivos', 'satisfacao', 'nota')
    assert_nil result.dig('cliente', 'negativos', 'agressividade', 'nota')
    assert_equal @profile['atendente'], result['atendente']
    assert result['limitacoes'].all? { |reason| reason.start_with?('cliente:') }
  end

  def test_unidentified_actor_is_unassessed_even_if_the_model_supplied_notes
    @profile['atendente']['evidencias_identificacao'] = ['Inventada.']
    result = Profile.normalize(@profile, transcript: @transcript)
    assert_equal false, result.dig('atendente', 'identificado')
    result['atendente'].values_at('positivos', 'negativos').flat_map(&:values).each do |metric|
      assert_nil metric['nota']
      assert_empty metric['evidencias']
      assert_equal 'insuficiente', metric['confianca']
    end
    assert_equal @profile['cliente'], result['cliente']
    assert_equal result, Profile.normalize(result, transcript: @transcript)
  end

  def test_unidentified_actor_cannot_pass_strict_validation_with_a_zero_grade
    @profile['atendente']['identificado'] = false
    @profile['atendente']['evidencias_identificacao'] = []
    assert_raises(JrcVoiceQuality::AnalysisError) { Profile.validate!(@profile, transcript: @transcript) }
  end

  def test_missing_structure_does_not_silently_fall_back_to_legacy_or_invented_roles
    @profile['atendente']['positivos']['satisfacao']['nota'] = 11
    assert_raises(JrcVoiceQuality::AnalysisError) { Profile.normalize(@profile, transcript: @transcript) }
    assert_raises(JrcVoiceQuality::AnalysisError) { Profile.normalize({ 'versao' => 2 }, transcript: @transcript) }
  end

  def test_complete_maximum_is_exactly_100_without_false_partial_coverage_from_fractional_weights
    score = JrcVoiceQuality::OverallScore.new(@result).call
    assert_equal 2, score['versao']
    assert_equal 100.0, score['nota']
    assert_equal 100.0, score['peso_avaliado']
    assert_equal false, score['parcial']
    items = score['grupos'].flat_map { |group| group['indicadores'] }
    assert_in_delta 20, items.select { |item| item['papel'] == 'atendente' }.sum { |item| item['peso'] }, 1e-8
    assert_in_delta 5, items.select { |item| item['papel'] == 'cliente' }.sum { |item| item['peso'] }, 1e-8
    assert_equal 1, items.count { |item| item['id'] == 'resolucao' }
    assert_equal 27, items.size
  end

  def test_agent_conduct_has_four_times_the_emotional_impact_of_customer_conduct
    scores = Profile::ROLES.keys.map do |role|
      result = @result.deep_dup
      result['perfil_emocional'][role]['positivos'].each_value { |metric| metric['nota'] = 0 }
      result['perfil_emocional'][role]['negativos'].each_value { |metric| metric['nota'] = 10 }
      result['analise_vocal'][role]['sorriso_na_voz']['nota'] = 0
      JrcVoiceQuality::OverallScore.new(result).call['nota']
    end
    assert_equal [80.0, 95.0], scores
  end

  def test_indicator_priorities_are_normalized_within_each_role_and_group
    items = JrcVoiceQuality::OverallScore.new(@result).call['grupos'].flat_map { |group| group['indicadores'] }
    satisfaction = items.find { |item| item['id'] == 'atendente.satisfacao' }
    smile = items.find { |item| item['id'] == 'atendente.sorriso_na_voz' }
    frustration = items.find { |item| item['id'] == 'cliente.frustracao' }
    assert_in_delta 12.0 * 10 / 53, satisfaction['peso'], 1e-8
    assert_in_delta 2.0, satisfaction['peso'] / smile['peso'], 1e-8
    assert_in_delta 2.0 * 9 / 38, frustration['peso'], 1e-8
    assert_equal 'audio', smile['fonte']
    assert_equal 'transcricao', satisfaction['fonte']
    assert_equal 10, satisfaction['prioridade']
  end

  def test_unknown_indicator_is_excluded_without_becoming_zero_or_a_negative_highlight
    @profile['atendente']['positivos']['satisfacao']['evidencias'] = ['Inventada.']
    @result['perfil_emocional'] = Profile.normalize(@profile, transcript: @transcript)
    score = JrcVoiceQuality::OverallScore.new(@result).call
    assert_equal true, score['parcial']
    assert_in_delta 100 - 12.0 * 10 / 53, score['peso_avaliado'], 1e-8
    assert_equal 100.0, score['nota']
    refute_includes score['mais_reduziram'], 'atendente.satisfacao'
  end

  def test_monitoring_client_does_not_grade_an_unidentified_agent
    @profile['atendente']['identificado'] = false
    analysis = { 'perfil_emocional' => @profile, 'avaliacao_atendente_aplicavel' => true,
                 'avaliacao_atendente' => { 'cordialidade' => 10 } }
    result = JrcVoiceQuality::MonitoringClient.new(account: nil).send(:normalize_analysis, analysis, @transcript)
    assert_equal false, result['avaliacao_atendente_aplicavel']
    assert_nil result['nota_final']
    assert result['avaliacao_atendente'].values.all?(&:nil?)
    assert_equal 10, result.dig('perfil_emocional', 'cliente', 'positivos', 'satisfacao', 'nota')
  end

  def test_new_recording_schema_preserves_the_separate_pabx_contract
    client = JrcVoiceQuality::MonitoringClient.new(account: nil)
    assert_equal [5], client.send(:analysis_schema).dig(:properties, :perfil_emocional, :properties, :versao, :enum)
    refute JrcVoiceQuality::OpenaiClient.new(account: nil).send(:analysis_schema)[:properties].key?(:perfil_emocional)
    assert_includes Profile.instructions, 'Nao transfira a agressividade do cliente'
    assert_includes Profile.instructions, 'dependencia de terceiros'
  end

  def test_vocal_identity_and_evidence_are_independent_for_each_role
    @voice['cliente']['identificado'] = false
    @voice['atendente']['sorriso_na_voz']['evidencias'] = ['Tom leve, ritmo receptivo.']
    payload = @voice.except('versao')
    JrcVoiceQuality::VocalClient.new(account: nil).send(:validate!, payload, transcript: @transcript)
    assert_nil payload.dig('cliente', 'sorriso_na_voz', 'nota')
    assert_empty payload.dig('cliente', 'sorriso_na_voz', 'evidencias')
    assert_equal 10, payload.dig('atendente', 'sorriso_na_voz', 'nota')
    assert_equal ['Tom leve, ritmo receptivo.'], payload.dig('atendente', 'sorriso_na_voz', 'evidencias')
  end

  def test_vocal_invalid_structure_still_fails_with_the_specific_error
    error = assert_raises(JrcVoiceQuality::AnalysisError) do
      JrcVoiceQuality::VocalClient.new(account: nil).send(:validate!, { 'cliente_identificado' => true }, transcript: @transcript)
    end
    assert_equal :vocal_analysis_failed, error.code
  end

  def test_a_single_audio_request_receives_real_audio_and_transcript_as_reference_for_role_attribution
    client = JrcVoiceQuality::VocalClient.new(account: nil)
    def client.audio_model = 'configured-audio'
    Tempfile.create(['synthetic-', '.mp3']) do |file|
      file.write('synthetic request-format fixture'); file.flush
      body = client.send(:request_body, file.path, @transcript)
      assert_equal 'configured-audio', body[:model]
      assert_equal ['text'], body[:modalities]
      assert_equal false, body[:store]
      assert_includes body[:messages][1][:content][0][:text], @transcript
      input = body[:messages][1][:content][1][:input_audio]
      assert_equal File.binread(file.path), Base64.strict_decode64(input[:data])
      assert_includes body[:messages][0][:content], 'ATENDENTE e CLIENTE SEPARADAMENTE'
      assert_equal 1, body[:messages][1][:content].count { |item| item[:type] == 'input_audio' }
    end
  end

  def test_audio_anchors_prevent_a_bad_text_identity_quote_from_erasing_supported_agent_metrics
    @profile['atendente']['evidencias_identificacao'] = ['Paráfrase ausente.']
    speakers = Profile.speaker_context(@voice, transcript: @transcript)
    result = Profile.normalize(@profile, transcript: @transcript, speakers: speakers)
    assert_equal true, result.dig('atendente', 'identificado')
    assert_equal ['Bom dia, vou ajudar.'], result.dig('atendente', 'evidencias_identificacao')
    assert_equal 10, result.dig('atendente', 'positivos', 'satisfacao', 'nota')
    assert_equal 0, result.dig('atendente', 'negativos', 'agressividade', 'nota')
    assert_equal @profile['cliente'], result['cliente']
  end

  def test_audio_identity_does_not_validate_an_invented_metric_quote
    @profile['atendente']['evidencias_identificacao'] = ['Paráfrase ausente.']
    @profile['atendente']['positivos']['satisfacao']['evidencias'] = ['Nota sem suporte.']
    result = Profile.normalize(@profile, transcript: @transcript, speakers: Profile.speaker_context(@voice, transcript: @transcript))
    assert_nil result.dig('atendente', 'positivos', 'satisfacao', 'nota')
    assert_equal 10, result.dig('atendente', 'positivos', 'confianca', 'nota')
  end

  def test_audio_recognition_without_a_literal_anchor_cannot_unlock_text_metrics
    @voice['atendente']['evidencias_identificacao'] = ['Frase que não existe.']
    @profile['atendente']['evidencias_identificacao'] = []
    context = Profile.speaker_context(@voice, transcript: @transcript)
    refute context.key?('atendente')
    result = Profile.normalize(@profile, transcript: @transcript, speakers: context)
    assert_equal false, result.dig('atendente', 'identificado')
    assert_nil result.dig('atendente', 'positivos', 'confianca', 'nota')
    assert_empty Profile.speaker_context(@voice.merge('versao' => 2), transcript: @transcript)
  end

  def test_identifying_a_role_never_invents_notes_for_unassessed_metrics
    @profile['atendente']['identificado'] = false
    @profile['atendente']['evidencias_identificacao'] = []
    @profile['atendente'].values_at('positivos', 'negativos').flat_map(&:values).each do |metric|
      metric.merge!('nota' => nil, 'confianca' => 'insuficiente', 'evidencias' => [])
    end
    result = Profile.normalize(@profile, transcript: @transcript, speakers: Profile.speaker_context(@voice, transcript: @transcript))
    assert_equal true, result.dig('atendente', 'identificado')
    assert_nil result.dig('atendente', 'positivos', 'satisfacao', 'nota')
    assert_equal 10, result.dig('cliente', 'positivos', 'satisfacao', 'nota')
  end

  def test_vocal_validation_removes_unverifiable_anchors_without_fabricating_a_transcript_or_a_smile
    payload = @voice.except('versao').deep_dup
    payload['atendente']['evidencias_identificacao'] << 'Invenção.'
    payload['cliente']['evidencias_identificacao'] = ['Outra invenção.']
    JrcVoiceQuality::VocalClient.new(account: nil).send(:validate!, payload, transcript: @transcript)
    assert_equal ['Bom dia, vou ajudar.'], payload.dig('atendente', 'evidencias_identificacao')
    assert_empty payload.dig('cliente', 'evidencias_identificacao')
    assert_equal 10, payload.dig('atendente', 'sorriso_na_voz', 'nota')
  end

  def test_pabx_messages_remain_unchanged_without_any_audio_context
    client = JrcVoiceQuality::OpenaiClient.new(account: nil)
    messages = client.send(:analysis_messages, @transcript)
    assert_equal %w[system user], messages.map { |message| message[:role] }
    assert_equal "Analise a ligacao abaixo como monitoria de qualidade de call center.\n\nTranscricao:\n#{@transcript}\n",
                 messages.last[:content]
  end

  def test_grounded_context_is_sent_as_user_data_preserves_the_transcript_and_never_leaks_to_the_next_request
    @profile['atendente']['evidencias_identificacao'] = ['Citação incorreta.']
    response = @result.except('analise_vocal').merge('avaliacao_atendente_aplicavel' => true).to_json
    requests = []
    connection = Faraday.new do |faraday|
      faraday.adapter :test do |adapter|
        adapter.post('chat/completions') do |request|
          requests << JSON.parse(request.body)
          [200, {}, { choices: [{ message: { content: response } }] }.to_json]
        end
      end
    end
    provider = Struct.new(:default_model).new('local-text')
    client = JrcVoiceQuality::MonitoringClient.new(account: nil)
    client.stub(:provider, provider) do
      client.stub(:json_connection, connection) do
        first = client.analyze!(@transcript, vocal: @voice)
        second = client.analyze!(@transcript)
        assert_equal @transcript, first['texto_transcrito']
        assert_equal true, first.dig('perfil_emocional', 'atendente', 'identificado')
        assert_equal 10, first.dig('perfil_emocional', 'atendente', 'positivos', 'satisfacao', 'nota')
        assert_equal false, second.dig('perfil_emocional', 'atendente', 'identificado')
        assert_empty second['atribuicao_papeis']
      end
    end
    assert_includes requests[0]['messages'].last['content'], 'Atribuicao contextual pelo audio'
    refute_includes requests[0]['messages'].first['content'], 'Bom dia, vou ajudar.'
    refute_includes requests[1]['messages'].last['content'], 'Atribuicao contextual pelo audio'
  end

  def test_audio_limitation_excludes_the_smile_without_assigning_zero_or_changing_other_scores
    @voice['versao'] = JrcVoiceQuality::VocalClient::VERSION
    @voice['atendente']['sorriso_na_voz'] = {
      'nota' => nil, 'confianca' => 'insuficiente', 'evidencias' => [],
      'observacao' => 'Nao avaliavel por limitacao do audio: voz abafada.'
    }
    @voice['limitacoes'] = 'Voz abafada impede avaliar a expressao vocal do atendente.'
    client = JrcVoiceQuality::VocalClient.new(account: nil)
    client.send(:validate!, @voice.except('versao'), transcript: @transcript)
    assert_equal true, Profile.speaker_context(@voice, transcript: @transcript).dig('atendente', 'identificado')
    score = JrcVoiceQuality::OverallScore.new(@result).call
    smile = score['grupos'].flat_map { |group| group['indicadores'] }.find do |item|
      item['papel'] == 'atendente' && item['indicador'] == 'sorriso_na_voz'
    end
    assert_nil smile['nota']
    assert_equal true, score['parcial']
    assert_equal 100, score['nota']
    assert_operator score['peso_avaliado'], :<, 100
    assert_equal [5], Profile.schema.dig(:properties, :versao, :enum)
  end

  def test_human_weighting_moves_existing_weight_and_is_idempotent
    assessment = JrcVoiceQuality::OverallScore::HUMAN_CRITERIA.index_with { 10 }
    @result['avaliacao_atendente'] = assessment.merge('experiencia_cliente' => 0, 'resolucao_problema' => 15, 'nota_final' => 85)
    before = @result.deep_dup
    score = JrcVoiceQuality::OverallScore.new(@result).call
    assert_equal 93, score['nota']
    assert_equal 2, score.dig('ponderacao_humana', 'impacto_nota')
    assert_equal 60, score['grupos'].find { |group| group['id'] == 'qualidade' }['peso']
    assert_equal 100, score['peso_total']
    assert_equal before, @result
    once = JrcVoiceQuality::OverallScore.apply(@result)
    assert_equal once, JrcVoiceQuality::OverallScore.apply(once)
    legacy = @result.deep_dup
    legacy['perfil_emocional']['versao'] = 4
    assert_equal 91, JrcVoiceQuality::OverallScore.new(legacy).call['nota']
    assert_nil JrcVoiceQuality::OverallScore.new(legacy).call['ponderacao_humana']
  end

  def test_partial_coverage_does_not_amplify_the_two_point_redistribution
    assessment = JrcVoiceQuality::OverallScore::HUMAN_CRITERIA.index_with { 10 }
    @result['avaliacao_atendente'] = assessment.merge('experiencia_cliente' => 0, 'resolucao_problema' => 15, 'nota_final' => 85)
    @profile['atendente']['positivos'].each_value { |metric| metric['nota'] = nil }
    score = JrcVoiceQuality::OverallScore.new(@result).call
    assert_equal true, score['parcial']
    assert_equal 2, score.dig('ponderacao_humana', 'impacto_nota')
    assert_operator score.dig('ponderacao_humana', 'peso_transferido'), :<, 2
  end

  def test_weight_redistribution_is_not_a_guaranteed_bonus_and_does_not_fill_missing_grades
    assessment = JrcVoiceQuality::OverallScore::HUMAN_CRITERIA.index_with { 0 }
    @result['avaliacao_atendente'] = assessment.merge('experiencia_cliente' => 15, 'resolucao_problema' => 15, 'nota_final' => 30)
    score = JrcVoiceQuality::OverallScore.new(@result).call
    assert_equal(-2, score.dig('ponderacao_humana', 'impacto_nota'))
    assert_equal 56, score['nota']
    @result['avaliacao_atendente']['empatia'] = nil
    assert_nil JrcVoiceQuality::OverallScore.new(@result).call['ponderacao_humana']
    @result['avaliacao_atendente'] = { 'nota_final' => nil }
    score = JrcVoiceQuality::OverallScore.new(@result).call
    assert_nil score['ponderacao_humana']
    assert_nil score['grupos'].first['indicadores'].first['nota']
  end

end
