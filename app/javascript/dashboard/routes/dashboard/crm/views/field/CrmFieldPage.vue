<script setup>
import { useI18n } from 'vue-i18n';
import { computed } from 'vue';
import VisualShowcasePage from '../../../jrcContactCenter/components/visual/VisualShowcasePage.vue';
import { crmFieldScreen } from './crmFieldCatalog';

const props = defineProps({
  screenKey: { type: String, required: true },
});

const { t } = useI18n();

const screen = computed(() => crmFieldScreen(props.screenKey, t));
</script>

<template>
  <VisualShowcasePage :screen="screen" />
</template>
