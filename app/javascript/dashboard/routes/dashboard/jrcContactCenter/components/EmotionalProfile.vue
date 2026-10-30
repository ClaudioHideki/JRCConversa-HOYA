<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import EmotionMetric from './EmotionMetric.vue';

const props = defineProps({ result: { type: Object, required: true } });
const { t, tm } = useI18n();
const labels = computed(() => tm('JRC_CONTACT_CENTER.RECORDINGS.EMOTIONS'));
const tr = key =>
  key.split('.').reduce((value, part) => value?.[part], labels.value);
const profile = computed(() => props.result.perfil_emocional);
const groups = computed(() => [
  {
    id: 'positivos',
    title: tr('POSITIVE'),
    metrics: {
      ...Object.fromEntries(
        [
          'satisfacao',
          'confianca',
          'encantamento',
          'alivio',
          'compreensao',
        ].map(name => [name, profile.value?.positivos?.[name] || {}])
      ),
      sorriso_na_voz: props.result.analise_vocal?.sorriso_na_voz || {},
    },
  },
  {
    id: 'negativos',
    title: tr('NEGATIVE'),
    metrics: Object.fromEntries(
      [
        'frustracao',
        'decepcao',
        'ansiedade',
        'agressividade',
        'inseguranca',
      ].map(name => [name, profile.value?.negativos?.[name] || {}])
    ),
  },
]);
const phases = ['inicio', 'meio', 'fim'];
</script>

<template>
  <section class="mb-6 min-w-0 space-y-5" data-testid="emotional-profile">
    <template v-if="profile?.versao === 2">
      <header>
        <h3 class="text-base font-bold text-n-slate-12">{{ tr('TITLE') }}</h3>
        <p class="mt-2 text-sm leading-relaxed text-n-slate-10">
          {{ tr('DESCRIPTION') }}
        </p>
      </header>
      <section v-for="group in groups" :key="group.id">
        <h3 class="mb-3 text-sm font-semibold text-n-slate-12">
          {{ group.title }}
        </h3>
        <div class="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <EmotionMetric
            v-for="(metric, name) in group.metrics"
            :key="name"
            :title="tr(`METRICS.${name}`)"
            :metric="metric"
            :negative="group.id === 'negativos'"
            :audio="name === 'sorriso_na_voz'"
          />
        </div>
      </section>
      <p
        class="rounded-xl bg-n-blue-2 p-4 text-xs leading-relaxed text-n-blue-11"
      >
        {{ tr('VOCAL_NOTICE') }}
        <span v-if="result.analise_vocal?.modelo">{{
          t('JRC_CONTACT_CENTER.RECORDINGS.EMOTIONS.MODEL', {
            model: result.analise_vocal.modelo,
          })
        }}</span>
        {{ result.analise_vocal?.limitacoes }}
      </p>
      <section class="rounded-xl border border-n-weak p-4">
        <h3 class="text-sm font-semibold">{{ tr('RESOLUTION') }}</h3>
        <p class="mt-2 font-bold text-n-blue-11">
          {{ tr(`RESOLUTIONS.${profile.resolucao.situacao}`) }}
        </p>
        <p class="mt-2 break-words text-sm leading-relaxed">
          {{ profile.resolucao.justificativa }}
        </p>
        <ul class="mt-3 list-disc space-y-2 pl-4 text-xs">
          <li
            v-for="(item, index) in profile.resolucao.evidencias"
            :key="index"
            class="break-words"
          >
            {{ item }}
          </li>
        </ul>
      </section>
      <section class="rounded-xl border border-n-weak p-4">
        <h3 class="text-sm font-semibold">{{ tr('EVOLUTION') }}</h3>
        <p class="mt-2 font-bold text-n-blue-11">
          {{ tr(`CHANGES.${profile.evolucao.resultado}`) }}
        </p>
        <p class="mt-2 break-words text-sm leading-relaxed">
          {{ profile.evolucao.justificativa }}
        </p>
        <ol class="mt-4 grid gap-3 lg:grid-cols-3">
          <li
            v-for="phase in phases"
            :key="phase"
            class="min-w-0 rounded-xl bg-n-solid-2 p-3"
          >
            <h4
              class="text-xs font-bold uppercase tracking-wide text-n-slate-10"
            >
              {{ tr(`PHASES.${phase}`) }}
            </h4>
            <p class="mt-2 break-words text-sm leading-relaxed">
              {{ profile.evolucao[phase].observacao }}
            </p>
            <ul class="mt-2 list-disc space-y-2 pl-4 text-xs">
              <li
                v-for="(item, index) in profile.evolucao[phase].evidencias"
                :key="index"
                class="break-words"
              >
                {{ item }}
              </li>
            </ul>
          </li>
        </ol>
      </section>
      <section
        v-if="profile.limitacoes?.length"
        class="text-xs text-n-slate-10"
      >
        <h3 class="font-semibold">{{ tr('LIMITATIONS') }}</h3>
        <ul class="mt-2 list-disc space-y-2 pl-4">
          <li
            v-for="(item, index) in profile.limitacoes"
            :key="index"
            class="break-words"
          >
            {{ item }}
          </li>
        </ul>
      </section>
    </template>
    <p v-else class="rounded-xl bg-n-solid-2 p-4 text-sm text-n-slate-10">
      {{ tr('LEGACY') }}
    </p>
  </section>
</template>
