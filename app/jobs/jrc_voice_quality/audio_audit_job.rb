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

    audit.update!(analysis_model: client.analysis_model)
    transcript = audit.transcript.presence || transcribe(audit, client)
    result = client.analyze!(transcript)
    audit.update!(status: 'completed', result: result, completed_at: Time.current)
  end

  def transcribe(audit, client)
    audit.update!(transcription_model: client.transcription_model)
    transcript = audit.audio.blob.open do |file|
      client.transcribe!(tempfile: file, filename: audit.filename, content_type: audit.audio.blob.content_type)
    end
    audit.update!(transcript: transcript)
    transcript
  end
end
