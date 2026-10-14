namespace :api, defaults: { format: 'json' } do
  namespace :v1 do
    resources :accounts, only: [] do
      namespace :jrc_contact_center, module: 'accounts/jrc_contact_center' do
        get 'context', to: 'context#show'
        get 'customer_context', to: 'customer_context#show'
        resources :units, only: %i[index create update]
        resources :queues, only: %i[index create update]
        resources :queue_memberships, only: %i[index create update]
        resources :call_sessions, only: %i[index show]
        resources :cases, only: %i[index show create update]
        resources :callbacks, only: %i[index create update]
        resources :routing_rules, only: %i[index create update]
        get 'reports/summary', to: 'reports#summary'
        get 'integrations/capabilities', to: 'integrations#capabilities'
      end
    end
  end
end
