<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import JrcContactCenterAPI from 'dashboard/api/jrcContactCenter';

const route = useRoute();
const { t } = useI18n();
const loading = ref(true);
const failed = ref(false);
const metrics = ref({});
const accountId = computed(() => route.params.accountId);
const cards = computed(() => [
  [t('JRC_CONTACT_CENTER.REPORTS.OFFERED'), metrics.value.offered_count || 0],
  [t('JRC_CONTACT_CENTER.REPORTS.ANSWERED'), metrics.value.answered_count || 0],
  [
    t('JRC_CONTACT_CENTER.REPORTS.ABANDONED'),
    metrics.value.abandoned_count || 0,
  ],
  [
    t('JRC_CONTACT_CENTER.REPORTS.TRANSFERRED'),
    metrics.value.transferred_count || 0,
  ],
  [t('JRC_CONTACT_CENTER.REPORTS.FALLBACK'), metrics.value.fallback_count || 0],
]);

onMounted(async () => {
  try {
    const { data } = await JrcContactCenterAPI.reportSummary(accountId.value);
    metrics.value = data.metrics || {};
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
        {{ t('JRC_CONTACT_CENTER.REPORTS.TITLE') }}
      </h2>
      <p class="mt-1 text-sm text-n-slate-11">
        {{ t('JRC_CONTACT_CENTER.REPORTS.DESCRIPTION') }}
      </p>
    </div>
    <div v-if="loading" class="text-sm text-n-slate-11">
      {{ t('JRC_CONTACT_CENTER.COMMON.LOADING') }}
    </div>
    <div v-else-if="failed" class="text-sm text-n-ruby-11">
      {{ t('JRC_CONTACT_CENTER.COMMON.ERROR') }}
    </div>
    <div v-else class="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <div
        v-for="[key, value] in cards"
        :key="key"
        class="rounded-xl border border-n-weak bg-n-solid-1 p-4"
      >
        <p class="text-xs font-medium uppercase tracking-wide text-n-slate-10">
          {{ key }}
        </p>
        <p class="mt-2 text-2xl font-semibold text-n-slate-12">{{ value }}</p>
      </div>
    </div>
  </section>
</template>
