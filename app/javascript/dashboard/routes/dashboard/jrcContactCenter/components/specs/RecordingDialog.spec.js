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
const oldScroll = Object.getOwnPropertyDescriptor(
  Element.prototype,
  'scrollIntoView'
);

beforeAll(() => {
  Object.defineProperty(Element.prototype, 'scrollIntoView', {
    configurable: true,
    value: vi.fn(),
  });
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
  if (oldScroll)
    Object.defineProperty(Element.prototype, 'scrollIntoView', oldScroll);
  else delete Element.prototype.scrollIntoView;
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

it('colors both the metric card and its inherited number and keeps every card actionable', () => {
  const colors = {
    audited: 'text-sky-800',
    scored: 'text-emerald-800',
    alerts: 'text-amber-800',
    critical: 'text-rose-900',
    hot: 'text-orange-800',
    churn: 'text-fuchsia-900',
  };
  Object.entries(colors).forEach(([id, color]) => {
    const card = wrapper.get(`[data-testid=recording-metric-${id}]`);
    expect(card.element.tagName).toBe('BUTTON');
    expect(card.classes()).toContain(color);
    expect(card.find('p.text-3xl').exists()).toBe(true);
    expect(card.attributes('aria-pressed')).toBe('false');
  });
});

it('filters alerts across pages of ten and resets the page when a different card is selected', async () => {
  API.list.mockResolvedValueOnce({
    data: {
      items: Array.from({ length: 10 }, (_, i) => record(i + 10)),
      total: 12,
      per_page: 10,
      metrics: { total: 23, alerts: 12 },
      configuration: { configured: true },
    },
  });
  await wrapper.get('[data-testid=recording-metric-alerts]').trigger('click');
  await flushPromises();
  expect(API.list).toHaveBeenLastCalledWith(1, 'alerts');
  expect(
    wrapper
      .get('[data-testid=recording-filter-alerts]')
      .attributes('aria-pressed')
  ).toBe('true');
  expect(wrapper.findAll('tbody tr')).toHaveLength(10);
  expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  API.list.mockResolvedValueOnce({
    data: {
      items: [record(20), record(21)],
      total: 12,
      per_page: 10,
      metrics: { total: 23, alerts: 12 },
      configuration: { configured: true },
    },
  });
  await wrapper
    .findAll('button')
    .find(node => node.text() === 'Próxima')
    .trigger('click');
  await flushPromises();
  expect(API.list).toHaveBeenLastCalledWith(2, 'alerts');
  expect(wrapper.findAll('tbody tr')).toHaveLength(2);
  API.list.mockResolvedValueOnce({
    data: {
      items: [record(30)],
      total: 1,
      per_page: 10,
      metrics: { total: 23, alerts: 12, critical: 1 },
      configuration: { configured: true },
    },
  });
  await wrapper.get('[data-testid=recording-metric-critical]').trigger('click');
  await flushPromises();
  expect(API.list).toHaveBeenLastCalledWith(1, 'critical');
  expect(wrapper.text()).toContain('Página 1');
  expect(
    wrapper
      .get('[data-testid=recording-filter-alerts]')
      .attributes('aria-pressed')
  ).toBe('false');
  expect(wrapper.findAll('tbody tr')).toHaveLength(1);
});

it('explains the missing complete-only average and lets the average card show its eligible records', async () => {
  API.list.mockResolvedValue({
    data: {
      items: [],
      total: 0,
      per_page: 10,
      metrics: {
        total: 126,
        average_score: null,
        average_count: 0,
        partial_count: 126,
      },
      configuration: { configured: true },
    },
  });
  await wrapper
    .findAll('button')
    .find(node => node.text() === 'Atualizar histórico')
    .trigger('click');
  await flushPromises();
  expect(wrapper.get('[data-testid=recording-metric-scored]').text()).toContain(
    '—'
  );
  expect(wrapper.text()).toContain('Notas completas na média: 0');
  expect(wrapper.text()).toContain('fora da média: 126');
  expect(wrapper.text()).toContain('ainda não há notas completas elegíveis');
  await wrapper.get('[data-testid=recording-metric-scored]').trigger('click');
  await flushPromises();
  expect(API.list).toHaveBeenLastCalledWith(1, 'scored');
  expect(wrapper.get('tbody').text()).toContain(
    'ainda não há notas completas elegíveis'
  );
  expect(API.retryAnalysis).not.toHaveBeenCalled();
});

it('displays a true zero average without replacing it with the missing-value dash', async () => {
  API.list.mockResolvedValue({
    data: {
      items: [],
      total: 0,
      per_page: 10,
      metrics: { average_score: 0, average_count: 2, partial_count: 0 },
      configuration: { configured: true },
    },
  });
  await wrapper
    .findAll('button')
    .find(node => node.text() === 'Atualizar histórico')
    .trigger('click');
  await flushPromises();
  expect(
    wrapper.get('[data-testid=recording-metric-scored] p.text-3xl').text()
  ).toBe('0');
  expect(wrapper.text()).not.toContain(
    'ainda não há notas completas elegíveis'
  );
});

it('resets the active filter, page and metrics when changing Accounts', async () => {
  await wrapper.get('[data-testid=recording-metric-hot]').trigger('click');
  await flushPromises();
  API.list.mockResolvedValue({
    data: {
      items: [],
      total: 0,
      per_page: 10,
      metrics: {
        total: 0,
        average_score: null,
        average_count: 0,
        partial_count: 0,
      },
      configuration: { configured: true },
    },
  });
  state.route.params.accountId = '2';
  await flushPromises();
  expect(API.list).toHaveBeenLastCalledWith(1, 'all');
  expect(
    wrapper.get('[data-testid=recording-filter-all]').attributes('aria-pressed')
  ).toBe('true');
  expect(
    wrapper.get('[data-testid=recording-metric-hot]').attributes('aria-pressed')
  ).toBe('false');
  expect(wrapper.text()).not.toContain('file-1.wav');
});

it('keeps the complete filename available while limiting its visible text to two lines', () => {
  expect(fileButton(1).classes()).toContain('line-clamp-2');
  expect(fileButton(1).attributes('title')).toBe('file-1.wav');
});

it('keeps the chosen filter when an upload finishes instead of opening a report over that view', async () => {
  let finishUpload;
  API.upload.mockImplementationOnce(
    () =>
      new Promise(resolve => {
        finishUpload = resolve;
      })
  );
  await wrapper.get('.border-dashed').trigger('drop', {
    dataTransfer: {
      files: [new File(['audio'], 'sample.wav', { type: 'audio/wav' })],
    },
  });
  await wrapper
    .findAll('button')
    .find(node => node.text() === 'Analisar gravações (1)')
    .trigger('click');
  await flushPromises();
  await wrapper.get('[data-testid=recording-metric-alerts]').trigger('click');
  await flushPromises();
  finishUpload({ data: { item: { id: 999 } } });
  await flushPromises();
  expect(API.upload).toHaveBeenCalledTimes(1);
  expect(API.list).toHaveBeenLastCalledWith(1, 'alerts');
  expect(API.show).not.toHaveBeenCalled();
  expect(wrapper.get('dialog').element.open).toBe(false);
});
