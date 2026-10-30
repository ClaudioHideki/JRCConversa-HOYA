<script setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import Icon from 'dashboard/components-next/icon/Icon.vue';
import EmotionalProfile from './EmotionalProfile.vue';
import ScoreBreakdown from './ScoreBreakdown.vue';

const props = defineProps({ audit: { type: Object, required: true } });
const emit = defineEmits(['download', 'play']);
const { t, tm } = useI18n();
const tab = ref('summary');
const result = computed(() => props.audit.result || {});
const label = value =>
  tm('JRC_CONTACT_CENTER.RECORDINGS.VALUES')[value] || value || '—';
const tabs = computed(() => [
  { id: 'summary', label: t('JRC_CONTACT_CENTER.RECORDINGS.SUMMARY_TAB') },
  { id: 'criteria', label: t('JRC_CONTACT_CENTER.RECORDINGS.CRITERIA_TAB') },
  { id: 'audit', label: t('JRC_CONTACT_CENTER.RECORDINGS.AUDIT_TAB') },
  {
    id: 'transcript',
    label: t('JRC_CONTACT_CENTER.RECORDINGS.TRANSCRIPT_TAB'),
  },
]);
const indicators = computed(() => [
  [
    t('JRC_CONTACT_CENTER.RECORDINGS.TEMPERATURE'),
    result.value.temperatura_conversa,
  ],
  [
    t('JRC_CONTACT_CENTER.RECORDINGS.CUSTOMER_SENTIMENT'),
    result.value.sentimento_cliente,
  ],
  [
    t('JRC_CONTACT_CENTER.RECORDINGS.AGENT_SENTIMENT'),
    result.value.sentimento_atendente,
  ],
  [t('JRC_CONTACT_CENTER.RECORDINGS.CHURN'), result.value.risco_churn],
  [
    t('JRC_CONTACT_CENTER.RECORDINGS.COMPLAINT_RISK'),
    result.value.risco_reclamacao,
  ],
  [t('JRC_CONTACT_CENTER.RECORDINGS.CUSTOMER_TONE'), result.value.tom_cliente],
  [t('JRC_CONTACT_CENTER.RECORDINGS.AGENT_TONE'), result.value.tom_atendente],
]);
const scoreLabels = computed(() => tm('JRC_CONTACT_CENTER.RECORDINGS.SCORES'));
const behaviorLabels = computed(() =>
  tm('JRC_CONTACT_CENTER.RECORDINGS.BEHAVIORS')
);
const sections = computed(() => [
  [t('JRC_CONTACT_CENTER.RECORDINGS.POSITIVES'), result.value.pontos_positivos],
  [t('JRC_CONTACT_CENTER.RECORDINGS.NEGATIVES'), result.value.pontos_negativos],
  [
    t('JRC_CONTACT_CENTER.RECORDINGS.IMPROVEMENTS'),
    result.value.oportunidades_melhoria,
  ],
  [
    t('JRC_CONTACT_CENTER.RECORDINGS.TRAINING'),
    result.value.treinamento_recomendado,
  ],
  [
    t('JRC_CONTACT_CENTER.RECORDINGS.EXCERPTS'),
    result.value.trechos_relevantes,
  ],
]);
const excerpt = value => {
  if (typeof value === 'string') return value;
  return Object.values(value || {})
    .filter(item => typeof item === 'string')
    .join(' · ');
};
</script>

<template>
  <section
    class="min-w-0 rounded-2xl border border-n-weak bg-n-solid-1 p-4 shadow-sm md:p-6"
    data-testid="audio-audit-result"
  >
    <header
      class="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-n-weak pb-4"
    >
      <div class="min-w-0">
        <h2 class="text-lg font-bold text-n-slate-12">
          {{ t('JRC_CONTACT_CENTER.RECORDINGS.RESULT_TITLE') }}
        </h2>
        <p class="mt-1 break-all text-xs text-n-slate-10">
          {{ audit.filename }}
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="flex items-center gap-2 rounded-lg border border-n-weak px-3 py-2 text-sm hover:bg-n-alpha-2"
          @click="emit('play')"
        >
          <Icon icon="i-lucide-play" class="size-4" />{{
            t('JRC_CONTACT_CENTER.RECORDINGS.LISTEN')
          }}
        </button>
        <button
          type="button"
          class="flex items-center gap-2 rounded-lg border border-n-weak px-3 py-2 text-sm hover:bg-n-alpha-2"
          @click="emit('download')"
        >
          <Icon icon="i-lucide-download" class="size-4" />{{
            t('JRC_CONTACT_CENTER.RECORDINGS.DOWNLOAD')
          }}
        </button>
      </div>
    </header>
    <div
      class="mb-5 grid min-w-0 gap-4 rounded-xl border border-n-weak bg-n-solid-2 p-4 2xl:grid-cols-[1fr_260px]"
    >
      <dl class="grid min-w-0 grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-4">
        <div
          v-for="[title, value] in indicators"
          :key="title"
          class="min-w-0 rounded-xl border border-n-weak bg-n-solid-1 p-3"
        >
          <dt
            class="text-[10px] font-bold uppercase tracking-wide text-n-slate-9"
          >
            {{ title }}
          </dt>
          <dd class="mt-2 break-words text-xs font-semibold text-n-slate-12">
            {{ label(value) }}
          </dd>
        </div>
      </dl>
      <div
        class="flex items-center gap-4 rounded-xl border border-n-weak bg-n-solid-1 p-4"
      >
        <div
          class="flex size-20 shrink-0 flex-col items-center justify-center rounded-full border-4 border-amber-400 text-2xl font-bold text-n-slate-12"
        >
          {{ result.nota_final ?? '—'
          }}<span class="text-xs font-normal text-n-slate-9">{{
            t('JRC_CONTACT_CENTER.RECORDINGS.OUT_OF_100')
          }}</span>
        </div>
        <div class="min-w-0 space-y-2 text-xs">
          <p class="font-bold">
            {{
              result.pontuacao_geral
                ? t('JRC_CONTACT_CENTER.RECORDINGS.GENERAL_SCORE.LABEL')
                : t('JRC_CONTACT_CENTER.RECORDINGS.LEGACY_SCORE')
            }}
          </p>
          <p
            v-if="result.pontuacao_geral?.parcial"
            class="font-semibold text-amber-700"
          >
            {{ t('JRC_CONTACT_CENTER.RECORDINGS.PARTIAL_SCORE') }}
          </p>
          <p class="font-bold">{{ label(result.classificacao_ligacao) }}</p>
          <p>{{ label(result.status_monitoria) }}</p>
          <p
            class="font-semibold"
            :class="
              result.alerta_supervisao ? 'text-red-600' : 'text-n-slate-10'
            "
          >
            {{
              t('JRC_CONTACT_CENTER.RECORDINGS.ALERT_VALUE', {
                value: label(String(result.alerta_supervisao)),
              })
            }}
          </p>
        </div>
      </div>
    </div>
    <p class="mb-4 text-xs leading-relaxed text-n-slate-10">
      {{ t('JRC_CONTACT_CENTER.RECORDINGS.AI_NOTICE') }}
    </p>
    <ScoreBreakdown
      v-if="result.pontuacao_geral"
      :score="result.pontuacao_geral"
    />
    <EmotionalProfile :result="result" />
    <div
      class="mb-4 flex gap-2 overflow-x-auto border-b border-n-weak pb-2"
      role="tablist"
      :aria-label="t('JRC_CONTACT_CENTER.RECORDINGS.RESULT_TITLE')"
    >
      <button
        v-for="item in tabs"
        :id="`audit-tab-${item.id}`"
        :key="item.id"
        type="button"
        role="tab"
        :aria-selected="tab === item.id"
        :aria-controls="`audit-panel-${item.id}`"
        class="shrink-0 rounded-lg px-4 py-2 text-xs font-semibold"
        :class="
          tab === item.id
            ? 'bg-n-blue-9 text-white'
            : 'text-n-slate-10 hover:bg-n-alpha-2'
        "
        @click="tab = item.id"
      >
        {{ item.label }}
      </button>
    </div>
    <div
      :id="`audit-panel-${tab}`"
      role="tabpanel"
      :aria-labelledby="`audit-tab-${tab}`"
    >
      <div v-if="tab === 'summary'" class="grid gap-4 lg:grid-cols-2">
        <section class="min-w-0 rounded-xl border border-n-weak p-4">
          <h3 class="mb-3 font-semibold">
            {{ t('JRC_CONTACT_CENTER.RECORDINGS.SERVICE_SUMMARY') }}
          </h3>
          <p class="whitespace-pre-wrap break-words text-sm leading-relaxed">
            {{ result.resumo_conversa || '—' }}
          </p>
          <h3 class="mb-3 mt-6 font-semibold">
            {{ t('JRC_CONTACT_CENTER.RECORDINGS.SUBJECTS') }}
          </h3>
          <div class="flex flex-wrap gap-2">
            <p
              v-for="subject in result.assuntos_abordados || []"
              :key="subject"
              class="rounded-full bg-n-blue-2 px-3 py-1 text-xs text-n-blue-11"
            >
              {{ subject }}
            </p>
          </div>
        </section>
        <dl class="space-y-4 rounded-xl border border-n-weak p-4 text-sm">
          <div>
            <dt class="font-semibold">
              {{ t('JRC_CONTACT_CENTER.RECORDINGS.CONTEXT') }}
            </dt>
            <dd class="mt-1 break-words">{{ result.sensacao_geral || '—' }}</dd>
          </div>
          <div>
            <dt class="font-semibold">
              {{ t('JRC_CONTACT_CENTER.RECORDINGS.OPINION') }}
            </dt>
            <dd class="mt-1 break-words">
              {{ result.parecer_monitoria || '—' }}
            </dd>
          </div>
          <div>
            <dt class="font-semibold">
              {{ t('JRC_CONTACT_CENTER.RECORDINGS.SCORE_REASON') }}
            </dt>
            <dd class="mt-1 break-words">
              {{ result.justificativa_nota || '—' }}
            </dd>
          </div>
          <div>
            <dt class="font-semibold">
              {{ t('JRC_CONTACT_CENTER.RECORDINGS.CONFIDENCE') }}
            </dt>
            <dd class="mt-1">{{ label(result.confianca_analise) }}</dd>
          </div>
          <div>
            <dt class="font-semibold">
              {{ t('JRC_CONTACT_CENTER.RECORDINGS.TRANSCRIPTION_CONFIDENCE') }}
            </dt>
            <dd class="mt-1">{{ label(result.confianca_transcricao) }}</dd>
          </div>
          <div>
            <dt class="font-semibold">
              {{ t('JRC_CONTACT_CENTER.RECORDINGS.TRANSCRIPTION_NOTE') }}
            </dt>
            <dd class="mt-1 break-words">
              {{ result.observacao_transcricao || '—' }}
            </dd>
          </div>
          <div>
            <dt class="font-semibold">
              {{ t('JRC_CONTACT_CENTER.RECORDINGS.ALERT_REASON') }}
            </dt>
            <dd class="mt-1 break-words">{{ result.motivo_alerta || '—' }}</dd>
          </div>
        </dl>
      </div>
      <div v-else-if="tab === 'criteria'" class="grid gap-4 lg:grid-cols-2">
        <dl class="divide-y divide-n-weak rounded-xl border border-n-weak p-4">
          <div
            v-for="(title, key) in scoreLabels"
            :key="key"
            class="flex justify-between gap-4 py-2 text-sm"
          >
            <dt>{{ title }}</dt>
            <dd class="font-bold">
              {{ result.avaliacao_atendente?.[key] ?? '—' }}
            </dd>
          </div>
        </dl>
        <dl class="divide-y divide-n-weak rounded-xl border border-n-weak p-4">
          <div
            v-for="(title, key) in behaviorLabels"
            :key="key"
            class="flex justify-between gap-4 py-2 text-sm"
          >
            <dt>{{ title }}</dt>
            <dd class="font-semibold">
              {{
                label(result[key] === undefined ? null : String(result[key]))
              }}
            </dd>
          </div>
        </dl>
      </div>
      <div v-else-if="tab === 'audit'" class="grid gap-4 lg:grid-cols-2">
        <section
          v-for="[title, items] in sections"
          :key="title"
          class="min-w-0 rounded-xl border border-n-weak p-4"
        >
          <h3 class="mb-3 font-semibold">{{ title }}</h3>
          <ul v-if="items?.length" class="list-disc space-y-2 pl-5 text-sm">
            <li v-for="(item, index) in items" :key="index" class="break-words">
              {{ excerpt(item) }}
            </li>
          </ul>
          <p v-else class="text-sm text-n-slate-9">
            {{ t('JRC_CONTACT_CENTER.RECORDINGS.NOT_IDENTIFIED') }}
          </p>
        </section>
      </div>
      <div v-else class="rounded-xl border border-n-weak p-4">
        <p class="whitespace-pre-wrap break-words text-sm leading-7">
          {{ audit.transcript || '—' }}
        </p>
      </div>
    </div>
  </section>
</template>
