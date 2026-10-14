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
const memberships = ref([]);
const rules = ref([]);
const integration = ref(null);
const accountId = computed(() => route.params.accountId);

onMounted(async () => {
  try {
    const responses = await Promise.all([
      JrcContactCenterAPI.units(accountId.value),
      JrcContactCenterAPI.queues(accountId.value),
      JrcContactCenterAPI.queueMemberships(accountId.value),
      JrcContactCenterAPI.routingRules(accountId.value),
      JrcContactCenterAPI.integrationCapabilities(accountId.value),
    ]);
    units.value = responses[0].data.items || [];
    queues.value = responses[1].data.items || [];
    memberships.value = responses[2].data.items || [];
    rules.value = responses[3].data.items || [];
    integration.value = responses[4].data;
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
        {{ t('JRC_CONTACT_CENTER.SETTINGS.TITLE') }}
      </h2>
      <p class="mt-1 text-sm text-n-slate-11">
        {{ t('JRC_CONTACT_CENTER.SETTINGS.DESCRIPTION') }}
      </p>
    </div>

    <div v-if="loading" class="text-sm text-n-slate-11">
      {{ t('JRC_CONTACT_CENTER.COMMON.LOADING') }}
    </div>
    <div v-else-if="failed" class="text-sm text-n-ruby-11">
      {{ t('JRC_CONTACT_CENTER.COMMON.ERROR') }}
    </div>
    <template v-else>
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div class="rounded-xl border border-n-weak bg-n-solid-1 p-4">
          <p class="text-xs uppercase text-n-slate-10">
            {{ t('JRC_CONTACT_CENTER.CARDS.UNITS') }}
          </p>
          <p class="mt-2 text-2xl font-semibold text-n-slate-12">
            {{ units.length }}
          </p>
        </div>
        <div class="rounded-xl border border-n-weak bg-n-solid-1 p-4">
          <p class="text-xs uppercase text-n-slate-10">
            {{ t('JRC_CONTACT_CENTER.CARDS.QUEUES') }}
          </p>
          <p class="mt-2 text-2xl font-semibold text-n-slate-12">
            {{ queues.length }}
          </p>
        </div>
        <div class="rounded-xl border border-n-weak bg-n-solid-1 p-4">
          <p class="text-xs uppercase text-n-slate-10">
            {{ t('JRC_CONTACT_CENTER.CARDS.MEMBERSHIPS') }}
          </p>
          <p class="mt-2 text-2xl font-semibold text-n-slate-12">
            {{ memberships.length }}
          </p>
        </div>
        <div class="rounded-xl border border-n-weak bg-n-solid-1 p-4">
          <p class="text-xs uppercase text-n-slate-10">
            {{ t('JRC_CONTACT_CENTER.SETTINGS.ROUTING') }}
          </p>
          <p class="mt-2 text-2xl font-semibold text-n-slate-12">
            {{ rules.length }}
          </p>
        </div>
      </div>

      <div class="overflow-hidden rounded-xl border border-n-weak bg-n-solid-1">
        <div class="border-b border-n-weak px-4 py-3">
          <h3 class="text-sm font-semibold text-n-slate-12">
            {{ t('JRC_CONTACT_CENTER.SETTINGS.MEMBERSHIPS') }}
          </h3>
        </div>
        <div
          v-if="memberships.length === 0"
          class="p-4 text-sm text-n-slate-10"
        >
          {{ t('JRC_CONTACT_CENTER.COMMON.EMPTY') }}
        </div>
        <div v-else class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-n-alpha-1 text-xs uppercase text-n-slate-10">
              <tr>
                <th class="px-4 py-3">
                  {{ t('JRC_CONTACT_CENTER.COMMON.NAME') }}
                </th>
                <th class="px-4 py-3">
                  {{ t('JRC_CONTACT_CENTER.CARDS.QUEUES') }}
                </th>
                <th class="px-4 py-3">
                  {{ t('JRC_CONTACT_CENTER.COMMON.ROLE') }}
                </th>
                <th class="px-4 py-3">
                  {{ t('JRC_CONTACT_CENTER.COMMON.STATUS') }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="membership in memberships"
                :key="membership.id"
                class="border-t border-n-weak text-n-slate-11"
              >
                <td class="px-4 py-3">{{ membership.user_name }}</td>
                <td class="px-4 py-3">{{ membership.queue_name }}</td>
                <td class="px-4 py-3">{{ membership.role }}</td>
                <td class="px-4 py-3">
                  {{
                    membership.active
                      ? t('JRC_CONTACT_CENTER.COMMON.ACTIVE')
                      : t('JRC_CONTACT_CENTER.COMMON.INACTIVE')
                  }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="rounded-xl border border-n-weak bg-n-solid-1 p-4">
        <h3 class="text-sm font-semibold text-n-slate-12">
          {{ t('JRC_CONTACT_CENTER.SETTINGS.INTEGRATIONS') }}
        </h3>
        <p class="mt-2 text-sm text-n-slate-11">{{ integration?.provider }}</p>
        <p class="mt-1 text-xs text-n-slate-10">
          {{ t('JRC_CONTACT_CENTER.STATUS.PENDING_CONTRACT') }}
        </p>
      </div>
    </template>
  </section>
</template>
