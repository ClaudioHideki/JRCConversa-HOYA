<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps({ value: { type: String, default: null } });
const { tm } = useI18n();
const label = computed(
  () =>
    tm('JRC_CONTACT_CENTER.RECORDINGS.VALUES')[props.value] ||
    props.value ||
    '—'
);
const tone = computed(
  () =>
    ({
      excelente:
        'border-teal-200 bg-teal-50 text-teal-800 dark:border-teal-500/30 dark:bg-teal-500/10 dark:text-teal-300',
      boa: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300',
      regular:
        'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300',
      ruim: 'border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-300',
      critica:
        'border-red-200 bg-red-50 text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300',
    })[props.value] || 'border-n-weak bg-n-solid-2 text-n-slate-10'
);
</script>

<template>
  <span
    class="inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold"
    :class="tone"
    data-testid="classification-badge"
  >
    {{ label }}
  </span>
</template>
