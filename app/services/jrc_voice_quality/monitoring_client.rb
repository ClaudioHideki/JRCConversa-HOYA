# Uses the same account provider, transcription and scoring contract as the PABX.
class JrcVoiceQuality::MonitoringClient < JrcVoiceQuality::OpenaiClient
  private

  def system_prompt
    super + JrcVoiceQuality::EmotionalProfile.instructions + <<~PROMPT

      Para a monitoria enviada manualmente, descreva a sensacao geral da conversa,
      emita um parecer e justifique a nota com evidencias da transcricao.
      Nao invente contexto, falas, intencoes ou eventos ausentes no audio.
      Se nao houver evidencia suficiente, declare que nao foi possivel avaliar.
      Trechos relevantes devem conter somente citacoes presentes na transcricao.
    PROMPT
  end

  def analysis_schema
    schema = super
    %i[sensacao_geral parecer_monitoria justificativa_nota].each do |key|
      schema[:properties][key] = { type: 'string' }
      schema[:required] << key.to_s
    end
    schema[:properties][:trechos_relevantes] = { type: 'array', items: { type: 'string' } }
    schema[:required] << 'trechos_relevantes'
    schema[:properties][:perfil_emocional] = JrcVoiceQuality::EmotionalProfile.schema
    schema[:properties][:avaliacao_atendente_aplicavel] = { type: 'boolean' }
    schema[:required] += %w[perfil_emocional avaliacao_atendente_aplicavel]
    schema
  end

  def normalize_analysis(analysis, transcript)
    JrcVoiceQuality::EmotionalProfile.invalid! unless [true, false].include?(analysis['avaliacao_atendente_aplicavel'])
    analysis['perfil_emocional'] = JrcVoiceQuality::EmotionalProfile.normalize(analysis['perfil_emocional'], transcript: transcript)
    normalized = super
    if analysis['avaliacao_atendente_aplicavel'] == false
      normalized['nota_final'] = nil
      normalized['avaliacao_atendente'] = normalized['avaliacao_atendente'].transform_values { nil }
      normalized['classificacao_ligacao'] = 'nao_avaliada'
      normalized['status_monitoria'] = 'nao_avaliada'
    else
      normalized['classificacao_ligacao'] = classification_from_score(normalized['nota_final'])
      normalized['status_monitoria'] = normalized['alerta_supervisao'] ? 'critica_para_supervisao' : status_from_score(normalized['nota_final'])
    end
    normalized
  end
end
