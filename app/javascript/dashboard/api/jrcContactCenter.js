/* global axios */

const base = accountId => {
  const value = String(accountId);
  if (!/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value))) {
    throw new Error('Invalid account context');
  }
  return `/api/v1/accounts/${value}/jrc_contact_center`;
};

export default {
  context: accountId => axios.get(`${base(accountId)}/context`),
  customerContext: (accountId, phone) =>
    axios.get(`${base(accountId)}/customer_context`, { params: { phone } }),
  units: accountId => axios.get(`${base(accountId)}/units`),
  saveUnit: (accountId, unit, id) =>
    id
      ? axios.patch(`${base(accountId)}/units/${Number(id)}`, { unit })
      : axios.post(`${base(accountId)}/units`, { unit }),
  queues: accountId => axios.get(`${base(accountId)}/queues`),
  queueMemberships: (accountId, params = {}) =>
    axios.get(`${base(accountId)}/queue_memberships`, { params }),
  saveQueueMembership: (accountId, queueMembership, id) =>
    id
      ? axios.patch(`${base(accountId)}/queue_memberships/${Number(id)}`, {
          queue_membership: queueMembership,
        })
      : axios.post(`${base(accountId)}/queue_memberships`, {
          queue_membership: queueMembership,
        }),
  saveQueue: (accountId, queue, id) =>
    id
      ? axios.patch(`${base(accountId)}/queues/${Number(id)}`, { queue })
      : axios.post(`${base(accountId)}/queues`, { queue }),
  calls: (accountId, params = {}) =>
    axios.get(`${base(accountId)}/call_sessions`, { params }),
  call: (accountId, id) =>
    axios.get(`${base(accountId)}/call_sessions/${Number(id)}`),
  cases: (accountId, params = {}) =>
    axios.get(`${base(accountId)}/cases`, { params }),
  case: (accountId, id) => axios.get(`${base(accountId)}/cases/${Number(id)}`),
  createCase: (accountId, record) =>
    axios.post(`${base(accountId)}/cases`, { case: record }),
  updateCase: (accountId, id, record) =>
    axios.patch(`${base(accountId)}/cases/${Number(id)}`, { case: record }),
  callbacks: (accountId, params = {}) =>
    axios.get(`${base(accountId)}/callbacks`, { params }),
  createCallback: (accountId, callback) =>
    axios.post(`${base(accountId)}/callbacks`, { callback }),
  updateCallback: (accountId, id, callback) =>
    axios.patch(`${base(accountId)}/callbacks/${Number(id)}`, { callback }),
  routingRules: accountId => axios.get(`${base(accountId)}/routing_rules`),
  saveRoutingRule: (accountId, routingRule, id) =>
    id
      ? axios.patch(`${base(accountId)}/routing_rules/${Number(id)}`, {
          routing_rule: routingRule,
        })
      : axios.post(`${base(accountId)}/routing_rules`, {
          routing_rule: routingRule,
        }),
  reportSummary: (accountId, params = {}) =>
    axios.get(`${base(accountId)}/reports/summary`, { params }),
  integrationCapabilities: accountId =>
    axios.get(`${base(accountId)}/integrations/capabilities`),
};
