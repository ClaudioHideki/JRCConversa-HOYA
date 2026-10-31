import { config, mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import en from 'dashboard/i18n/locale/en/jrcContactCenter.json';
import EmotionalProfile from '../EmotionalProfile.vue';
import ScoreBreakdown from '../ScoreBreakdown.vue';
import AudioAuditResult from '../AudioAuditResult.vue';
import RecordingSignalBadge from '../RecordingSignalBadge.vue';

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

it('separates concrete strengths from improvements and shows the same criterion only once in the calculation', () => {
  const observation = 'O atendimento não conseguiu solucionar o problema.';
  const score = {
    versao: 2,
    nota: 49,
    peso_avaliado: 60,
    pontos_obtidos: 29.4,
    parcial: true,
    grupos: [
      {
        id: 'qualidade',
        peso: 60,
        peso_avaliado: 60,
        pontos: 29.4,
        indicadores: [
          {
            id: 'qualidade',
            grupo: 'qualidade',
            nota: 49,
            escala: 100,
            peso: 60,
            pontos: 29.4,
            pontos_perdidos: 30.6,
            observacao: observation,
            evidencias: ['Vou verificar.'],
          },
        ],
      },
    ],
    mais_contribuiram: ['qualidade'],
    mais_reduziram: ['qualidade'],
  };
  const data = {
    pontos_positivos: ['Procurou orientação técnica.'],
    pontos_negativos: ['Não confirmou o entendimento do cliente.'],
    oportunidades_melhoria: ['Explicar os próximos passos.'],
  };
  const before = JSON.stringify(score);
  const wrapper = mount(ScoreBreakdown, {
    props: { score, result: data },
    global: globalOptions(),
  });
  expect(wrapper.get('[data-testid=score-findings-positive]').text()).toBe(
    'Procurou orientação técnica.'
  );
  expect(
    wrapper.get('[data-testid=score-findings-attention]').text()
  ).toContain('Não confirmou o entendimento');
  expect(
    wrapper.get('[data-testid=score-findings-attention]').text()
  ).toContain('Explicar os próximos passos.');
  const calculation = wrapper.get('[data-testid=score-calculation]');
  expect(calculation.findAll('tbody tr')).toHaveLength(1);
  expect(calculation.text()).toContain('29,4');
  expect(calculation.text()).toContain('30,6');
  expect(wrapper.text().split(observation)).toHaveLength(2);
  expect(calculation.text()).toContain('Vou verificar.');
  expect(JSON.stringify(score)).toBe(before);
});

it('does not manufacture strengths or shortcomings from a generic observation in a historical result', () => {
  const score = {
    nota: 67,
    peso_avaliado: 60,
    pontos_obtidos: 40.2,
    parcial: true,
    grupos: [
      {
        id: 'qualidade',
        peso: 60,
        peso_avaliado: 60,
        pontos: 40.2,
        indicadores: [
          {
            id: 'qualidade',
            grupo: 'qualidade',
            nota: 67,
            escala: 100,
            peso: 60,
            pontos: 40.2,
            pontos_perdidos: 19.8,
            observacao: 'Justificativa geral mista.',
            evidencias: [],
          },
        ],
      },
    ],
    mais_contribuiram: ['qualidade'],
    mais_reduziram: ['qualidade'],
  };
  const wrapper = mount(ScoreBreakdown, {
    props: { score },
    global: globalOptions(),
  });
  expect(wrapper.find('[data-testid=score-findings-positive]').exists()).toBe(
    false
  );
  expect(wrapper.find('[data-testid=score-findings-attention]').exists()).toBe(
    false
  );
  expect(wrapper.text().match(/Justificativa geral mista\./g)).toHaveLength(1);
  expect(wrapper.text()).toContain('40,2');
  expect(wrapper.text()).toContain('19,8');
});

it('shows an identical finding reported on both sides only once for review instead of praising and penalizing it', () => {
  const score = {
    grupos: [],
    nota: null,
    peso_avaliado: 0,
    pontos_obtidos: 0,
    parcial: true,
  };
  const wrapper = mount(ScoreBreakdown, {
    props: {
      score,
      result: {
        pontos_positivos: ['Achado contraditório.', 'Orientação clara.'],
        pontos_negativos: ['Achado contraditório.'],
        oportunidades_melhoria: [
          'Confirmar entendimento.',
          'Confirmar entendimento.',
        ],
      },
    },
    global: globalOptions(),
  });
  expect(wrapper.get('[data-testid=score-findings-positive]').text()).toBe(
    'Orientação clara.'
  );
  expect(wrapper.get('[data-testid=score-findings-attention]').text()).toBe(
    'Confirmar entendimento.'
  );
  expect(
    wrapper.get('[data-testid=score-findings-conflicts]').text()
  ).toContain('Achado contraditório.');
  expect(wrapper.text().match(/Achado contraditório\./g)).toHaveLength(1);
});

it('renders the updated guidance profile with separate agent and customer indicators', () => {
  const data = result();
  data.perfil_emocional.versao = 5;
  data.analise_vocal.versao = 4;
  const wrapper = mount(EmotionalProfile, {
    props: { result: data },
    global: globalOptions(),
  });
  expect(wrapper.get('[role=tab][aria-selected=true]').text()).toBe(
    'Atendente · 80%'
  );
  expect(wrapper.findAll('[data-testid=emotion-metric]')).toHaveLength(12);
  expect(wrapper.text()).toContain('JUSTIFICATIVA AGENTE');
  expect(wrapper.text()).not.toContain('JUSTIFICATIVA CLIENTE');
});

it('explains the human weight transfer without creating a second scored indicator', () => {
  const score = {
    versao: 2,
    nota: 82,
    peso_avaliado: 100,
    parcial: false,
    grupos: [],
    ponderacao_humana: { impacto_nota: 2, pontos_antes: 48, pontos_depois: 50 },
  };
  const wrapper = mount(ScoreBreakdown, {
    props: { score },
    global: globalOptions(),
  });
  expect(wrapper.get('[data-testid=human-weighting]').text()).toContain(
    '48 → 50'
  );
  expect(wrapper.get('[data-testid=human-weighting]').text()).toContain(
    'limitado a ±2'
  );
  expect(score.grupos).toHaveLength(0);
});

it('opens the overview first and places long score and emotional details in their own tabs', async () => {
  const wrapper = mount(AudioAuditResult, {
    props: {
      audit: {
        id: 1,
        account_id: 1,
        filename: 'sample.wav',
        transcript: 'TRANSCRICAO SALVA',
        result: result(),
      },
    },
    global: { ...globalOptions(), stubs: { Icon: true } },
  });
  expect(wrapper.get('[data-testid=audit-tab-header]').classes()).toContain(
    'sticky'
  );
  expect(wrapper.findAll('[role=tab]')).toHaveLength(8);
  expect(wrapper.find('[data-testid=emotional-profile]').exists()).toBe(false);
  expect(wrapper.find('[data-testid=general-score-breakdown]').exists()).toBe(
    false
  );
  await wrapper.get('#audit-tab-positive').trigger('click');
  expect(wrapper.findAll('[data-testid=emotion-metric]')).toHaveLength(7);
  expect(wrapper.text()).toContain('JUSTIFICATIVA AGENTE');
  expect(wrapper.text()).not.toContain('Resolução objetiva');
  const roles = wrapper.findAll('[role=tablist]')[1];
  await roles.findAll('[role=tab]')[1].trigger('click');
  await wrapper.get('#audit-tab-negative').trigger('click');
  expect(wrapper.findAll('[data-testid=emotion-metric]')).toHaveLength(5);
  expect(wrapper.text()).toContain('JUSTIFICATIVA CLIENTE');
  expect(wrapper.text()).not.toContain('JUSTIFICATIVA AGENTE');
  await wrapper.get('#audit-tab-context').trigger('click');
  expect(wrapper.findAll('[data-testid=emotion-metric]')).toHaveLength(0);
  expect(wrapper.text()).toContain('Depende de uma etapa externa.');
  await wrapper.get('#audit-tab-transcript').trigger('click');
  expect(wrapper.get('[role=tabpanel]').text()).toBe('TRANSCRICAO SALVA');
});

it('keeps the selected report tab on data refresh and resets it on account or recording change', async () => {
  const audit = {
    id: 1,
    account_id: 1,
    filename: 'sample.wav',
    result: result(),
  };
  const wrapper = mount(AudioAuditResult, {
    props: { audit },
    global: { ...globalOptions(), stubs: { Icon: true } },
  });
  await wrapper.get('#audit-tab-negative').trigger('click');
  await wrapper.setProps({ audit: { ...audit, result: result() } });
  expect(wrapper.get('#audit-tab-negative').attributes('aria-selected')).toBe(
    'true'
  );
  await wrapper.setProps({ audit: { ...audit, account_id: 2 } });
  expect(wrapper.get('#audit-tab-summary').attributes('aria-selected')).toBe(
    'true'
  );
  await wrapper.get('#audit-tab-positive').trigger('click');
  await wrapper.setProps({ audit: { ...audit, id: 2 } });
  expect(wrapper.get('#audit-tab-summary').attributes('aria-selected')).toBe(
    'true'
  );
});

it('supports keyboard tab navigation and preserves audio and JSON actions', async () => {
  const wrapper = mount(AudioAuditResult, {
    props: { audit: { id: 1, filename: 'sample.wav', result: result() } },
    attachTo: document.body,
    global: { ...globalOptions(), stubs: { Icon: true } },
  });
  await wrapper
    .get('#audit-tab-summary')
    .trigger('keydown', { key: 'ArrowRight' });
  expect(wrapper.get('#audit-tab-score').attributes('aria-selected')).toBe(
    'true'
  );
  expect(document.activeElement.id).toBe('audit-tab-score');
  await wrapper.get('#audit-tab-score').trigger('keydown', { key: 'End' });
  expect(wrapper.get('#audit-tab-transcript').attributes('tabindex')).toBe('0');
  await wrapper
    .get('#audit-tab-transcript')
    .trigger('keydown', { key: 'Home' });
  expect(wrapper.get('#audit-tab-summary').attributes('tabindex')).toBe('0');
  await wrapper
    .findAll('button')
    .find(button => button.text() === 'Ouvir gravação')
    .trigger('click');
  await wrapper
    .findAll('button')
    .find(button => button.text() === 'Baixar relatório JSON')
    .trigger('click');
  expect(wrapper.emitted('play')).toHaveLength(1);
  expect(wrapper.emitted('download')).toHaveLength(1);
  wrapper.unmount();
});

it('shows an explicit missing signal instead of inventing a sentiment or a supervision alert', async () => {
  const wrapper = mount(RecordingSignalBadge, {
    props: { kind: 'alert', value: null },
    global: { ...globalOptions(), stubs: { Icon: true } },
  });
  expect(wrapper.text()).toBe('—');
  await wrapper.setProps({ value: false });
  expect(wrapper.text()).toBe('Não');
  await wrapper.setProps({ value: true });
  expect(wrapper.text()).toBe('Sim');
  expect(wrapper.classes()).toContain('text-rose-900');
  await wrapper.setProps({ kind: 'sentiment', value: 'positivo' });
  expect(wrapper.text()).toBe('Positivo');
  expect(wrapper.classes()).toContain('text-emerald-800');
  await wrapper.setProps({ value: 'nao_identificado' });
  expect(wrapper.text()).toBe('Não identificado');
  expect(wrapper.classes()).toContain('text-n-slate-11');
});
