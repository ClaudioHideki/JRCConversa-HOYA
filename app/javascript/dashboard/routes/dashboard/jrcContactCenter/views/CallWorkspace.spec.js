import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import JrcContactCenterAPI from 'dashboard/api/jrcContactCenter';
import CallWorkspace from './CallWorkspace.vue';

vi.mock('dashboard/api/jrcContactCenter', () => ({
  default: {
    call: vi.fn(),
    agentState: vi.fn(),
    customerContext: vi.fn(),
    createCommand: vi.fn(),
    createCase: vi.fn(),
    createCallback: vi.fn(),
  },
}));
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: key => key }) }));

describe('CallWorkspace', () => {
  beforeEach(() => {
    JrcContactCenterAPI.call.mockResolvedValue({
      data: {
        item: {
          id: 10,
          direction: 'inbound',
          ani: '551100000000',
          status: 'connected',
        },
      },
    });
    JrcContactCenterAPI.agentState.mockResolvedValue({
      data: { item: { account_user_id: '20' } },
    });
    JrcContactCenterAPI.customerContext.mockResolvedValue({
      data: { contacts: [] },
    });
  });

  it('blocks provider transfers and keeps the existing webphone closed while capabilities are pending', async () => {
    const wrapper = mount(CallWorkspace, {
      props: {
        accountId: '1',
        callId: 10,
        context: {
          capabilities: { operate: true },
          provider: { capabilities: { sip_webrtc: 'pending_contract' } },
        },
      },
      global: { stubs: { RouterLink: true } },
    });
    await flushPromises();
    await wrapper.find('input').setValue('1001');
    const buttons = wrapper.findAll('button').slice(0, 2);
    expect(
      buttons.every(button => button.attributes('disabled') !== undefined)
    ).toBe(true);
    expect(wrapper.findComponent({ name: 'RouterLink' }).exists()).toBe(false);
    expect(JrcContactCenterAPI.createCommand).not.toHaveBeenCalled();
  });

  it('does not show occurrence or callback mutation controls to read-only users', async () => {
    const wrapper = mount(CallWorkspace, {
      props: {
        accountId: '1',
        callId: 10,
        context: { capabilities: { operate: false } },
      },
      global: { stubs: { RouterLink: true } },
    });
    await flushPromises();
    expect(wrapper.findAll('button')).toHaveLength(0);
    expect(JrcContactCenterAPI.createCase).not.toHaveBeenCalled();
    expect(JrcContactCenterAPI.createCallback).not.toHaveBeenCalled();
  });
});
