# frozen_string_literal: true

class JrcContactCenter::EventReconciler
  EVENT_HANDLERS = {
    'call.created' => :process_call_created,
    'call.answered' => :process_call_answered,
    'call.ended' => :process_call_ended,
    'ivr.menu.entered' => :process_ivr_event,
    'ivr.option.selected' => :process_ivr_event,
    'agent.state.changed' => :process_agent_state,
    'coe.fallback.triggered' => :process_fallback,
    'recording.available' => :process_recording
  }.freeze
  SUPPORTED_TYPES = EVENT_HANDLERS.keys.freeze

  def initialize(event_record:)
    @event_record = event_record
    @account = event_record.account
    @payload = event_record.payload.deep_stringify_keys
  end

  def call
    return @event_record if %w[processed ignored].include?(@event_record.status)

    @event_record.with_lock do
      next if %w[processed ignored].include?(@event_record.status)

      @event_record.attempts += 1
      if !@event_record.signature_verified?
        @event_record.update!(status: 'failed', last_error: 'signature_not_verified')
      elsif SUPPORTED_TYPES.include?(@event_record.event_type)
        reconcile_supported_event
      else
        @event_record.update!(status: 'ignored', processed_at: Time.current, last_error: nil)
      end
    end
    @event_record
  end

  private

  def reconcile_supported_event
    JrcContactCenter::ApplicationRecord.transaction(requires_new: true) { process_supported_event }
    @event_record.update!(status: 'processed', processed_at: Time.current, last_error: nil)
  rescue StandardError => e
    @event_record.update!(status: 'failed', last_error: e.message.truncate(2000))
  end

  def process_supported_event
    send(EVENT_HANDLERS.fetch(@event_record.event_type))
  end

  def process_call_answered
    update_session('connected', answered_at: @event_record.occurred_at)
  end

  def process_call_ended
    update_session('ended', ended_at: @event_record.occurred_at)
  end

  def process_call_created
    session = find_session || JrcContactCenter::CallSession.new(account: @account, correlation_id: correlation_id)
    session.assign_attributes(session_identity(session).merge(session_details(session)))
    session.save!
  end

  def session_identity(session)
    {
      provider: @event_record.provider,
      external_session_id: session.external_session_id.presence || @payload['call_session_id'],
      direction: session.direction.presence || value('direction', default: 'inbound'),
      status: session.persisted? ? session.status.presence || 'created' : 'created'
    }
  end

  def session_details(session)
    {
      ani: session.ani.presence || value('ani'),
      dnis: session.dnis.presence || value('dnis'),
      started_at: [session.started_at, @event_record.occurred_at].compact.min,
      metadata: session.metadata.to_h.merge(payload_body)
    }
  end

  def update_session(status, attributes)
    session = find_session!
    if %w[ended failed].include?(session.status)
      session.update!(safe_terminal_attributes(session, attributes))
      return
    end

    session.update!(attributes.merge(status: status))
  end

  def safe_terminal_attributes(session, attributes)
    attributes.each_with_object({}) do |(key, value), safe|
      next if key == :answered_at && session.ended_at && value > session.ended_at
      next if session.public_send(key).present?

      safe[key] = value
    end
  end

  def process_ivr_event
    session = find_session!
    session.ivr_events.create!(
      account: @account,
      external_event_id: @event_record.external_event_id,
      event_type: @event_record.event_type,
      menu_key: value('menu_key'),
      option_key: value('option_key'),
      occurred_at: @event_record.occurred_at,
      payload: payload_body
    )
  end

  def process_agent_state
    account_user = @account.account_users.find(value('account_user_id'))
    JrcContactCenter::AgentStateEvent.create!(
      account: @account,
      account_user: account_user,
      external_event_id: @event_record.external_event_id,
      state: value('state'),
      reason_code: value('reason_code'),
      source: @event_record.provider,
      started_at: @event_record.occurred_at,
      metadata: payload_body
    )
  end

  def process_fallback
    session = find_session!
    session.fallback_events.create!(
      account: @account,
      reason_code: value('reason_code', default: 'provider'),
      result: value('result', default: 'requested'),
      terminal: ActiveModel::Type::Boolean.new.cast(value('terminal', default: false)),
      occurred_at: @event_record.occurred_at,
      metadata: payload_body
    )
  end

  def process_recording
    session = find_session!
    JrcContactCenter::RecordingLink.find_or_create_by!(
      account: @account,
      provider: @event_record.provider,
      external_recording_id: value('recording_id')
    ) do |recording|
      recording.call_session = session
      recording.status = value('status', default: 'available')
      recording.duration_seconds = value('duration_seconds')
      recording.recorded_at = @event_record.occurred_at
      recording.metadata = payload_body.except('url', 'media_url', 'signed_url')
    end
  end

  def find_session
    session = JrcContactCenter::CallSession.find_by(account: @account, correlation_id: correlation_id)
    return session if session || @payload['call_session_id'].blank?

    JrcContactCenter::CallSession.find_by(account: @account, provider: @event_record.provider, external_session_id: @payload['call_session_id'])
  end

  def find_session!
    find_session || raise(ActiveRecord::RecordNotFound, 'contact center call session not found')
  end

  def correlation_id
    @payload['correlation_id'].presence || @payload['call_session_id'].presence || @event_record.external_event_id
  end

  def payload_body
    body = @payload['payload']
    body.is_a?(Hash) ? body.deep_stringify_keys : {}
  end

  def value(key, default: nil)
    @payload[key].presence || payload_body[key].presence || default
  end
end
