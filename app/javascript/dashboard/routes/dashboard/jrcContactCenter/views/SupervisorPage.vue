<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import JrcContactCenterAPI from 'dashboard/api/jrcContactCenter';

const route = useRoute();
const { t } = useI18n();
const loading = ref(true);
const failed = ref(false);
const units = ref([]);
const queues = ref([]);
const accountId = computed(() => route.params.accountId);

onMounted(async () => {
  try {
    const [unitResponse, queueResponse] = await Promise.all([
      JrcContactCenterAPI.units(accountId.value),
      JrcContactCenterAPI.queues(accountId.value),
    ]);
    units.value = unitResponse.data.items || [];
    queues.value = queueResponse.data.items || [];
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
        {{ t('JRC_CONTACT_CENTER.SUPERVISOR.TITLE') }}
      </h2>
      <p class="mt-1 text-sm text-n-slate-11">
        {{ t('JRC_CONTACT_CENTER.SUPERVISOR.DESCRIPTION') }}
      </p>
    </div>
    <div v-if="loading" class="text-sm text-n-slate-11">
      {{ t('JRC_CONTACT_CENTER.COMMON.LOADING') }}
    </div>
    <div v-else-if="failed" class="text-sm text-n-ruby-11">
      {{ t('JRC_CONTACT_CENTER.COMMON.ERROR') }}
    </div>
    <template v-else>
      <div class="grid gap-5 xl:grid-cols-2">
        <div
          class="overflow-hidden rounded-xl border border-n-weak bg-n-solid-1"
        >
          <div
            class="border-b border-n-weak px-4 py-3 text-sm font-semibold text-n-slate-12"
          >
            {{ t('JRC_CONTACT_CENTER.SUPERVISOR.UNITS') }}
          </div>
          <div v-if="units.length === 0" class="p-4 text-sm text-n-slate-10">
            {{ t('JRC_CONTACT_CENTER.COMMON.EMPTY') }}
          </div>
          <div v-else class="divide-y divide-n-weak">
            <div
              v-for="unit in units"
              :key="unit.id"
              class="flex items-center justify-between gap-3 px-4 py-3"
            >
              <div>
                <p class="text-sm font-medium text-n-slate-12">
                  {{ unit.name }}
                </p>
                <p class="text-xs text-n-slate-10">
                  {{
                    t('JRC_CONTACT_CENTER.COMMON.CODE_DETAIL', {
                      code: unit.code,
                      detail: unit.kind,
                    })
                  }}
                </p>
              </div>
              <span class="text-xs text-n-slate-10">{{ unit.status }}</span>
            </div>
          </div>
        </div>
        <div
          class="overflow-hidden rounded-xl border border-n-weak bg-n-solid-1"
        >
          <div
            class="border-b border-n-weak px-4 py-3 text-sm font-semibold text-n-slate-12"
          >
            {{ t('JRC_CONTACT_CENTER.SUPERVISOR.QUEUES') }}
          </div>
          <div v-if="queues.length === 0" class="p-4 text-sm text-n-slate-10">
            {{ t('JRC_CONTACT_CENTER.COMMON.EMPTY') }}
          </div>
          <div v-else class="divide-y divide-n-weak">
            <div
              v-for="queue in queues"
              :key="queue.id"
              class="flex items-center justify-between gap-3 px-4 py-3"
            >
              <div>
                <p class="text-sm font-medium text-n-slate-12">
                  {{ queue.name }}
                </p>
                <p class="text-xs text-n-slate-10">
                  {{
                    t('JRC_CONTACT_CENTER.COMMON.CODE_DETAIL', {
                      code: queue.code,
                      detail: queue.unit_name,
                    })
                  }}
                </p>
              </div>
              <span class="text-xs text-n-slate-10">{{ queue.status }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </section>
</template>
