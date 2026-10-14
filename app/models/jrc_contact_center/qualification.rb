# frozen_string_literal: true

class JrcContactCenter::Qualification < JrcContactCenter::ApplicationRecord
  belongs_to :call_session, class_name: 'JrcContactCenter::CallSession'
  belongs_to :account_user

  validates :outcome_code, presence: true, length: { maximum: 100 }
  validates :account_user_id, uniqueness: { scope: %i[account_id call_session_id] }
end
