import { config, flushPromises, mount } from '@vue/test-utils';
import { reactive } from 'vue';
import { createI18n } from 'vue-i18n';
import en from 'dashboard/i18n/locale/en/jrcContactCenter.json';
import API from 'dashboard/api/audioAudits';
import RecordingsPage from '../../views/RecordingsPage.vue';

const state = vi.hoisted(() => ({ route: null }));
vi.mock('vue-router', () => ({ useRoute: () => state.route }));
vi.mock('dashboard/api/audioAudits', () => ({
  default: {
    list: vi.fn(),
    show: vi.fn(),
    upload: vi.fn(),
    retryAnalysis: vi.fn(),
    recording: vi.fn(),
  },
}));
let wrapper;
let plugins;
const record = (id, classification = 'regular') => ({
  id,
  filename: `file-${id}.wav`,
  status: 'completed',
  created_at: '2026-10-31T12:00:00Z',
  classificacao_ligacao: classification,
  nota_final: 64,
  result: { nota_final: 64, classificacao_ligacao: classification },
});
const closeButton = () =>
  wrapper.findAll('button').find(button => button.text() === 'Fechar');
const fileButton = id =>
  wrapper.findAll('button').find(button => button.text() === `file-${id}.wav`);
const oldShow = Object.getOwnPropertyDescriptor(
  HTMLDialogElement.prototype,
  'showModal'
);
const oldClose = Object.getOwnPropertyDescriptor(
  HTMLDialogElement.prototype,
  'close'
);

beforeAll(() => {
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    configurable: true,
    value() {
      this.setAttribute('open', '');
    },
  });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', {
    configurable: true,
    value() {
      if (!this.hasAttribute('open')) return;
      this.removeAttribute('open');
      this.dispatchEvent(new Event('close'));
    },
  });
});
afterAll(() => {
  if (oldShow)
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', oldShow);
  else delete HTMLDialogElement.prototype.showModal;
  if (oldClose)
    Object.defineProperty(HTMLDialogElement.prototype, 'close', oldClose);
  else delete HTMLDialogElement.prototype.close;
});
beforeEach(async () => {
  plugins = config.global.plugins;
  config.global.plugins = [];
  state.route = reactive({ params: { accountId: '1' } });
  vi.clearAllMocks();
  API.list.mockResolvedValue({
    data: {
      items: [record(1, 'critica'), record(2, 'boa'), record(3)],
      metrics: {},
      total: 3,
      configuration: { configured: true },
    },
  });
  API.show.mockImplementation(id =>
    Promise.resolve({ data: { item: record(id) } })
  );
  wrapper = mount(RecordingsPage, {
    attachTo: document.body,
    global: {
      plugins: [createI18n({ legacy: false, locale: 'en', messages: { en } })],
      stubs: {
        Icon: true,
        TeleportWithDirection: { template: '<div><slot /></div>' },
      },
    },
  });
  await flushPromises();
});
afterEach(() => {
  wrapper?.unmount();
  wrapper = null;
  config.global.plugins = plugins;
  document.body.style.overflow = '';
});

it('opens the complete report in a modal and returns to the same history when closed', async () => {
  expect(wrapper.get('dialog').element.open).toBe(false);
  await fileButton(1).trigger('click');
  await flushPromises();
  expect(wrapper.get('dialog').element.open).toBe(true);
  expect(wrapper.get('dialog').attributes('aria-labelledby')).toBe(
    'jrc-audio-report-title'
  );
  expect(wrapper.get('[data-testid=audit-dialog-content]').text()).toContain(
    'Resultado da monitoria'
  );
  expect(document.body.style.overflow).toBe('hidden');
  await closeButton().trigger('click');
  await flushPromises();
  expect(wrapper.get('dialog').element.open).toBe(false);
  expect(wrapper.find('[data-testid=audio-audit-result]').exists()).toBe(false);
  expect(fileButton(1).exists()).toBe(true);
  expect(fileButton(2).exists()).toBe(true);
  expect(document.body.style.overflow).not.toBe('hidden');
});

it('uses colored classification badges in the history without changing the labels', () => {
  const badges = wrapper.findAll('[data-testid=classification-badge]');
  expect(badges.map(node => node.text())).toEqual([
    'Crítica',
    'Boa',
    'Regular',
  ]);
  expect(badges[0].classes()).toContain('bg-red-50');
  expect(badges[1].classes()).toContain('bg-emerald-50');
  expect(badges[2].classes()).toContain('bg-amber-50');
});

it('discards a late response after closing the modal while loading', async () => {
  let finish;
  API.show.mockImplementationOnce(
    () =>
      new Promise(resolve => {
        finish = resolve;
      })
  );
  await fileButton(1).trigger('click');
  await flushPromises();
  expect(wrapper.get('dialog').text()).toContain('Carregando');
  await closeButton().trigger('click');
  await flushPromises();
  finish({ data: { item: record(1) } });
  await flushPromises();
  expect(wrapper.get('dialog').element.open).toBe(false);
  expect(wrapper.find('[data-testid=audio-audit-result]').exists()).toBe(false);
});

it('handles native Escape cancellation and restores page scrolling', async () => {
  await fileButton(1).trigger('click');
  await flushPromises();
  await wrapper.get('dialog').trigger('cancel');
  await flushPromises();
  expect(wrapper.get('dialog').element.open).toBe(false);
  expect(document.body.style.overflow).not.toBe('hidden');
});

it('clears and closes the report on an Account change, including a pending response', async () => {
  let finish;
  API.show.mockImplementationOnce(
    () =>
      new Promise(resolve => {
        finish = resolve;
      })
  );
  await fileButton(1).trigger('click');
  await flushPromises();
  API.list.mockResolvedValue({
    data: {
      items: [],
      metrics: {},
      total: 0,
      configuration: { configured: true },
    },
  });
  state.route.params.accountId = '2';
  await flushPromises();
  finish({ data: { item: record(1) } });
  await flushPromises();
  expect(wrapper.get('dialog').element.open).toBe(false);
  expect(wrapper.text()).not.toContain('file-1.wav');
});

it('keeps errors in the modal and leaves an available close action', async () => {
  API.show.mockRejectedValueOnce({ response: { status: 500 } });
  await fileButton(1).trigger('click');
  await flushPromises();
  expect(wrapper.get('dialog').element.open).toBe(true);
  expect(wrapper.get('dialog [role=alert]').text()).toContain(
    'Não foi possível'
  );
  expect(closeButton().exists()).toBe(true);
});

it('only refreshes an old incomplete result on an explicit click with the consumption notice', async () => {
  API.show.mockResolvedValueOnce({
    data: { item: { ...record(1), refreshable_partial: true } },
  });
  API.retryAnalysis.mockResolvedValue({ data: {} });
  await fileButton(1).trigger('click');
  await flushPromises();
  expect(API.retryAnalysis).not.toHaveBeenCalled();
  expect(wrapper.get('dialog').text()).toContain('com consumo');
  const refreshButton = wrapper
    .findAll('button')
    .find(button => button.text() === 'Atualizar análise incompleta');
  await refreshButton.trigger('click');
  await flushPromises();
  expect(API.retryAnalysis).toHaveBeenCalledExactlyOnceWith(1);
});
