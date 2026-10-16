import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { createStore } from 'vuex';
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils';
import { useSipWebphone } from 'dashboard/routes/dashboard/webphone/useSipWebphone';
import CCAPI from 'dashboard/api/jrcContactCenter';
import HoyaInboxWorkspace from './HoyaInboxWorkspace.vue';
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: key => key }) }));
vi.mock('vue-router', async importOriginal => ({
  ...(await importOriginal()),
  useRoute: () => ({ query: {} }),
}));
vi.mock('dashboard/routes/dashboard/webphone/useSipWebphone', () => ({
  useSipWebphone: vi.fn(),
}));
vi.mock('dashboard/api/jrcContactCenter', () => ({
  default: { agentState: vi.fn() },
}));
enableAutoUnmount(afterEach);
let sip;
const props = {
  accountId: 1,
  currentCallId: 7,
  calls: [{ id: 7, ani: 'LOCAL-7', status: 'connected' }],
  inboxFor: () => ({}),
  context: {
    capabilities: { operate: true },
    provider: {
      capabilities: {
        sip_webrtc: 'available',
        hold: 'available',
        transfer_blind: 'available',
      },
    },
  },
};
const store = createStore({
  getters: {
    getSelectedChat: () => ({}),
    'accounts/isFeatureEnabledonAccount': () => () => false,
  },
});
const global = {
  plugins: [store],
  stubs: {
    Dialog: { methods: { open() {}, close() {} }, template: '<div />' },
    RouterLink: { template: '<a><slot /></a>' },
    RouterView: true,
    CallWorkspace: { name: 'CallWorkspace', template: '<div />' },
  },
};
describe('inbox native SIP action guards', () => {
  it('does not invent a ringing state or elapsed time for an unknown call', async () => {
    const wrapper = mount(HoyaInboxWorkspace, {
      props: { ...props, currentCallId: 99, calls: [] },
      global,
    });
    await flushPromises();
    const header = wrapper
      .get('[data-testid="interaction-workspace"]')
      .get('header');
    expect(header.text()).toContain('#99');
    expect(header.text()).not.toContain(
      'JRC_CONTACT_CENTER.INBOX_360.CALL_STATES.ringing'
    );
    expect(header.text()).not.toContain('00:00:00');
  });
  beforeEach(() => {
    sip = {
      accountId: ref(1),
      callId: ref('native-7'),
      incoming: ref(false),
      hasCall: ref(true),
      established: ref(true),
      held: ref(false),
      muted: ref(false),
      holdPending: ref(false),
      errorMessage: ref(''),
      answer: vi.fn(),
      hangup: vi.fn(),
      setMuted: vi.fn(),
      setHold: vi.fn(),
      initialize: vi.fn(),
      connect: vi.fn(),
    };
    useSipWebphone.mockReturnValue(sip);
    CCAPI.agentState.mockResolvedValue({
      data: { item: { state: 'available' } },
    });
  });
  it('never initializes another phone and enables controls only for the matching native call', async () => {
    const wrapper = mount(HoyaInboxWorkspace, { props, global });
    await flushPromises();
    const mute = wrapper.get(
      'button[aria-label="JRC_CONTACT_CENTER.INBOX_360.MUTE"]'
    );
    expect(mute.attributes('disabled')).toBeDefined();
    const nativeWorkspace = wrapper.findComponent({ name: 'CallWorkspace' });
    nativeWorkspace.vm.$emit('loaded', {
      call: { id: 7, external_session_id: 'native-7', status: 'connected' },
      customer: { contacts: [] },
    });
    await flushPromises();
    expect(mute.attributes('disabled')).toBeUndefined();
    await mute.trigger('click');
    expect(sip.setMuted).toHaveBeenCalledWith(true);
    expect(sip.initialize).not.toHaveBeenCalled();
    expect(sip.connect).not.toHaveBeenCalled();
  });
  it('keeps SIP controls disabled for a different Account or call identifier', async () => {
    const wrapper = mount(HoyaInboxWorkspace, { props, global });
    await flushPromises();
    const nativeWorkspace = wrapper.findComponent({ name: 'CallWorkspace' });
    nativeWorkspace.vm.$emit('loaded', {
      call: { id: 7, external_session_id: 'native-8', status: 'connected' },
      customer: { contacts: [] },
    });
    await flushPromises();
    const mute = wrapper.get(
      'button[aria-label="JRC_CONTACT_CENTER.INBOX_360.MUTE"]'
    );
    expect(mute.attributes('disabled')).toBeDefined();
    sip.callId.value = 'native-8';
    sip.accountId.value = 2;
    await flushPromises();
    expect(mute.attributes('disabled')).toBeDefined();
    await mute.trigger('click');
    expect(sip.setMuted).not.toHaveBeenCalled();
  });
  it('does not enable provider actions with unavailable capabilities', async () => {
    const wrapper = mount(HoyaInboxWorkspace, {
      props: {
        ...props,
        context: {
          capabilities: { operate: true },
          provider: { capabilities: {} },
        },
      },
      global,
    });
    await flushPromises();
    const nativeWorkspace = wrapper.findComponent({ name: 'CallWorkspace' });
    nativeWorkspace.vm.$emit('loaded', {
      call: { id: 7, external_session_id: 'native-7', status: 'connected' },
      customer: { contacts: [] },
    });
    await flushPromises();
    ['ANSWER', 'HANGUP', 'MUTE', 'HOLD', 'TRANSFER'].forEach(key => {
      expect(
        wrapper
          .get(`button[aria-label="JRC_CONTACT_CENTER.INBOX_360.${key}"]`)
          .attributes('disabled')
      ).toBeDefined();
    });
    expect(sip.setHold).not.toHaveBeenCalled();
  });
  it('reports native SIP failure without displaying a false success', async () => {
    sip.setHold.mockRejectedValue(new Error('native failure'));
    const wrapper = mount(HoyaInboxWorkspace, { props, global });
    await flushPromises();
    const nativeWorkspace = wrapper.findComponent({ name: 'CallWorkspace' });
    nativeWorkspace.vm.$emit('loaded', {
      call: { id: 7, external_session_id: 'native-7', status: 'connected' },
      customer: { contacts: [] },
    });
    await flushPromises();
    await wrapper
      .get('button[aria-label="JRC_CONTACT_CENTER.INBOX_360.HOLD"]')
      .trigger('click');
    await flushPromises();
    expect(wrapper.get('[role="alert"]').text()).toBe(
      'JRC_CONTACT_CENTER.COMMON.ERROR'
    );
  });
  it('displays a failure stored by the native phone even when its method handles the rejection', async () => {
    sip.setHold.mockImplementation(async () => {
      sip.errorMessage.value = 'Native phone could not hold';
    });
    const wrapper = mount(HoyaInboxWorkspace, { props, global });
    await flushPromises();
    const nativeWorkspace = wrapper.findComponent({ name: 'CallWorkspace' });
    nativeWorkspace.vm.$emit('loaded', {
      call: { id: 7, external_session_id: 'native-7', status: 'connected' },
      customer: { contacts: [] },
    });
    await flushPromises();
    await wrapper
      .get('button[aria-label="JRC_CONTACT_CENTER.INBOX_360.HOLD"]')
      .trigger('click');
    await flushPromises();
    expect(wrapper.get('[role="alert"]').text()).toBe(
      'Native phone could not hold'
    );
  });
});
