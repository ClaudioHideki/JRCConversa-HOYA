<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps({
  title: { type: String, required: true },
  metric: { type: Object, default: () => ({}) },
  negative: { type: Boolean, default: false },
  audio: { type: Boolean, default: false },
  priority: { type: Number, default: null },
});
const { t, tm } = useI18n();
const labels = computed(() => tm('JRC_CONTACT_CENTER.RECORDINGS.EMOTIONS'));
const tr = key =>
  key.split('.').reduce((value, part) => value?.[part], labels.value);
const signal = computed(() => {
  if (props.metric.nota == null) return 'unassessed';
  const favorable = props.negative ? 10 - props.metric.nota : props.metric.nota;
  if (favorable < 4) return 'unfavorable';
  if (favorable < 7) return 'attention';
  return 'favorable';
});
const barColor = computed(
  () =>
    ({
      unfavorable: 'bg-red-500',
      attention: 'bg-amber-500',
      favorable: 'bg-emerald-500',
      unassessed: 'bg-n-alpha-2',
    })[signal.value]
);
const signalColor = computed(
  () =>
    ({
      unfavorable:
        'bg-red-50 text-red-800 dark:bg-red-500/10 dark:text-red-300',
      attention:
        'bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300',
      favorable:
        'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300',
      unassessed: 'bg-n-solid-2 text-n-slate-10',
    })[signal.value]
);
</script>

<template>
  <article
    class="min-w-0 rounded-xl border border-n-weak bg-n-solid-1 p-4"
    data-testid="emotion-metric"
  >
    <div class="flex items-start justify-between gap-3">
      <h4 class="break-words text-sm font-semibold text-n-slate-12">
        {{ title }}
      </h4>
      <span class="shrink-0 text-lg font-bold text-n-slate-12">
        {{ metric.nota ?? '—'
        }}<span
          v-if="metric.nota != null"
          class="text-xs font-normal text-n-slate-10"
        >
          {{ tr('OUT_OF_10') }}
        </span>
      </span>
    </div>
    <p class="mt-1 text-xs text-n-slate-10">
      {{ tr(audio ? 'AUDIO_SOURCE' : 'TEXT_SOURCE') }}
    </p>
    <p
      v-if="priority != null"
      class="mt-1 text-xs font-semibold text-n-slate-10"
    >
      {{
        t('JRC_CONTACT_CENTER.RECORDINGS.EMOTIONS.PRIORITY', {
          weight: priority,
        })
      }}
    </p>
    <p
      class="mt-3 inline-flex rounded-full px-2 py-1 text-xs font-semibold"
      :class="signalColor"
      data-testid="metric-signal"
    >
      {{ tr(`SIGNALS.${signal}`) }}
    </p>
    <div class="mt-3 flex gap-1" aria-hidden="true">
      <span
        v-for="step in 10"
        :key="step"
        class="h-2 flex-1 rounded-sm"
        :class="
          metric.nota != null && step <= metric.nota ? barColor : 'bg-n-alpha-2'
        "
      />
    </div>
    <p class="mt-3 text-xs text-n-slate-10">
      {{ metric.nota == null ? tr('NOT_EVALUATED') : tr('CONFIDENCE') }}
      <span v-if="metric.nota != null">{{
        tr(`CONFIDENCES.${metric.confianca}`)
      }}</span>
    </p>
    <p class="mt-2 break-words text-xs leading-relaxed text-n-slate-11">
      {{ metric.observacao }}
    </p>
    <details v-if="metric.evidencias?.length" class="mt-3 text-xs">
      <summary class="cursor-pointer font-semibold text-n-blue-11">
        {{ tr('EVIDENCE') }}
      </summary>
      <ul class="mt-2 list-disc space-y-2 pl-4">
        <li
          v-for="(item, index) in metric.evidencias"
          :key="index"
          class="break-words leading-relaxed"
        >
          {{ item }}
        </li>
      </ul>
    </details>
  </article>
</template>
