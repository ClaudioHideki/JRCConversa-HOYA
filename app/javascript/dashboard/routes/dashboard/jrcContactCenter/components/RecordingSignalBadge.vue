<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import Icon from 'dashboard/components-next/icon/Icon.vue';

const props = defineProps({
  kind: { type: String, required: true },
  value: { type: [String, Boolean], default: null },
});
const { tm } = useI18n();
const neutral = 'border-n-weak bg-n-solid-2 text-n-slate-11';
const positive =
  'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200';
const warning =
  'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200';
const negative =
  'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200';
const signal = computed(() => {
  if (props.value == null)
    return { color: neutral, icon: 'i-lucide-circle-help' };
  const value = String(props.value);
  if (props.kind === 'sentiment') {
    if (value === 'positivo')
      return { color: positive, icon: 'i-lucide-smile' };
    if (['negativo', 'critico'].includes(value))
      return { color: negative, icon: 'i-lucide-frown' };
    return { color: neutral, icon: 'i-lucide-meh' };
  }
  if (props.kind === 'temperature')
    return {
      color: ['quente', 'critica'].includes(value) ? warning : neutral,
      icon: ['quente', 'critica'].includes(value)
        ? 'i-lucide-flame'
        : 'i-lucide-thermometer',
    };
  if (props.kind === 'alert')
    return {
      color: props.value === true ? negative : neutral,
      icon:
        props.value === true
          ? 'i-lucide-triangle-alert'
          : 'i-lucide-shield-check',
    };
  if (value === 'completed')
    return { color: positive, icon: 'i-lucide-circle-check' };
  if (value === 'failed')
    return { color: negative, icon: 'i-lucide-circle-alert' };
  return { color: warning, icon: 'i-lucide-clock-3' };
});
const label = computed(
  () =>
    tm('JRC_CONTACT_CENTER.RECORDINGS.VALUES')[String(props.value)] ||
    props.value ||
    '—'
);
</script>

<template>
  <span
    class="inline-flex max-w-full items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-semibold leading-tight"
    :class="signal.color"
    :data-testid="`recording-signal-${kind}`"
  >
    <Icon :icon="signal.icon" class="size-3 shrink-0" />
    <span class="break-words">{{ label }}</span>
  </span>
</template>
