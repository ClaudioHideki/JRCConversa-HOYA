class JrcVoiceQuality::AudioAudit < ApplicationRecord
  self.table_name = 'jrc_voice_quality_audio_audits'

  MAX_AUDIO_BYTES = 25.megabytes
  CONTENT_TYPES = %w[audio/mpeg audio/mp3 audio/wav audio/x-wav audio/wave audio/vnd.wave audio/ogg application/ogg audio/mp4 audio/x-m4a].freeze
  EXTENSIONS = %w[.mp3 .wav .ogg .m4a].freeze

  belongs_to :account
  belongs_to :user, optional: true
  has_one_attached :audio

  validates :filename, presence: true
  validates :status, inclusion: { in: %w[queued processing completed failed] }
  validate :valid_audio, on: :create

  scope :completed, -> { where(status: 'completed') }

  def summary_payload
    {
      id: id, account_id: account_id, filename: filename, status: status,
      created_at: created_at, completed_at: completed_at, error_code: error_code,
      nota_final: result['nota_final'], temperatura_conversa: result['temperatura_conversa'],
      sentimento_cliente: result['sentimento_cliente'], classificacao_ligacao: result['classificacao_ligacao'],
      status_monitoria: result['status_monitoria'], alerta_supervisao: result['alerta_supervisao']
    }
  end

  def detail_payload
    summary_payload.merge(transcript: transcript, result: result, analysis_model: analysis_model, transcription_model: transcription_model)
  end

  def self.metrics
    done = completed
    total = done.count
    {
      total: total,
      average_score: done.average(Arel.sql("(result->>'nota_final')::numeric"))&.round(2)&.to_f,
      alerts: done.where("result->>'alerta_supervisao' = 'true'").count,
      critical: done.where("result->>'classificacao_ligacao' = 'critica'").count,
      hot: done.where("result->>'temperatura_conversa' IN ('quente', 'critica')").count,
      churn_percent: total.zero? ? nil : (100.0 * done.where("result->>'risco_churn' IN ('alto', 'critico')").count / total).round(1)
    }
  end

  private

  def valid_audio
    unless audio.attached?
      errors.add(:audio, :blank)
      return
    end

    errors.add(:audio, :invalid) unless CONTENT_TYPES.include?(audio.blob.content_type) && EXTENSIONS.include?(File.extname(filename).downcase)
    errors.add(:audio, :too_long, count: MAX_AUDIO_BYTES) unless audio.blob.byte_size.between?(1, MAX_AUDIO_BYTES)
  end
end
