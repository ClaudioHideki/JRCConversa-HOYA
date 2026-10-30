require 'minitest/autorun'
require 'active_support/all'
require 'json_schemer'
require 'faraday'
require_relative '../../app/services/jrc_voice_quality'
require_relative '../../app/services/jrc_voice_quality/emotional_profile'
require_relative '../../app/services/jrc_voice_quality/local_analyzer'
require_relative '../../app/services/jrc_voice_quality/openai_client'
require_relative '../../app/services/jrc_voice_quality/monitoring_client'
require_relative '../../app/services/jrc_voice_quality/overall_score'

class EmotionalProfileTest < Minitest::Test
  Profile = JrcVoiceQuality::EmotionalProfile

  def setup
    @transcript = 'Cliente: Estou preocupado. Atendente: O acesso foi restabelecido. Cliente: Agora funciona, obrigado.'
    @metric = { 'nota' => 8, 'confianca' => 'alta', 'evidencias' => ['Agora funciona, obrigado.'], 'observacao' => 'Evidência literal.' }
    @profile = {
      'versao' => 2, 'positivos' => Profile::POSITIVE.index_with { @metric.deep_dup },
      'negativos' => Profile::NEGATIVE.index_with { @metric.deep_dup.merge('nota' => 0) },
      'resolucao' => { 'situacao' => 'resolvido', 'justificativa' => 'Acesso confirmado.', 'evidencias' => ['Agora funciona, obrigado.'] },
      'evolucao' => { 'resultado' => 'melhorou', 'justificativa' => 'Dois momentos distintos.',
                      'inicio' => { 'observacao' => 'Preocupação.', 'evidencias' => ['Estou preocupado.'] },
                      'meio' => { 'observacao' => '', 'evidencias' => [] },
                      'fim' => { 'observacao' => 'Alívio.', 'evidencias' => ['Agora funciona, obrigado.'] } },
      'limitacoes' => []
    }
  end

  def test_valid_profile_remains_identical_and_independent_from_input
    result = Profile.normalize(@profile, transcript: @transcript)
    assert_equal @profile, result
    refute_same @profile, result
    refute_same @profile['positivos']['satisfacao'], result['positivos']['satisfacao']
    assert_equal 0, result.dig('negativos', 'agressividade', 'nota')
  end

  def test_production_failure_pattern_preserves_only_verifiable_indicators
    @profile['negativos']['agressividade']['confianca'] = 'insuficiente'
    @profile['negativos']['inseguranca'].merge!('nota' => nil, 'confianca' => 'alta')
    @profile['positivos'].each_value { |metric| metric['evidencias'] = ['Citação ausente da transcrição.'] }
    @profile['resolucao']['evidencias'] = ['Resolução inventada.']
    result = Profile.normalize(@profile, transcript: @transcript)
    assert_equal [nil], result['positivos'].values.pluck('nota').uniq
    assert_nil result.dig('negativos', 'agressividade', 'nota')
    assert_nil result.dig('negativos', 'inseguranca', 'nota')
    assert_equal 0, result.dig('negativos', 'frustracao', 'nota')
    assert_equal 'nao_identificado', result.dig('resolucao', 'situacao')
    assert_equal @profile['evolucao'], result['evolucao']
    assert_equal 8, result['limitacoes'].size
    assert_equal result, Profile.validate!(result, transcript: @transcript)
  end

  def test_one_fabricated_quote_invalidates_the_whole_indicator_without_salvaging_its_grade
    @profile['positivos']['confianca']['evidencias'] << 'Citação inventada.'
    result = Profile.normalize(@profile, transcript: @transcript)
    metric = result['positivos']['confianca']
    assert_nil metric['nota']
    assert_equal 'insuficiente', metric['confianca']
    assert_empty metric['evidencias']
    refute_includes metric['observacao'], 'Citação inventada.'
    assert_equal 8, result.dig('positivos', 'satisfacao', 'nota')
  end

  def test_absence_is_not_converted_into_zero_or_positive_confidence
    @profile['negativos']['ansiedade'].merge!('nota' => nil, 'confianca' => 'media')
    metric = Profile.normalize(@profile, transcript: @transcript).dig('negativos', 'ansiedade')
    assert_nil metric['nota']
    assert_equal 'insuficiente', metric['confianca']
    assert_empty metric['evidencias']
  end

  def test_null_insufficient_metric_with_no_evidence_stays_unchanged
    @profile['positivos']['alivio'].merge!('nota' => nil, 'confianca' => 'insuficiente', 'evidencias' => [])
    result = Profile.normalize(@profile, transcript: @transcript)
    assert_equal @profile, result
    assert_empty result['limitacoes']
  end

  def test_paraphrases_and_empty_citations_are_never_accepted_as_evidence
    ['Agora está funcionando, muito obrigado.', '', 'Agora funciona, obrigado!'].each do |quote|
      @profile['positivos']['compreensao']['evidencias'] = [quote]
      metric = Profile.normalize(@profile, transcript: @transcript).dig('positivos', 'compreensao')
      assert_nil metric['nota']
      assert_empty metric['evidencias']
    end
  end

  def test_whitespace_normalization_still_accepts_verbatim_evidence
    @profile['positivos']['satisfacao']['evidencias'] = ["Agora funciona,\n obrigado."]
    result = Profile.normalize(@profile, transcript: @transcript)
    assert_equal 8, result.dig('positivos', 'satisfacao', 'nota')
    assert_empty result['limitacoes']
  end

  def test_resolution_without_verified_evidence_is_unknown
    [[], ['Não disse isso.']].each do |quotes|
      @profile['resolucao']['evidencias'] = quotes
      result = Profile.normalize(@profile, transcript: @transcript)
      assert_equal 'nao_identificado', result.dig('resolucao', 'situacao')
      assert_empty result.dig('resolucao', 'evidencias')
      assert_equal @profile['positivos'], result['positivos']
    end
  end

  def test_evolution_with_an_unverifiable_phase_is_not_scored_or_displayed_as_factual
    @profile['evolucao']['fim']['evidencias'] = ['Final inventado.']
    result = Profile.normalize(@profile, transcript: @transcript)
    assert_equal 'dados_insuficientes', result.dig('evolucao', 'resultado')
    %w[inicio meio fim].each do |phase|
      assert_empty result.dig('evolucao', phase, 'evidencias')
      assert_includes result.dig('evolucao', phase, 'observacao'), 'não avaliada'
    end
    assert_equal @profile['resolucao'], result['resolucao']
  end

  def test_improvement_needs_two_distinct_supported_moments
    [[], ['Estou preocupado.']].each do |quotes|
      @profile['evolucao']['fim']['evidencias'] = quotes
      result = Profile.normalize(@profile, transcript: @transcript)
      assert_equal 'dados_insuficientes', result.dig('evolucao', 'resultado')
      assert_empty result.dig('evolucao', 'fim', 'evidencias')
    end
  end

  def test_invalid_structure_and_out_of_range_scores_still_fail
    @profile['positivos']['satisfacao']['nota'] = 11
    assert_raises(JrcVoiceQuality::AnalysisError) { Profile.normalize(@profile, transcript: @transcript) }
    @profile['positivos'].delete('satisfacao')
    assert_raises(JrcVoiceQuality::AnalysisError) { Profile.normalize(@profile, transcript: @transcript) }
    assert_raises(JrcVoiceQuality::AnalysisError) { Profile.normalize(nil, transcript: @transcript) }
  end

  def test_strict_validation_remains_strict_and_normalization_is_idempotent
    @profile['positivos']['satisfacao']['evidencias'] = ['Inventada.']
    before = @profile.deep_dup
    assert_raises(JrcVoiceQuality::AnalysisError) { Profile.validate!(@profile, transcript: @transcript) }
    result = Profile.normalize(@profile, transcript: @transcript)
    assert_equal before, @profile
    assert_equal result, Profile.normalize(result, transcript: @transcript)
  end

  def test_partial_score_excludes_rejected_indicators_from_both_points_and_weights
    @profile['positivos']['satisfacao']['evidencias'] = ['Inventada.']
    @profile['negativos']['agressividade']['confianca'] = 'insuficiente'
    @profile['resolucao']['evidencias'] = []
    result = { 'perfil_emocional' => Profile.normalize(@profile, transcript: @transcript),
               'avaliacao_atendente' => { 'nota_final' => 80 }, 'analise_vocal' => { 'sorriso_na_voz' => @metric.deep_dup } }
    score = JrcVoiceQuality::OverallScore.new(result).call
    assert_equal true, score['parcial']
    assert_equal 85.5, score['peso_avaliado']
    assert_equal 71.0, score['pontos_obtidos']
    assert_equal 83.04, score['nota']
    refute_includes score['mais_contribuiram'], 'agressividade'
    refute_includes score['mais_reduziram'], 'satisfacao'
  end

  def test_only_recording_monitoring_client_normalizes_emotional_evidence
    @profile['positivos']['satisfacao']['evidencias'] = ['Inventada.']
    analysis = { 'perfil_emocional' => @profile.deep_dup, 'avaliacao_atendente_aplicavel' => true, 'avaliacao_atendente' => {} }
    result = JrcVoiceQuality::MonitoringClient.new(account: nil).send(:normalize_analysis, analysis, @transcript)
    assert_nil result.dig('perfil_emocional', 'positivos', 'satisfacao', 'nota')
    assert_equal 8, result.dig('perfil_emocional', 'positivos', 'confianca', 'nota')
    assert_equal @transcript, result['texto_transcrito']
    refute JrcVoiceQuality::OpenaiClient.new(account: nil).send(:analysis_schema)[:properties].key?(:perfil_emocional)
  end
end
