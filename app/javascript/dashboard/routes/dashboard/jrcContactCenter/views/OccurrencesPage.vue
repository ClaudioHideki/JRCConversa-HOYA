<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import JrcContactCenterAPI from 'dashboard/api/jrcContactCenter';

const route = useRoute();
const { t } = useI18n();
const loading = ref(true);
const failed = ref(false);
const records = ref([]);
const accountId = computed(() => route.params.accountId);

onMounted(async () => {
  try {
    const { data } = await JrcContactCenterAPI.cases(accountId.value);
    records.value = data.items || [];
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
        {{ t('JRC_CONTACT_CENTER.OCCURRENCES.TITLE') }}
      </h2>
      <p class="mt-1 text-sm text-n-slate-11">
        {{ t('JRC_CONTACT_CENTER.OCCURRENCES.DESCRIPTION') }}
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
      <div v-if="records.length === 0" class="p-5 text-sm text-n-slate-10">
        {{ t('JRC_CONTACT_CENTER.COMMON.EMPTY') }}
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-n-alpha-1 text-xs uppercase text-n-slate-10">
            <tr>
              <th class="px-4 py-3">
                {{ t('JRC_CONTACT_CENTER.OCCURRENCES.PROTOCOL') }}
              </th>
              <th class="px-4 py-3">
                {{ t('JRC_CONTACT_CENTER.OCCURRENCES.SUMMARY') }}
              </th>
              <th class="px-4 py-3">
                {{ t('JRC_CONTACT_CENTER.OCCURRENCES.PRIORITY') }}
              </th>
              <th class="px-4 py-3">
                {{ t('JRC_CONTACT_CENTER.COMMON.STATUS') }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="record in records"
              :key="record.id"
              class="border-t border-n-weak text-n-slate-11"
            >
              <td class="px-4 py-3 font-medium text-n-slate-12">
                {{ record.protocol }}
              </td>
              <td class="px-4 py-3">{{ record.summary }}</td>
              <td class="px-4 py-3">{{ record.priority }}</td>
              <td class="px-4 py-3">{{ record.status }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>
