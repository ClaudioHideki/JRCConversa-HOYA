import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import JrcContactCenterAPI from 'dashboard/api/jrcContactCenter';
import AgentStatePanel from './AgentStatePanel.vue';

vi.mock('dashboard/api/jrcContactCenter', () => ({
  default: { agentState: vi.fn(), updateAgentState: vi.fn() },
}));
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key, params) => (params ? Object.values(params).join(' ') : key),
  }),
}));

const initialState = {
  state: 'offline',
  state_version: '0',
  provider_confirmed: false,
  eligible: false,
  queues: [],
};

describe('AgentStatePanel', () => {
  beforeEach(() => {
    JrcContactCenterAPI.agentState.mockResolvedValue({
      data: { item: initialState },
    });
  });

  it('shows local intent and does not offer writes to a read-only operator', async () => {
    const wrapper = mount(AgentStatePanel, { props: { accountId: '1' } });
    await flushPromises();
    expect(wrapper.text()).toContain('JRC_CONTACT_CENTER.AGENT.LOCAL_INTENT');
    expect(wrapper.findAll('button')).toHaveLength(0);
    expect(JrcContactCenterAPI.updateAgentState).not.toHaveBeenCalled();
  });

  it('requires a reason before allowing a pause', async () => {
    const wrapper = mount(AgentStatePanel, {
      props: { accountId: '1', canOperate: true },
    });
    await flushPromises();
    const pause = wrapper.findAll('button')[1];
    expect(pause.attributes('disabled')).toBeDefined();
    await wrapper
      .get('select[aria-label="JRC_CONTACT_CENTER.AGENT.REASON"]')
      .setValue('coffee');
    expect(pause.attributes('disabled')).toBeUndefined();
  });

  it('does not display a response from the previous account after navigation', async () => {
    let resolveFirst;
    JrcContactCenterAPI.agentState.mockImplementationOnce(
      () =>
        new Promise(resolve => {
          resolveFirst = resolve;
        })
    );
    const wrapper = mount(AgentStatePanel, { props: { accountId: '1' } });
    await wrapper.setProps({ accountId: '2' });
    await flushPromises();
    resolveFirst({ data: { item: { ...initialState, state: 'in_call' } } });
    await flushPromises();
    expect(wrapper.text()).toContain('JRC_CONTACT_CENTER.AGENT.STATES.offline');
    expect(wrapper.text()).not.toContain(
      'JRC_CONTACT_CENTER.AGENT.STATES.in_call'
    );
  });

  it('offers the eleven structured reasons and sends the selected reason_code before resuming', async () => {
    JrcContactCenterAPI.updateAgentState
      .mockResolvedValueOnce({
        data: {
          item: {
            ...initialState,
            state: 'paused',
            state_version: '1',
            reason_code: 'coffee',
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          item: { ...initialState, state: 'available', state_version: '2' },
        },
      });
    const wrapper = mount(AgentStatePanel, {
      props: { accountId: '1', canOperate: true },
    });
    await flushPromises();
    const reasons = wrapper.get(
      'select[aria-label="JRC_CONTACT_CENTER.AGENT.REASON"]'
    );
    expect(
      reasons.findAll('option').map(option => option.element.value)
    ).toEqual([
      '',
      'bathroom',
      'coffee',
      'lunch',
      'meeting',
      'training',
      'feedback',
      'backoffice',
      'internal_support',
      'technical_issue',
      'rest',
      'end_shift',
    ]);
    await reasons.setValue('coffee');
    await wrapper.findAll('button')[1].trigger('click');
    await flushPromises();
    expect(JrcContactCenterAPI.updateAgentState).toHaveBeenLastCalledWith(
      '1',
      expect.objectContaining({ state: 'paused', reason_code: 'coffee' })
    );
    await wrapper.findAll('button')[0].trigger('click');
    await flushPromises();
    expect(JrcContactCenterAPI.updateAgentState).toHaveBeenLastCalledWith(
      '1',
      expect.objectContaining({
        state: 'available',
        expected_state_version: '1',
      })
    );
    expect(wrapper.text()).toContain(
      'JRC_CONTACT_CENTER.AGENT.STATES.available'
    );
  });

  it('requires a structured selection when restoring a legacy free-text pause reason', async () => {
    JrcContactCenterAPI.agentState.mockResolvedValueOnce({
      data: {
        item: {
          ...initialState,
          state: 'paused',
          reason_code: 'legacy free text',
        },
      },
    });
    const wrapper = mount(AgentStatePanel, {
      props: { accountId: '1', canOperate: true },
    });
    await flushPromises();
    expect(wrapper.findAll('button')[1].attributes('disabled')).toBeDefined();
    await wrapper
      .get('select[aria-label="JRC_CONTACT_CENTER.AGENT.REASON"]')
      .setValue('coffee');
    expect(wrapper.findAll('button')[1].attributes('disabled')).toBeUndefined();
  });
});
