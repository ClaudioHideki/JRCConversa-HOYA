<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import JrcContactCenterAPI from 'dashboard/api/jrcContactCenter';

const route = useRoute();
const { t } = useI18n();
const loading = ref(true);
const failed = ref(false);
const integration = ref(null);
const accountId = computed(() => route.params.accountId);
const capabilityRows = computed(() =>
  Object.entries(integration.value?.capabilities || {})
);

onMounted(async () => {
  try {
    const { data } = await JrcContactCenterAPI.integrationCapabilities(
      accountId.value
    );
    integration.value = data;
  } catch {
    failed.value = true;
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <section class="space-y-5 p-6">
    <div>
      <h2 class="text-lg font-semibold text-n-slate-12">
        {{ t('JRC_CONTACT_CENTER.CONTROL_DESK.TITLE') }}
      </h2>
      <p class="mt-1 text-sm text-n-slate-11">
        {{ t('JRC_CONTACT_CENTER.CONTROL_DESK.DESCRIPTION') }}
      </p>
    </div>
    <div v-if="loading" class="text-sm text-n-slate-11">
      {{ t('JRC_CONTACT_CENTER.COMMON.LOADING') }}
    </div>
    <div v-else-if="failed" class="text-sm text-n-ruby-11">
      {{ t('JRC_CONTACT_CENTER.COMMON.ERROR') }}
    </div>
    <div
      v-else
      class="overflow-hidden rounded-xl border border-n-weak bg-n-solid-1"
    >
      <div class="border-b border-n-weak px-4 py-3">
        <p class="text-sm font-semibold text-n-slate-12">
          {{ t('JRC_CONTACT_CENTER.CONTROL_DESK.CAPABILITIES') }}
        </p>
        <p class="mt-1 text-xs text-n-slate-10">{{ integration?.provider }}</p>
      </div>
      <div class="divide-y divide-n-weak">
        <div
          v-for="[capability, status] in capabilityRows"
          :key="capability"
          class="flex items-center justify-between gap-3 px-4 py-3"
        >
          <span class="text-sm text-n-slate-11">{{ capability }}</span>
          <span
            class="rounded-full bg-n-alpha-2 px-2.5 py-1 text-xs text-n-slate-10"
          >
            {{ status }}
          </span>
        </div>
      </div>
    </div>
  </section>
</template>
