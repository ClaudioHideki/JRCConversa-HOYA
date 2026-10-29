class CreateJrcVoiceQualityAudioAudits < ActiveRecord::Migration[7.1]
  def change
    create_table :jrc_voice_quality_audio_audits do |t|
      t.references :account, null: false, foreign_key: true
      t.references :user, foreign_key: { on_delete: :nullify }
      t.string :filename, null: false
      t.string :status, null: false, default: 'queued'
      t.text :transcript
      t.jsonb :result, null: false, default: {}
      t.string :analysis_model
      t.string :transcription_model
      t.string :error_code
      t.datetime :started_at
      t.datetime :completed_at
      t.timestamps
    end
    add_index :jrc_voice_quality_audio_audits, [:account_id, :created_at], name: 'idx_voice_quality_audits_history'
    add_check_constraint :jrc_voice_quality_audio_audits, "status IN ('queued', 'processing', 'completed', 'failed')",
                         name: 'voice_quality_audit_status'
  end
end
