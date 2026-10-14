# frozen_string_literal: true

class JrcContactCenter::CommandDispatcher
  def initialize(account:, actor_account_user:, adapter: nil)
    @account = account
    @actor_account_user = actor_account_user
    @adapter = adapter || JrcContactCenter::Providers::JrcPabxAdapter.new(account: account)
  end

  def call(action:, parameters:, **options)
    options.assert_valid_keys(:call_session, :reason_code, :expected_state_version, :command_id)
    command = create_command(action, parameters, options)
    response = @adapter.dispatch(command)
    command.update!(status: 'accepted_by_gateway', response: response.to_h)
    command
  rescue JrcContactCenter::Providers::BaseAdapter::CapabilityUnavailable => e
    command&.update!(status: 'unknown', response: { 'error' => e.message })
    raise
  end

  private

  def create_command(action, parameters, options)
    JrcContactCenter::Command.create!(
      options.slice(:call_session, :reason_code, :expected_state_version).merge(
        account: @account, actor_account_user: @actor_account_user,
        command_id: options.fetch(:command_id) { SecureRandom.uuid }, action: action,
        parameters: parameters.to_h, requested_at: Time.current
      )
    )
  end
end
