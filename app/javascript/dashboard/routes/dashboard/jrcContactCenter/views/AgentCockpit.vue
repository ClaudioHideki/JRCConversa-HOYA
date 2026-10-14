<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import JrcContactCenterAPI from 'dashboard/api/jrcContactCenter';

const route = useRoute();
const { t } = useI18n();
const loading = ref(true);
const failed = ref(false);
const context = ref(null);
const calls = ref([]);
const callbacks = ref([]);

const accountId = computed(() => route.params.accountId);
const selectedCallbackId = computed(() => String(route.query.callbackId || ''));
const cards = computed(() => {
  const counts = context.value?.counts || {};
  return [
    [t('JRC_CONTACT_CENTER.CARDS.UNITS'), counts.units ?? 0],
    [t('JRC_CONTACT_CENTER.CARDS.QUEUES'), counts.queues ?? 0],
    [t('JRC_CONTACT_CENTER.CARDS.ACTIVE_CALLS'), counts.active_calls ?? 0],
    [t('JRC_CONTACT_CENTER.CARDS.OPEN_CASES'), counts.open_cases ?? 0],
    [
      t('JRC_CONTACT_CENTER.CARDS.PENDING_CALLBACKS'),
      counts.pending_callbacks ?? 0,
    ],
  ];
});

const formatDate = value =>
  value
    ? new Intl.DateTimeFormat(undefined, {
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(new Date(value))
    : '-';

onMounted(async () => {
  try {
    const [contextResponse, callsResponse, callbacksResponse] =
      await Promise.all([
        JrcContactCenterAPI.context(accountId.value),
        JrcContactCenterAPI.calls(accountId.value, { limit: 20 }),
        JrcContactCenterAPI.callbacks(accountId.value),
      ]);
    context.value = contextResponse.data;
    calls.value = callsResponse.data.items || [];
    callbacks.value = (callbacksResponse.data.items || []).filter(item =>
      ['scheduled', 'in_progress', 'failed'].includes(item.state)
    );
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
        {{ t('JRC_CONTACT_CENTER.COCKPIT.TITLE') }}
      </h2>
      <p class="mt-1 text-sm text-n-slate-11">
        {{ t('JRC_CONTACT_CENTER.COCKPIT.DESCRIPTION') }}
      </p>
    </div>

    <div v-if="loading" class="text-sm text-n-slate-11">
      {{ t('JRC_CONTACT_CENTER.COMMON.LOADING') }}
    </div>
    <div
      v-else-if="failed"
      class="rounded-xl border border-n-ruby-6 bg-n-ruby-3 p-4 text-sm text-n-ruby-11"
    >
      {{ t('JRC_CONTACT_CENTER.COMMON.ERROR') }}
    </div>
    <template v-else>
      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div
          v-for="[key, value] in cards"
          :key="key"
          class="rounded-xl border border-n-weak bg-n-solid-1 p-4"
        >
          <p
            class="text-xs font-medium uppercase tracking-wide text-n-slate-10"
          >
            {{ key }}
          </p>
          <p class="mt-2 text-2xl font-semibold text-n-slate-12">{{ value }}</p>
        </div>
      </div>

      <div class="rounded-xl border border-n-weak bg-n-solid-1 p-4">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p class="text-sm font-medium text-n-slate-12">
              {{
                t('JRC_CONTACT_CENTER.COMMON.PROVIDER_VALUE', {
                  value: context?.provider?.key,
                })
              }}
            </p>
            <p class="mt-1 text-xs text-n-slate-10">
              {{ t('JRC_CONTACT_CENTER.COCKPIT.NO_LIVE_PROVIDER') }}
            </p>
          </div>
          <span
            class="rounded-full bg-n-amber-3 px-3 py-1 text-xs font-medium text-n-amber-11"
          >
            {{ t('JRC_CONTACT_CENTER.STATUS.PENDING_CONTRACT') }}
          </span>
        </div>
      </div>

      <div class="overflow-hidden rounded-xl border border-n-weak bg-n-solid-1">
        <div class="border-b border-n-weak px-4 py-3">
          <h3 class="text-sm font-semibold text-n-slate-12">
            {{ t('JRC_CONTACT_CENTER.COCKPIT.CALLBACKS') }}
          </h3>
        </div>
        <div v-if="callbacks.length === 0" class="p-5 text-sm text-n-slate-10">
          {{ t('JRC_CONTACT_CENTER.COMMON.EMPTY') }}
        </div>
        <div v-else class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-n-alpha-1 text-xs uppercase text-n-slate-10">
              <tr>
                <th class="px-4 py-3">
                  {{ t('JRC_CONTACT_CENTER.COMMON.SCHEDULED_AT') }}
                </th>
                <th class="px-4 py-3">
                  {{ t('JRC_CONTACT_CENTER.COMMON.TARGET') }}
                </th>
                <th class="px-4 py-3">
                  {{ t('JRC_CONTACT_CENTER.COMMON.STATUS') }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="callback in callbacks"
                :key="callback.id"
                class="border-t border-n-weak text-n-slate-11"
                :class="
                  String(callback.id) === selectedCallbackId
                    ? 'bg-n-amber-2'
                    : ''
                "
              >
                <td class="px-4 py-3">
                  {{ formatDate(callback.scheduled_at) }}
                </td>
                <td class="px-4 py-3">
                  {{ callback.target_phone || `#${callback.contact_id}` }}
                </td>
                <td class="px-4 py-3">{{ callback.state }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="overflow-hidden rounded-xl border border-n-weak bg-n-solid-1">
        <div class="border-b border-n-weak px-4 py-3">
          <h3 class="text-sm font-semibold text-n-slate-12">
            {{ t('JRC_CONTACT_CENTER.COCKPIT.RECENT_CALLS') }}
          </h3>
        </div>
        <div v-if="calls.length === 0" class="p-5 text-sm text-n-slate-10">
          {{ t('JRC_CONTACT_CENTER.COMMON.EMPTY') }}
        </div>
        <div v-else class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-n-alpha-1 text-xs uppercase text-n-slate-10">
              <tr>
                <th class="px-4 py-3">
                  {{ t('JRC_CONTACT_CENTER.COMMON.STARTED_AT') }}
                </th>
                <th class="px-4 py-3">
                  {{ t('JRC_CONTACT_CENTER.COMMON.DIRECTION') }}
                </th>
                <th class="px-4 py-3">
                  {{ t('JRC_CONTACT_CENTER.COMMON.ANI') }}
                </th>
                <th class="px-4 py-3">
                  {{ t('JRC_CONTACT_CENTER.COMMON.DNIS') }}
                </th>
                <th class="px-4 py-3">
                  {{ t('JRC_CONTACT_CENTER.COMMON.STATUS') }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="call in calls"
                :key="call.id"
                class="border-t border-n-weak text-n-slate-11"
              >
                <td class="px-4 py-3">{{ formatDate(call.started_at) }}</td>
                <td class="px-4 py-3">{{ call.direction }}</td>
                <td class="px-4 py-3">{{ call.ani || '-' }}</td>
                <td class="px-4 py-3">{{ call.dnis || '-' }}</td>
                <td class="px-4 py-3">{{ call.status }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </section>
</template>
