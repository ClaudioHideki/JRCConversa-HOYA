class JrcVoiceQuality::AudioAudit < ApplicationRecord
  self.table_name = 'jrc_voice_quality_audio_audits'

  MAX_AUDIO_BYTES = 25.megabytes
  CONTENT_TYPES = %w[
    audio/mpeg audio/mp3 audio/wav audio/x-wav audio/wave audio/vnd.wave
    audio/ogg audio/opus application/ogg audio/mp4 audio/x-m4a
  ].freeze
  EXTENSIONS = %w[.mp3 .wav .ogg .m4a].freeze

  belongs_to :account
  belongs_to :user, optional: true
  has_one_attached :audio

  validates :filename, presence: true
  validates :status, inclusion: { in: %w[queued processing completed failed] }
  validate :valid_audio, on: :create

  scope :completed, -> { where(status: 'completed') }
  scope :current_scores, -> { completed.where("result->'pontuacao_geral'->>'versao' = '2' AND jsonb_typeof(result->'nota_final') = 'number'") }
  scope :scored, -> { current_scores.where("result->'pontuacao_geral'->>'parcial' = 'false'") }
  scope :supervision_alerts, -> { completed.where("result->>'alerta_supervisao' = 'true'") }
  scope :critical_calls, -> { completed.where("result->>'classificacao_ligacao' = 'critica'") }
  scope :hot_conversations, -> { completed.where("result->>'temperatura_conversa' IN ('quente', 'critica')") }
  scope :churn_risk, -> { completed.where("result->>'risco_churn' IN ('alto', 'critico')") }

  HISTORY_FILTERS = %w[all audited scored alerts critical hot churn].freeze

  def self.for_history(filter)
    case filter
    when 'all' then all
    when 'audited' then completed
    when 'scored' then scored
    when 'alerts' then supervision_alerts
    when 'critical' then critical_calls
    when 'hot' then hot_conversations
    when 'churn' then churn_risk
    else raise ArgumentError, 'Unknown recording filter'
    end
  end

  def refreshable_partial?
    status == 'completed' && result.dig('pontuacao_geral', 'parcial') == true &&
      result.dig('perfil_emocional', 'versao').to_i.between?(1, JrcVoiceQuality::ServiceEmotionalProfile::VERSION - 1)
  end

  def summary_payload
    finished = status == 'completed'
    {
      id: id, account_id: account_id, filename: filename, status: status,
      created_at: created_at, completed_at: completed_at, error_code: error_code,
      nota_final: finished ? result['nota_final'] : nil, temperatura_conversa: result['temperatura_conversa'],
      sentimento_cliente: result['sentimento_cliente'], classificacao_ligacao: finished ? result['classificacao_ligacao'] : nil,
      status_monitoria: result['status_monitoria'], alerta_supervisao: result['alerta_supervisao'],
      score_version: result.dig('pontuacao_geral', 'versao'), score_partial: finished && result.dig('pontuacao_geral', 'parcial'),
      refreshable_partial: refreshable_partial?
    }
  end

  def detail_payload
    summary_payload.merge(transcript: transcript, result: result, analysis_model: analysis_model, transcription_model: transcription_model)
  end

  def self.metrics
    done = completed
    total = done.count
    scores = scored
    {
      total: total,
      average_score: scores.average(Arel.sql("(result->>'nota_final')::numeric"))&.round(2)&.to_f,
      average_count: scores.count,
      partial_count: current_scores.where("result->'pontuacao_geral'->>'parcial' = 'true'").count,
      alerts: supervision_alerts.count,
      critical: critical_calls.count,
      hot: hot_conversations.count,
      churn_percent: total.zero? ? nil : (100.0 * churn_risk.count / total).round(1)
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
