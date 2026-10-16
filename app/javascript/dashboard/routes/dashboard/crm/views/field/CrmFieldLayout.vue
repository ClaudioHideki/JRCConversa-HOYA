<script setup>
import { useI18n } from 'vue-i18n';
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import Icon from 'dashboard/components-next/icon/Icon.vue';

const { t } = useI18n();

const route = useRoute();
const accountId = computed(() => route.params.accountId);

const groups = computed(() => [
  {
    label: t('JRC_CONTACT_CENTER.VISUAL.MINHA_ROTINA'),
    items: [
      {
        name: 'crm_field_my_day',
        label: t('JRC_CONTACT_CENTER.VISUAL.MEU_DIA'),
        icon: 'i-lucide-sun',
      },
      {
        name: 'crm_field_calendar',
        label: t('JRC_CONTACT_CENTER.VISUAL.AGENDA'),
        icon: 'i-lucide-calendar-days',
      },
      {
        name: 'crm_field_map',
        label: t('JRC_CONTACT_CENTER.VISUAL.MAPA_DE_VISITAS'),
        icon: 'i-lucide-map',
      },
      {
        name: 'crm_field_new_visit',
        label: t('JRC_CONTACT_CENTER.VISUAL.NOVA_VISITA_2'),
        icon: 'i-lucide-map-pin-plus',
      },
      {
        name: 'crm_field_visit_report',
        label: t('JRC_CONTACT_CENTER.VISUAL.RELATORIO_DE_VISITA'),
        icon: 'i-lucide-clipboard-check',
      },
      {
        name: 'crm_field_tasks',
        label: t('JRC_CONTACT_CENTER.VISUAL.TAREFAS_E_RETORNOS'),
        icon: 'i-lucide-list-checks',
      },
      {
        name: 'crm_field_notifications',
        label: t('JRC_CONTACT_CENTER.VISUAL.NOTIFICACOES'),
        icon: 'i-lucide-bell-ring',
      },
    ],
  },
  {
    label: t('JRC_CONTACT_CENTER.VISUAL.CLIENTES_E_NEGOCIOS'),
    items: [
      {
        name: 'crm_field_wallet',
        label: t('JRC_CONTACT_CENTER.VISUAL.MINHA_CARTEIRA'),
        icon: 'i-lucide-briefcase-business',
      },
      {
        name: 'crm_field_customer_360',
        label: t('JRC_CONTACT_CENTER.VISUAL.CLIENTE_360'),
        icon: 'i-lucide-orbit',
      },
      {
        name: 'crm_field_opportunities',
        label: t('JRC_CONTACT_CENTER.VISUAL.OPORTUNIDADES'),
        icon: 'i-lucide-handshake',
      },
      {
        name: 'crm_field_orders',
        label: t('JRC_CONTACT_CENTER.VISUAL.PEDIDOS_E_ENTREGAS'),
        icon: 'i-lucide-package-check',
      },
    ],
  },
  {
    label: t('JRC_CONTACT_CENTER.VISUAL.DIVULGACAO_E_SUPORTE'),
    items: [
      {
        name: 'crm_field_promotion',
        label: t('JRC_CONTACT_CENTER.VISUAL.ACOES_DE_DIVULGACAO'),
        icon: 'i-lucide-megaphone',
      },
      {
        name: 'crm_field_training',
        label: t('JRC_CONTACT_CENTER.VISUAL.TREINAMENTOS'),
        icon: 'i-lucide-graduation-cap',
      },
      {
        name: 'crm_field_catalog',
        label: t('JRC_CONTACT_CENTER.VISUAL.CATALOGO_E_MATERIAIS'),
        icon: 'i-lucide-library-big',
      },
      {
        name: 'crm_field_phone',
        label: t('JRC_CONTACT_CENTER.VISUAL.TELEFONIA_MOBILE'),
        icon: 'i-lucide-smartphone',
      },
      {
        name: 'crm_field_nico',
        label: t('JRC_CONTACT_CENTER.VISUAL.NICO_FIELD'),
        icon: 'i-lucide-bot',
      },
    ],
  },
  {
    label: t('JRC_CONTACT_CENTER.VISUAL.GESTAO'),
    items: [
      {
        name: 'crm_field_regional',
        label: t('JRC_CONTACT_CENTER.VISUAL.GESTAO_REGIONAL'),
        icon: 'i-lucide-map-pinned',
      },
      {
        name: 'crm_field_reports',
        label: t('JRC_CONTACT_CENTER.VISUAL.RELATORIOS_FIELD'),
        icon: 'i-lucide-chart-no-axes-combined',
      },
    ],
  },
]);

const allItems = computed(() => groups.value.flatMap(group => group.items));
const activeItem = computed(() =>
  allItems.value.find(item => item.name === route.name)
);

const visualBadgeLabel = computed(() =>
  t('JRC_CONTACT_CENTER.VISUAL.HOYA_360')
);
</script>

<template>
  <div class="flex min-h-full flex-col bg-n-background">
    <header
      class="relative overflow-hidden border-b border-n-weak bg-n-solid-2 px-4 py-4 sm:px-6"
    >
      <div
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_-20%,rgba(8,124,240,.16),transparent_36%),radial-gradient(circle_at_86%_0%,rgba(124,58,237,.13),transparent_30%)]"
      />
      <div class="relative flex flex-wrap items-center justify-between gap-4">
        <div class="flex min-w-0 items-center gap-3">
          <span
            class="grid size-11 shrink-0 place-content-center rounded-2xl bg-gradient-to-br from-[#0a79e8] to-[#6d4bd4] text-white shadow-[0_10px_28px_rgba(37,99,235,.24)]"
          >
            <Icon icon="i-lucide-map-pinned" class="size-5" />
          </span>
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <h1
                class="truncate text-xl font-bold tracking-tight text-n-slate-12"
              >
                {{ $t('JRC_CONTACT_CENTER.VISUAL.CRM_FIELD_HOYA') }}
              </h1>
              <span
                class="rounded-full border border-n-blue-5 bg-n-blue-2 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-n-blue-11"
              >
                {{ visualBadgeLabel }}
              </span>
            </div>
            <p class="mt-1 truncate text-xs text-n-slate-10">
              {{
                $t(
                  'JRC_CONTACT_CENTER.VISUAL.CARTEIRAS_VISITAS_OPORTUNIDADES_E_RELACIONAMENTO_EM_CAM'
                )
              }}
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <span
            class="rounded-xl border border-n-weak bg-n-solid-1 px-3 py-2 text-xs font-semibold text-n-slate-11 shadow-sm"
          >
            {{ activeItem?.label || 'CRM Field' }}
          </span>
          <RouterLink
            :to="{ name: 'crm_field_new_visit', params: { accountId } }"
            class="inline-flex items-center gap-2 rounded-xl bg-n-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
          >
            <Icon icon="i-lucide-map-pin-plus" class="size-4" />{{
              $t('JRC_CONTACT_CENTER.VISUAL.NOVA_VISITA')
            }}
          </RouterLink>
        </div>
      </div>
    </header>

    <div class="flex min-h-0 flex-1 flex-col xl:flex-row">
      <aside
        class="border-b border-n-weak bg-n-solid-2 p-3 xl:w-64 xl:shrink-0 xl:border-b-0 xl:border-r xl:p-4"
      >
        <nav
          class="flex gap-2 overflow-x-auto xl:block xl:space-y-5 xl:overflow-visible"
        >
          <section
            v-for="group in groups"
            :key="group.label"
            class="flex shrink-0 gap-2 xl:block xl:shrink xl:space-y-1"
          >
            <p
              class="hidden px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-n-slate-9 xl:block"
            >
              {{ group.label }}
            </p>
            <RouterLink
              v-for="item in group.items"
              :key="item.name"
              :to="{ name: item.name, params: { accountId } }"
              class="flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-medium text-n-slate-11 transition hover:bg-n-alpha-2 hover:text-n-slate-12 xl:w-full"
              active-class="bg-n-blue-2 text-n-blue-11 shadow-sm ring-1 ring-n-blue-5"
            >
              <span
                class="grid size-7 place-content-center rounded-lg bg-n-alpha-1 text-current"
              >
                <Icon :icon="item.icon" class="size-4" />
              </span>
              {{ item.label }}
            </RouterLink>
          </section>
        </nav>
      </aside>
      <main class="min-h-0 min-w-0 flex-1 overflow-auto">
        <RouterView :key="`${accountId}-${route.name}`" />
      </main>
    </div>
  </div>
</template>
