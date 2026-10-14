# frozen_string_literal: true

class JrcContactCenter::CallLeg < JrcContactCenter::ApplicationRecord
  DIRECTIONS = %w[inbound outbound internal].freeze
  STATUSES = %w[created ringing queued connected held transferred ended failed].freeze

  belongs_to :call_session, class_name: 'JrcContactCenter::CallSession'
  belongs_to :parent_leg, class_name: 'JrcContactCenter::CallLeg', optional: true
  belongs_to :queue, class_name: 'JrcContactCenter::Queue', optional: true
  belongs_to :account_user, optional: true

  validates :started_at, presence: true
  validates :external_leg_id, uniqueness: { scope: :account_id, allow_nil: true }
  validates :direction, inclusion: { in: DIRECTIONS }
  validates :status, inclusion: { in: STATUSES }
end
