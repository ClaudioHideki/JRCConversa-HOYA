# frozen_string_literal: true

class JrcContactCenter::MetricsSummary
  def self.from_params(scope:, params:)
    from = Date.iso8601(params.fetch(:from, 30.days.ago.to_date.iso8601))
    to = Date.iso8601(params.fetch(:to, Time.zone.today.iso8601))
    raise ArgumentError, 'invalid report range' if to < from || (to - from).to_i > 366

    new(scope: scope, from: from, to: to)
  end

  def initialize(scope:, from:, to:)
    @scope = scope
    @from = from
    @to = to
  end

  def call
    facts = @scope.where(fact_date: @from..@to)
    totals = JrcContactCenter::DailyFact::COUNTERS.index_with { |column| facts.sum(column) }
    durations = JrcContactCenter::DailyFact::DURATIONS.index_with { |column| facts.sum(column) }
    totals.merge(durations).merge(from: @from, to: @to)
  end
end
