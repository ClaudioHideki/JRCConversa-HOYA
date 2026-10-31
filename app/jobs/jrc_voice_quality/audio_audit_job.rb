class JrcVoiceQuality::AudioAuditJob < ApplicationJob
  queue_as :low

  def perform(audit_id)
    audit = JrcVoiceQuality::AudioAudit.find_by(id: audit_id)
    return unless audit

    return unless claim(audit)

    unless permitted?(audit)
      audit.update!(status: 'failed', error_code: 'access_revoked')
      return
    end

    analyze(audit)
  rescue JrcVoiceQuality::Error => e
    audit&.update!(status: 'failed', error_code: e.code.to_s)
  rescue StandardError => e
    # Never persist or return provider response bodies, credentials or raw exceptions.
    Rails.logger.error("[JRC Voice Quality] audit=#{audit_id} failure=#{e.class.name}")
    audit&.update!(status: 'failed', error_code: 'processing_failed')
  end

  private

  def claim(audit)
    audit.with_lock do
      next false unless audit.status == 'queued'

      audit.update!(status: 'processing', started_at: Time.current, error_code: nil)
      true
    end
  end

  def permitted?(audit)
    member = audit.account.account_users.find_by(user_id: audit.user_id)
    context = { account: audit.account, user: audit.user, account_user: member }
    member && JrcContactCenter::ModulePolicy.new(context, :contact_center).reports?
  end

  def analyze(audit)
    client = JrcVoiceQuality::MonitoringClient.new(account: audit.account)
    raise JrcVoiceQuality::ConfigurationError.new('IA não configurada.', code: :openai_not_configured) unless client.configured?

    transcript = audit.transcript.presence || transcribe(audit, client)
    vocal = vocal_analysis(audit, transcript)
    result = text_analysis(audit, client, transcript, vocal)
    result['analise_vocal'] = vocal
    result = JrcVoiceQuality::OverallScore.apply(result)
    audit.update!(status: 'completed', result: result, completed_at: Time.current)
  end

  def text_analysis(audit, client, transcript, vocal)
    cached = audit.result
    if cached.dig('perfil_emocional', 'versao') == JrcVoiceQuality::ServiceEmotionalProfile::VERSION &&
       audit.analysis_model == client.analysis_model &&
       cached['atribuicao_papeis'] == JrcVoiceQuality::ServiceEmotionalProfile.speaker_context(vocal, transcript: transcript)
      JrcVoiceQuality::ServiceEmotionalProfile.validate!(cached['perfil_emocional'], transcript: transcript)
      return cached
    end

    result = client.analyze!(transcript, vocal: vocal).merge('analise_vocal' => vocal)
    audit.update!(result: result, analysis_model: client.analysis_model)
    result
  end

  def vocal_analysis(audit, transcript)
    client = JrcVoiceQuality::VocalClient.new(account: audit.account)
    cached = audit.result['analise_vocal']
    return cached if cached&.dig('versao') == JrcVoiceQuality::VocalClient::VERSION && cached['modelo'] == client.audio_model

    result = audit.audio.blob.open { |file| client.analyze_audio!(tempfile: file, transcript: transcript) }
    audit.update!(result: audit.result.merge('analise_vocal' => result))
    result
  end

  def transcribe(audit, client)
    audit.update!(transcription_model: client.transcription_model)
    transcript = audit.audio.blob.open do |file|
      # Marcel identifies WhatsApp OGG voice notes as audio/opus.
      content_type = audit.audio.blob.content_type == 'audio/opus' ? 'audio/ogg' : audit.audio.blob.content_type
      client.transcribe!(tempfile: file, filename: audit.filename, content_type: content_type)
    end
    audit.update!(transcript: transcript)
    transcript
  end
end
