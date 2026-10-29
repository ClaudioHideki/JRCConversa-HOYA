# Uses the same account provider, transcription and scoring contract as the PABX.
class JrcVoiceQuality::MonitoringClient < JrcVoiceQuality::OpenaiClient
  private

  def system_prompt
    super + <<~PROMPT

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
    schema
  end
end
