import { config, mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import en from 'dashboard/i18n/locale/en/jrcContactCenter.json';
import EmotionalProfile from '../EmotionalProfile.vue';
import ScoreBreakdown from '../ScoreBreakdown.vue';

const positive = [
  'satisfacao',
  'confianca',
  'encantamento',
  'atendimento_acolhedor',
  'compreensao',
  'alivio',
];
const negative = [
  'frustracao',
  'decepcao',
  'inseguranca',
  'ansiedade',
  'agressividade',
];
const metric = (role, note = 8) => ({
  nota: note,
  confianca: 'alta',
  evidencias: [`EVIDÊNCIA ${role}`],
  observacao: `JUSTIFICATIVA ${role}`,
});
const roleProfile = role => ({
  identificado: true,
  justificativa_identificacao: `PAPEL ${role}`,
  positivos: Object.fromEntries(positive.map(name => [name, metric(role)])),
  negativos: Object.fromEntries(negative.map(name => [name, metric(role, 0)])),
});
const result = () => ({
  perfil_emocional: {
    versao: 3,
    atendente: roleProfile('AGENTE'),
    cliente: roleProfile('CLIENTE'),
    resolucao: {
      situacao: 'encaminhado',
      justificativa: 'Depende de uma etapa externa.',
      evidencias: ['Encaminhado.'],
    },
    evolucao: {
      resultado: 'dados_insuficientes',
      justificativa: 'Sem momentos suficientes.',
      inicio: { observacao: '', evidencias: [] },
      meio: { observacao: '', evidencias: [] },
      fim: { observacao: '', evidencias: [] },
    },
    limitacoes: [],
  },
  analise_vocal: {
    versao: 2,
    atendente: { identificado: true, sorriso_na_voz: metric('VOZ AGENTE') },
    cliente: { identificado: true, sorriso_na_voz: metric('VOZ CLIENTE') },
    modelo: 'configured-audio',
    limitacoes: '',
  },
});
const globalOptions = () => ({
  plugins: [createI18n({ legacy: false, locale: 'en', messages: { en } })],
});
let oldPlugins;
beforeEach(() => {
  oldPlugins = config.global.plugins;
  config.global.plugins = [];
});
afterEach(() => {
  config.global.plugins = oldPlugins;
});

it('prioritizes the agent and keeps the reference order, welcome indicator and separate audio evidence', () => {
  const wrapper = mount(EmotionalProfile, {
    props: { result: result() },
    global: globalOptions(),
  });
  expect(wrapper.get('[role=tab][aria-selected=true]').text()).toBe(
    'Atendente · 80%'
  );
  expect(wrapper.findAll('[data-testid=emotion-metric]')).toHaveLength(12);
  expect(
    wrapper.findAll('[data-testid=emotion-metric] h4').map(node => node.text())
  ).toEqual([
    'Satisfação',
    'Confiança',
    'Encantamento',
    'Atendimento acolhedor',
    'Compreensão',
    'Alívio',
    'Sorriso na voz',
    'Frustração',
    'Decepção',
    'Insegurança',
    'Ansiedade',
    'Agressividade',
  ]);
  expect(wrapper.text()).toContain('EVIDÊNCIA AGENTE');
  expect(wrapper.text()).toContain('EVIDÊNCIA VOZ AGENTE');
  expect(wrapper.text()).not.toContain('EVIDÊNCIA CLIENTE');
  expect(wrapper.text()).not.toContain('EVIDÊNCIA VOZ CLIENTE');
  expect(wrapper.text()).toContain('Falta de resolução · peso 10');
});

it('switches actor and never borrows a grade or a quote from the other person', async () => {
  const data = result();
  data.perfil_emocional.cliente.positivos.satisfacao.nota = 0;
  const wrapper = mount(EmotionalProfile, {
    props: { result: data },
    global: globalOptions(),
  });
  await wrapper.findAll('[role=tab]')[1].trigger('click');
  expect(wrapper.get('[role=tab][aria-selected=true]').text()).toBe(
    'Cliente · 20%'
  );
  expect(
    wrapper.findAll('[data-testid=emotion-metric]')[0].text().replace(/\s/g, '')
  ).toContain('0/10');
  expect(wrapper.text()).toContain('EVIDÊNCIA CLIENTE');
  expect(wrapper.text()).toContain('EVIDÊNCIA VOZ CLIENTE');
  expect(wrapper.text()).not.toContain('EVIDÊNCIA AGENTE');
  expect(wrapper.text()).not.toContain('EVIDÊNCIA VOZ AGENTE');
});

it('keeps missing agent vocal evidence unassessed instead of copying the customer smile', () => {
  const data = result();
  delete data.analise_vocal.atendente;
  const wrapper = mount(EmotionalProfile, {
    props: { result: data },
    global: globalOptions(),
  });
  const smile = wrapper.findAll('[data-testid=emotion-metric]')[6];
  expect(smile.text()).toContain('Não avaliado');
  expect(smile.text()).not.toContain('EVIDÊNCIA VOZ CLIENTE');
});

it('resets the role and data when a different audit or account replaces the result', async () => {
  const wrapper = mount(EmotionalProfile, {
    props: { result: result() },
    global: globalOptions(),
  });
  await wrapper.findAll('[role=tab]')[1].trigger('click');
  const next = result();
  next.perfil_emocional.atendente.positivos.satisfacao = metric('OUTRA CONTA');
  await wrapper.setProps({ result: next });
  expect(wrapper.get('[role=tab][aria-selected=true]').text()).toBe(
    'Atendente · 80%'
  );
  expect(wrapper.text()).toContain('EVIDÊNCIA OUTRA CONTA');
  expect(wrapper.text()).not.toContain('EVIDÊNCIA CLIENTE');
});

it('preserves the old customer-only report without relabeling it as agent analysis', () => {
  const data = result();
  const actor = data.perfil_emocional.cliente;
  delete actor.positivos.atendimento_acolhedor;
  data.perfil_emocional = { ...data.perfil_emocional, ...actor, versao: 2 };
  data.analise_vocal = { sorriso_na_voz: metric('VOZ ANTIGA') };
  const wrapper = mount(EmotionalProfile, {
    props: { result: data },
    global: globalOptions(),
  });
  expect(wrapper.findAll('[role=tab]')).toHaveLength(0);
  expect(wrapper.findAll('[data-testid=emotion-metric]')).toHaveLength(11);
  expect(wrapper.text()).toContain('Como o cliente se sentiu');
  expect(wrapper.text()).toContain('EVIDÊNCIA VOZ ANTIGA');
});

it('labels every calculated contribution with its actor and preserves different weights for the same indicator', () => {
  const item = (role, weight) => ({
    id: `${role}.satisfacao`,
    indicador: 'satisfacao',
    papel: role,
    prioridade: 10,
    grupo: 'positivos',
    nota: 8,
    escala: 10,
    peso: weight,
    pontos: weight * 0.8,
    pontos_perdidos: weight * 0.2,
    observacao: `JUSTIFICATIVA ${role}`,
    evidencias: [`EVIDÊNCIA ${role}`],
  });
  const score = {
    versao: 2,
    nota: 80,
    peso_avaliado: 100,
    parcial: false,
    pontos_obtidos: 80,
    grupos: [
      {
        id: 'positivos',
        peso: 15,
        peso_avaliado: 15,
        pontos: 12,
        indicadores: [item('atendente', 2.26), item('cliente', 0.57)],
      },
    ],
    mais_contribuiram: ['atendente.satisfacao'],
    mais_reduziram: ['cliente.satisfacao'],
  };
  const wrapper = mount(ScoreBreakdown, {
    props: { score },
    global: globalOptions(),
  });
  expect(wrapper.text()).toContain('Atendente · Satisfação');
  expect(wrapper.text()).toContain('Cliente · Satisfação');
  expect(wrapper.text()).toContain('perfil emocional do atendente 20%');
  expect(wrapper.text()).toContain('2,26%');
  expect(wrapper.text()).toContain('0,57%');
  expect(wrapper.text()).not.toContain('2,5% cada');
});
