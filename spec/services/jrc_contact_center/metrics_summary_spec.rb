# frozen_string_literal: true

require 'rails_helper'

RSpec.describe JrcContactCenter::MetricsSummary do
  let(:account) { create(:account) }
  let(:other_account) { create(:account) }

  it 'sums daily facts only from the authorized account scope' do
    JrcContactCenter::DailyFact.create!(account: account, fact_date: Date.current, offered_count: 5, answered_count: 3, talk_seconds: 60)
    JrcContactCenter::DailyFact.create!(account: other_account, fact_date: Date.current, offered_count: 100, answered_count: 100)

    result = described_class.new(scope: JrcContactCenter::DailyFact.where(account: account),
                                 from: Date.current, to: Date.current).call

    expect(result).to include(offered_count: 5, answered_count: 3, talk_seconds: 60)
  end
end
