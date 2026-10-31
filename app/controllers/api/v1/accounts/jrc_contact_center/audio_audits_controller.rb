class Api::V1::Accounts::JrcContactCenter::AudioAuditsController < Api::V1::Accounts::JrcContactCenter::BaseController
  before_action -> { authorize_contact_center!(:reports?) }
  PER_PAGE = 10

  def index
    page = [params[:page].to_i, 1].max
    filter = params[:filter].presence || 'all'
    unless JrcVoiceQuality::AudioAudit::HISTORY_FILTERS.include?(filter)
      return render json: base_payload.merge(error: 'invalid_filter'), status: :bad_request
    end

    scope = audits.for_history(filter).order(created_at: :desc, id: :desc)
    render json: base_payload.merge(items: scope.offset((page - 1) * PER_PAGE).limit(PER_PAGE).map(&:summary_payload),
                                    total: scope.count, page: page, per_page: PER_PAGE, filter: filter, metrics: audits.metrics,
                                    configuration: configuration)
  end

  def show
    render json: base_payload.merge(item: audits.find(params[:id]).detail_payload)
  end

  def create
    return render json: base_payload.merge(error: 'openai_not_configured'), status: :unprocessable_entity unless configuration[:configured]

    upload = params[:audio]
    unless upload.is_a?(ActionDispatch::Http::UploadedFile) && upload.size.between?(1, JrcVoiceQuality::AudioAudit::MAX_AUDIO_BYTES)
      return invalid_audio
    end

    audit = audits.new(user: Current.user, filename: File.basename(upload.original_filename), audio: upload)
    return invalid_audio unless audit.save

    JrcVoiceQuality::AudioAuditJob.perform_later(audit.id)
    render json: base_payload.merge(item: audit.summary_payload), status: :accepted
  end

  def retry_analysis
    audit = audits.find(params[:id])
    queued = audit.with_lock do
      next false unless audit.status == 'failed' || audit.refreshable_partial?

      audit.update!(status: 'queued', error_code: nil, completed_at: nil)
      true
    end
    return render json: base_payload.merge(error: 'analysis_not_failed'), status: :conflict unless queued

    JrcVoiceQuality::AudioAuditJob.perform_later(audit.id)
    render json: base_payload.merge(item: audit.summary_payload), status: :accepted
  end

  def audio
    audit = audits.find(params[:id])
    send_data audit.audio.download, type: audit.audio.blob.content_type, filename: audit.filename, disposition: 'inline'
  end

  private

  def invalid_audio
    render json: base_payload.merge(error: 'invalid_audio'), status: :unprocessable_entity
  end

  def audits
    JrcVoiceQuality::AudioAudit.where(account: Current.account)
  end

  def configuration
    client = JrcVoiceQuality::OpenaiClient.new(account: Current.account)
    { configured: client.configured?, max_audio_bytes: JrcVoiceQuality::AudioAudit::MAX_AUDIO_BYTES }
  end
end
