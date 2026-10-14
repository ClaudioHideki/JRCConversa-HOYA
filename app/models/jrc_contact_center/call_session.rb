# frozen_string_literal: true

class JrcContactCenter::CallSession < JrcContactCenter::ApplicationRecord
  DIRECTIONS = %w[inbound outbound].freeze
  STATUSES = %w[created ringing queued connected held transferring ended failed].freeze

  belongs_to :contact, optional: true
  belongs_to :company, class_name: 'JrcCustomers::Company', optional: true
  belongs_to :current_unit, class_name: 'JrcContactCenter::Unit', optional: true
  belongs_to :current_queue, class_name: 'JrcContactCenter::Queue', optional: true
  has_many :legs, class_name: 'JrcContactCenter::CallLeg', dependent: :restrict_with_error
  has_many :ivr_events, class_name: 'JrcContactCenter::IvrEvent', dependent: :restrict_with_error
  has_many :fallback_events, class_name: 'JrcContactCenter::FallbackEvent', dependent: :restrict_with_error

  validates :provider, :correlation_id, :started_at, presence: true
  validates :correlation_id, uniqueness: { scope: :account_id }
  validates :external_session_id, uniqueness: { scope: %i[account_id provider], allow_nil: true }
  validates :direction, inclusion: { in: DIRECTIONS }
  validates :status, inclusion: { in: STATUSES }
  validate :timestamps_are_monotonic

  private

  def timestamps_are_monotonic
    errors.add(:answered_at, 'must not be before started_at') if precedes?(answered_at, started_at)
    errors.add(:ended_at, 'must not be before started_at') if precedes?(ended_at, started_at)
    errors.add(:ended_at, 'must not be before answered_at') if answered_at && precedes?(ended_at, answered_at)
  end

  def precedes?(timestamp, lower_bound)
    timestamp && timestamp < lower_bound
  end
end
