import { config, mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import en from 'dashboard/i18n/locale/en/jrcContactCenter.json';
import EmotionMetric from '../EmotionMetric.vue';
import ClassificationBadge from '../ClassificationBadge.vue';

let plugins;
beforeEach(() => {
  plugins = config.global.plugins;
  config.global.plugins = [];
});
afterEach(() => {
  config.global.plugins = plugins;
});
const globalOptions = () => ({
  plugins: [createI18n({ legacy: false, locale: 'en', messages: { en } })],
});

it.each([
  [2, false, 'Desfavorável', 'bg-red-500'],
  [9, false, 'Favorável', 'bg-emerald-500'],
  [5, false, 'Atenção', 'bg-amber-500'],
  [9, true, 'Desfavorável', 'bg-red-500'],
  [0, true, 'Favorável', 'bg-emerald-500'],
  [5, true, 'Atenção', 'bg-amber-500'],
])(
  'signals rating %s and negative=%s by favorability without changing the rating',
  (note, negative, text, color) => {
    const wrapper = mount(EmotionMetric, {
      props: {
        title: 'Indicador',
        negative,
        metric: {
          nota: note,
          confianca: 'alta',
          evidencias: [],
          observacao: 'Observação.',
        },
      },
      global: globalOptions(),
    });
    expect(wrapper.get('[data-testid=metric-signal]').text()).toBe(text);
    expect(wrapper.text().replace(/\s/g, '')).toContain(`${note}/10`);
    expect(wrapper.findAll(`span.${color}`)).toHaveLength(note);
    if (note === 0)
      expect(wrapper.get('[data-testid=metric-signal]').classes()).toContain(
        'text-emerald-800'
      );
  }
);

it('keeps missing data gray rather than turning it into zero or a good signal', () => {
  const wrapper = mount(EmotionMetric, {
    props: {
      title: 'Indicador',
      metric: { nota: null, confianca: 'insuficiente' },
    },
    global: globalOptions(),
  });
  expect(wrapper.get('[data-testid=metric-signal]').text()).toBe(
    'Não avaliado'
  );
  expect(wrapper.text()).toContain('—');
  expect(wrapper.text()).not.toContain('0/10');
  expect(wrapper.findAll('span.bg-n-alpha-2')).toHaveLength(10);
});

it.each([
  ['excelente', 'Excelente', 'bg-teal-50'],
  ['boa', 'Boa', 'bg-emerald-50'],
  ['regular', 'Regular', 'bg-amber-50'],
  ['ruim', 'Ruim', 'bg-orange-50'],
  ['critica', 'Crítica', 'bg-red-50'],
  ['nao_avaliada', 'Não avaliada', 'bg-n-solid-2'],
])(
  'keeps classification %s readable with its own color',
  (value, label, color) => {
    const wrapper = mount(ClassificationBadge, {
      props: { value },
      global: globalOptions(),
    });
    expect(wrapper.text()).toBe(label);
    expect(wrapper.classes()).toContain(color);
  }
);
