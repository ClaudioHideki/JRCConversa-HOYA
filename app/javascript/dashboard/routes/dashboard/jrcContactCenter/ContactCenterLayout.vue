<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import JrcContactCenterAPI from 'dashboard/api/jrcContactCenter';

const route = useRoute();
const { t } = useI18n();
const context = ref(null);

const accountId = computed(() => route.params.accountId);
const navItems = computed(() => {
  const capabilities = context.value?.capabilities || {};
  return [
    {
      name: 'jrc_contact_center_cockpit',
      label: t('JRC_CONTACT_CENTER.NAV.COCKPIT'),
      visible: true,
    },
    {
      name: 'jrc_contact_center_occurrences',
      label: t('JRC_CONTACT_CENTER.NAV.OCCURRENCES'),
      visible: true,
    },
    {
      name: 'jrc_contact_center_supervisor',
      label: t('JRC_CONTACT_CENTER.NAV.SUPERVISOR'),
      visible: capabilities.supervise === true,
    },
    {
      name: 'jrc_contact_center_control_desk',
      label: t('JRC_CONTACT_CENTER.NAV.CONTROL_DESK'),
      visible:
        capabilities.supervise === true || capabilities.configure === true,
    },
    {
      name: 'jrc_contact_center_reports',
      label: t('JRC_CONTACT_CENTER.NAV.REPORTS'),
      visible: capabilities.reports === true,
    },
    {
      name: 'jrc_contact_center_settings',
      label: t('JRC_CONTACT_CENTER.NAV.SETTINGS'),
      visible: capabilities.configure === true,
    },
  ].filter(item => item.visible);
});

onMounted(async () => {
  try {
    const { data } = await JrcContactCenterAPI.context(accountId.value);
    context.value = data;
  } catch {
    context.value = null;
  }
});
</script>

<template>
  <div class="flex h-full min-h-0 flex-col bg-n-background">
    <header class="border-b border-n-weak bg-n-solid-1 px-6 py-4">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 class="text-xl font-semibold text-n-slate-12">
            {{ t('JRC_CONTACT_CENTER.TITLE') }}
          </h1>
          <p class="mt-1 text-sm text-n-slate-11">
            {{ t('JRC_CONTACT_CENTER.SUBTITLE') }}
          </p>
        </div>
        <span
          class="rounded-full border border-n-weak bg-n-alpha-2 px-3 py-1 text-xs font-medium text-n-slate-11"
        >
          {{ t('JRC_CONTACT_CENTER.STATUS.FOUNDATION') }}
        </span>
      </div>
      <nav class="mt-4 flex flex-wrap gap-2">
        <router-link
          v-for="item in navItems"
          :key="item.name"
          :to="{ name: item.name, params: { accountId } }"
          class="rounded-lg px-3 py-2 text-sm font-medium text-n-slate-11 hover:bg-n-alpha-2 hover:text-n-slate-12"
          active-class="bg-n-alpha-3 text-n-slate-12"
        >
          {{ item.label }}
        </router-link>
      </nav>
    </header>
    <main class="min-h-0 flex-1 overflow-auto">
      <router-view />
    </main>
  </div>
</template>
