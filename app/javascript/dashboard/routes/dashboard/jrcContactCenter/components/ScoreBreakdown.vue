<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps({
  score: { type: Object, required: true },
  result: { type: Object, default: () => ({}) },
});
const { t, tm } = useI18n();
const labels = computed(() =>
  tm('JRC_CONTACT_CENTER.RECORDINGS.GENERAL_SCORE')
);
const metrics = computed(() =>
  tm('JRC_CONTACT_CENTER.RECORDINGS.EMOTIONS.METRICS')
);
const tr = key => labels.value[key];
const number = value =>
  value == null
    ? '—'
    : new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(
        value
      );
const items = computed(() =>
  props.score.grupos.flatMap(group => group.indicadores)
);
const title = item => {
  const name =
    metrics.value[item.indicador || item.id] || labels.value.GROUPS[item.grupo];
  return item.papel ? `${labels.value.ROLES[item.papel]} · ${name}` : name;
};
const findings = computed(() => {
  const positives = [...new Set(props.result.pontos_positivos || [])];
  const improvements = [
    ...new Set([
      ...(props.result.pontos_negativos || []),
      ...(props.result.oportunidades_melhoria || []),
    ]),
  ];
  const conflicts = positives.filter(text => improvements.includes(text));
  return {
    positives: positives.filter(text => !conflicts.includes(text)),
    improvements: improvements.filter(text => !conflicts.includes(text)),
    conflicts,
  };
});
const highlights = computed(() => [
  { id: 'positive', title: tr('CONTRIBUTED'), items: findings.value.positives },
  { id: 'attention', title: tr('REDUCED'), items: findings.value.improvements },
]);
</script>

<template>
  <section class="mb-6 min-w-0 space-y-4" data-testid="general-score-breakdown">
    <h3 class="font-bold text-n-slate-12">{{ tr('TITLE') }}</h3>
    <p class="text-sm leading-relaxed text-n-slate-10">
      {{ tr('DESCRIPTION') }}
    </p>
    <p
      v-if="score.versao === 2"
      class="rounded-xl bg-n-blue-2 p-4 text-sm leading-relaxed text-n-blue-11"
    >
      {{ tr('SERVICE_FOCUS') }}
    </p>
    <p
      v-if="score.ponderacao_humana"
      data-testid="human-weighting"
      class="rounded-xl bg-n-solid-2 p-4 text-sm leading-relaxed text-n-slate-11"
    >
      {{
        t('JRC_CONTACT_CENTER.RECORDINGS.GENERAL_SCORE.HUMAN_WEIGHTING', {
          impact: number(score.ponderacao_humana.impacto_nota),
          before: number(score.ponderacao_humana.pontos_antes),
          after: number(score.ponderacao_humana.pontos_depois),
        })
      }}
    </p>
    <p
      v-if="score.peso_avaliado === 0"
      role="status"
      class="rounded-xl bg-n-solid-2 p-4 text-sm text-n-slate-10"
    >
      {{ tr('NO_SCORE') }}
    </p>
    <p
      v-else-if="score.parcial"
      role="status"
      class="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
    >
      {{
        t('JRC_CONTACT_CENTER.RECORDINGS.GENERAL_SCORE.PARTIAL', {
          weight: number(score.peso_avaliado),
          points: number(score.pontos_obtidos),
          score: number(score.nota),
        })
      }}
    </p>
    <div class="grid gap-4 xl:grid-cols-2">
      <section
        v-for="group in highlights"
        :key="group.id"
        class="min-w-0 rounded-xl border border-n-weak p-4"
      >
        <h4
          class="text-sm font-bold"
          :class="
            group.id === 'positive' ? 'text-emerald-700' : 'text-amber-700'
          "
        >
          {{ group.title }}
        </h4>
        <p class="mt-2 text-xs leading-relaxed text-n-slate-10">
          {{
            group.id === 'positive' ? tr('EARNED_NOTICE') : tr('LOST_NOTICE')
          }}
        </p>
        <ol
          v-if="group.items.length"
          class="mt-4 space-y-4"
          :data-testid="`score-findings-${group.id}`"
        >
          <li
            v-for="finding in group.items"
            :key="finding"
            class="min-w-0 break-words border-t border-n-weak pt-3 text-sm"
          >
            {{ finding }}
          </li>
        </ol>
        <p v-else class="mt-4 text-xs text-n-slate-10">
          {{ tr('NO_HIGHLIGHTS') }}
        </p>
      </section>
    </div>
    <section
      v-if="findings.conflicts.length"
      class="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
      data-testid="score-findings-conflicts"
    >
      <h4 class="font-semibold">{{ tr('CONFLICTING_FINDINGS') }}</h4>
      <p class="mt-2 text-xs">{{ tr('CONFLICTING_NOTICE') }}</p>
      <ul class="mt-3 list-disc space-y-2 pl-4">
        <li
          v-for="finding in findings.conflicts"
          :key="finding"
          class="break-words"
        >
          {{ finding }}
        </li>
      </ul>
    </section>
    <p class="text-xs leading-relaxed text-n-slate-10">
      {{ tr('FINDINGS_NOTICE') }}
    </p>
    <details
      class="rounded-xl border border-n-weak p-4"
      data-testid="score-calculation"
    >
      <summary class="cursor-pointer text-sm font-bold text-n-blue-11">
        {{ tr('CALCULATION') }}
      </summary>
      <p class="mt-3 text-xs leading-relaxed text-n-slate-10">
        {{ tr('FORMULA') }}
      </p>
      <dl class="my-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        <div
          v-for="group in score.grupos"
          :key="group.id"
          class="rounded-lg bg-n-solid-2 p-3 text-xs"
        >
          <dt class="font-semibold">
            {{
              t('JRC_CONTACT_CENTER.RECORDINGS.GENERAL_SCORE.GROUP_WEIGHT', {
                name: labels.GROUPS[group.id],
                weight: number(group.peso),
              })
            }}
          </dt>
          <dd v-if="group.peso_avaliado > 0" class="mt-1">
            {{
              t('JRC_CONTACT_CENTER.RECORDINGS.GENERAL_SCORE.GROUP_POINTS', {
                points: number(group.pontos),
                weight: number(group.peso_avaliado),
              })
            }}
          </dd>
          <dd v-else class="mt-1">{{ tr('NOT_EVALUATED') }}</dd>
        </div>
      </dl>
      <div class="min-w-0 overflow-x-auto">
        <table class="w-full min-w-[640px] table-fixed text-left text-xs">
          <thead class="bg-n-solid-2 text-n-slate-10">
            <tr>
              <th class="w-[40%] break-words p-2">{{ tr('INDICATOR') }}</th>
              <th class="w-[14%] break-words p-2">{{ tr('RATING') }}</th>
              <th class="w-[14%] break-words p-2">{{ tr('WEIGHT') }}</th>
              <th class="w-[16%] break-words p-2">{{ tr('EARNED') }}</th>
              <th class="w-[16%] break-words p-2">{{ tr('NOT_EARNED') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-n-weak">
            <tr v-for="item in items" :key="item.id">
              <th class="break-words p-2 font-normal">
                <p class="font-semibold">{{ title(item) }}</p>
                <p class="mt-1 break-words leading-relaxed text-n-slate-10">
                  {{ item.observacao }}
                </p>
                <details v-if="item.evidencias.length" class="mt-2">
                  <summary class="cursor-pointer font-semibold text-n-blue-11">
                    {{ tr('EVIDENCE') }}
                  </summary>
                  <ul class="mt-2 list-disc space-y-2 pl-4">
                    <li
                      v-for="(quote, index) in item.evidencias"
                      :key="index"
                      class="break-words"
                    >
                      {{ quote }}
                    </li>
                  </ul>
                </details>
              </th>
              <td class="break-words p-2">
                {{
                  item.nota == null
                    ? tr('NOT_EVALUATED')
                    : `${number(item.nota)} / ${item.escala}`
                }}
              </td>
              <td class="break-words p-2">
                {{ number(item.peso) }}{{ tr('PERCENT') }}
              </td>
              <td class="break-words p-2 font-semibold">
                {{ number(item.pontos) }}
              </td>
              <td class="break-words p-2">
                {{ number(item.pontos_perdidos) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="mt-4 text-xs leading-relaxed text-n-slate-10">
        {{ tr(score.versao === 2 ? 'SERVICE_SCORING_RULES' : 'SCORING_RULES') }}
      </p>
    </details>
  </section>
</template>
