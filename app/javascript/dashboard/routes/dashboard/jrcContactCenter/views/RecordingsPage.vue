<script setup>
import { computed, onUnmounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import Icon from 'dashboard/components-next/icon/Icon.vue';
import AudioAuditsAPI from 'dashboard/api/audioAudits';
import AudioAuditResult from '../components/AudioAuditResult.vue';
import AudioAuditDialog from '../components/AudioAuditDialog.vue';
import ClassificationBadge from '../components/ClassificationBadge.vue';

const route = useRoute();
const { t, tm } = useI18n();
const items = ref([]);
const metrics = ref({});
const configuration = ref(null);
const total = ref(0);
const page = ref(1);
const perPage = ref(10);
const filter = ref('all');
const loading = ref(false);
const uploading = ref(false);
const error = ref('');
const batch = ref([]);
let nextFileId = 0;
const readyFiles = computed(() =>
  batch.value.filter(item => item.status === 'ready')
);
const sentCount = computed(
  () => batch.value.filter(item => item.status === 'sent').length
);
const selected = ref(null);
const opening = ref(false);
const fileInput = ref(null);
const audioUrl = ref('');
const audioPlayer = ref(null);
const reportDialog = ref(null);
const reportVisible = ref(false);
const historySection = ref(null);
let generation = 0;
let timer;
let selecting = 0;
const label = value =>
  tm('JRC_CONTACT_CENTER.RECORDINGS.VALUES')[value] || value || '—';
const date = value => new Date(value).toLocaleString();
const busy = status => ['queued', 'processing'].includes(status);
const recordingLabels = computed(() => tm('JRC_CONTACT_CENTER.RECORDINGS'));
const emptyHistoryMessage = computed(() => {
  if (loading.value) return t('JRC_CONTACT_CENTER.COMMON.LOADING');
  if (filter.value === 'all') return t('JRC_CONTACT_CENTER.RECORDINGS.EMPTY');
  if (filter.value === 'scored' && metrics.value.average_count === 0)
    return t('JRC_CONTACT_CENTER.RECORDINGS.AVERAGE_EMPTY');
  return t('JRC_CONTACT_CENTER.RECORDINGS.EMPTY_FILTER');
});
const number = value =>
  new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(value);
const cardDefinitions = [
  {
    id: 'audited',
    label: 'TOTAL',
    metric: 'total',
    icon: 'i-lucide-mic',
    color:
      'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-200',
  },
  {
    id: 'scored',
    label: 'AVERAGE',
    metric: 'average_score',
    icon: 'i-lucide-star',
    color:
      'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
  },
  {
    id: 'alerts',
    label: 'ALERTS',
    metric: 'alerts',
    icon: 'i-lucide-triangle-alert',
    color:
      'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200',
  },
  {
    id: 'critical',
    label: 'CRITICAL',
    metric: 'critical',
    icon: 'i-lucide-phone',
    color:
      'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200',
  },
  {
    id: 'hot',
    label: 'HOT',
    metric: 'hot',
    icon: 'i-lucide-message-circle',
    color:
      'border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-200',
  },
  {
    id: 'churn',
    label: 'CHURN',
    metric: 'churn_percent',
    icon: 'i-lucide-shield-check',
    color:
      'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-900 dark:border-fuchsia-800 dark:bg-fuchsia-950 dark:text-fuchsia-200',
  },
];
const cards = computed(() =>
  cardDefinitions.map(card => {
    const value = metrics.value[card.metric];
    const emptyValue = ['scored', 'churn'].includes(card.id) ? '—' : '0';
    return {
      ...card,
      title: recordingLabels.value[card.label],
      value:
        value == null
          ? emptyValue
          : `${number(value)}${card.id === 'churn' ? '%' : ''}`,
    };
  })
);
const historyFilters = computed(() =>
  ['all', ...cardDefinitions.map(card => card.id)].map(id => ({
    id,
    label: recordingLabels.value.FILTERS[id],
  }))
);
const clearAudio = () => {
  audioPlayer.value?.pause();
  if (audioUrl.value) URL.revokeObjectURL(audioUrl.value);
  audioUrl.value = '';
};
const closeReport = () => {
  selecting += 1;
  clearAudio();
  selected.value = null;
  opening.value = false;
  reportVisible.value = false;
  error.value = '';
};
const errorMessage = exception => {
  const code = exception?.response?.data?.error;
  const messages = tm('JRC_CONTACT_CENTER.RECORDINGS.ERRORS');
  return messages[code] || t('JRC_CONTACT_CENTER.RECORDINGS.ERROR');
};
const setError = exception => {
  error.value = errorMessage(exception);
};
const openAudit = async id => {
  const current = generation;
  selecting += 1;
  const request = selecting;
  opening.value = true;
  error.value = '';
  clearAudio();
  selected.value = null;
  reportVisible.value = true;
  reportDialog.value.open();
  try {
    const { data } = await AudioAuditsAPI.show(id);
    if (current === generation && request === selecting)
      selected.value = data.item;
  } catch (exception) {
    if (current === generation && request === selecting) setError(exception);
  } finally {
    if (current === generation && request === selecting) opening.value = false;
  }
};
const refresh = async () => {
  if (loading.value) return;
  const current = generation;
  loading.value = true;
  try {
    const { data } = await AudioAuditsAPI.list(page.value, filter.value);
    if (current !== generation) return;
    items.value = data.items;
    metrics.value = data.metrics;
    total.value = data.total;
    perPage.value = data.per_page || 10;
    configuration.value = data.configuration;
    if (selected.value && busy(selected.value.status)) {
      const id = selected.value.id;
      const request = selecting;
      const response = await AudioAuditsAPI.show(id);
      if (
        current === generation &&
        request === selecting &&
        selected.value?.id === id
      )
        selected.value = response.data.item;
    }
  } catch (exception) {
    if (current === generation) setError(exception);
  } finally {
    if (current === generation) loading.value = false;
  }
};
const chooseFiles = files => {
  if (uploading.value) return;
  error.value = '';
  Array.from(files || []).forEach(file => {
    nextFileId += 1;
    const valid =
      /\.(mp3|wav|ogg|m4a)$/i.test(file.name) &&
      file.size > 0 &&
      file.size <= (configuration.value?.max_audio_bytes || 25 * 1024 * 1024);
    batch.value.push({
      key: nextFileId,
      file,
      status: valid ? 'ready' : 'invalid',
      error: valid
        ? ''
        : t('JRC_CONTACT_CENTER.RECORDINGS.ERRORS.invalid_audio'),
    });
  });
  if (fileInput.value) fileInput.value.value = '';
};
const removeFile = key => {
  if (!uploading.value)
    batch.value = batch.value.filter(item => item.key !== key);
};
const upload = async () => {
  if (
    !readyFiles.value.length ||
    uploading.value ||
    !configuration.value?.configured
  )
    return;
  const current = generation;
  const selectionAtStart = selecting;
  const pending = [...readyFiles.value];
  let lastId;
  uploading.value = true;
  error.value = '';
  try {
    for (let index = 0; index < pending.length; index += 1) {
      const entry = pending[index];
      if (current !== generation) break;
      entry.status = 'uploading';
      try {
        // eslint-disable-next-line no-await-in-loop -- Send one file at a time to bound upload traffic and stop on Account changes.
        const { data } = await AudioAuditsAPI.upload(entry.file);
        if (current !== generation) return;
        entry.status = 'sent';
        entry.id = data.item.id;
        lastId = data.item.id;
      } catch (exception) {
        if (current !== generation) return;
        entry.status = 'upload_failed';
        entry.error = errorMessage(exception);
        if ([401, 403].includes(exception?.response?.status)) break;
      }
    }
    if (current !== generation) return;
    page.value = 1;
    await refresh();
    if (lastId && selectionAtStart === selecting) await openAudit(lastId);
  } finally {
    if (current === generation) uploading.value = false;
  }
};
const retry = async id => {
  if (uploading.value) return;
  const current = generation;
  const request = selecting;
  uploading.value = true;
  error.value = '';
  try {
    await AudioAuditsAPI.retryAnalysis(id);
    if (current === generation) {
      if (request === selecting) await openAudit(id);
      await refresh();
    }
  } catch (exception) {
    if (current === generation && request === selecting) setError(exception);
  } finally {
    if (current === generation) uploading.value = false;
  }
};
const listen = async () => {
  const current = generation;
  const request = selecting;
  const id = selected.value?.id;
  try {
    const { data } = await AudioAuditsAPI.recording(id);
    if (
      current !== generation ||
      request !== selecting ||
      selected.value?.id !== id
    )
      return;
    clearAudio();
    audioUrl.value = URL.createObjectURL(data);
  } catch (exception) {
    if (current === generation && request === selecting) setError(exception);
  }
};
const download = () => {
  const blob = new Blob([JSON.stringify(selected.value, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `monitoria-${selected.value.id}.json`;
  link.click();
  URL.revokeObjectURL(url);
};
const changePage = async offset => {
  if (loading.value) return;
  page.value += offset;
  await refresh();
};
const selectFilter = async value => {
  if (loading.value) return;
  if (value !== filter.value) {
    selecting += 1;
    reportDialog.value?.close();
    filter.value = value;
    page.value = 1;
    items.value = [];
    total.value = 0;
    error.value = '';
    await refresh();
  }
  historySection.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};
watch(
  () => route.params.accountId,
  () => {
    generation += 1;
    selecting += 1;
    reportDialog.value?.close();
    reportVisible.value = false;
    clearInterval(timer);
    clearAudio();
    items.value = [];
    metrics.value = {};
    configuration.value = null;
    selected.value = null;
    batch.value = [];
    error.value = '';
    total.value = 0;
    page.value = 1;
    perPage.value = 10;
    filter.value = 'all';
    loading.value = false;
    uploading.value = false;
    opening.value = false;
    if (fileInput.value) fileInput.value.value = '';
    refresh();
    timer = setInterval(refresh, 5000);
  },
  { immediate: true }
);
onUnmounted(() => {
  generation += 1;
  selecting += 1;
  clearInterval(timer);
  clearAudio();
});
</script>

<template>
  <div class="min-w-0 space-y-5 bg-n-solid-2 p-4 text-n-slate-12 md:p-6">
    <header>
      <h1 class="text-xl font-bold tracking-tight">
        {{ t('JRC_CONTACT_CENTER.NAV.RECORDINGS') }}
      </h1>
      <p class="mt-1 text-sm text-n-slate-10">
        {{ t('JRC_CONTACT_CENTER.RECORDINGS.SUBTITLE') }}
      </p>
    </header>
    <p
      v-if="error && !reportVisible"
      role="alert"
      class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
    >
      {{ error }}
    </p>
    <p
      v-if="configuration && !configuration.configured"
      role="status"
      class="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
    >
      {{ t('JRC_CONTACT_CENTER.RECORDINGS.CONFIGURATION_REQUIRED') }}
    </p>
    <div class="grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-6">
      <button
        v-for="card in cards"
        :key="card.id"
        type="button"
        :data-testid="`recording-metric-${card.id}`"
        :aria-pressed="filter === card.id"
        :aria-label="
          t('JRC_CONTACT_CENTER.RECORDINGS.OPEN_METRIC', { name: card.title })
        "
        :disabled="loading"
        class="min-w-0 rounded-2xl border p-4 text-left shadow-sm transition-shadow hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-wait disabled:opacity-70"
        :class="[card.color, filter === card.id ? 'ring-2 ring-current' : '']"
        @click="selectFilter(card.id)"
      >
        <div class="flex items-center gap-2 text-xs font-semibold">
          <Icon :icon="card.icon" class="size-4 shrink-0" /><span>{{
            card.title
          }}</span>
        </div>
        <p class="mt-4 text-3xl font-bold tabular-nums">{{ card.value }}</p>
        <p class="mt-2 text-xs underline">
          {{ t('JRC_CONTACT_CENTER.RECORDINGS.VIEW_RECORDINGS') }}
        </p>
      </button>
    </div>
    <p class="text-xs leading-relaxed text-n-slate-10">
      {{ t('JRC_CONTACT_CENTER.RECORDINGS.AVERAGE_NOTICE') }}
    </p>
    <p
      v-if="metrics.average_count !== undefined"
      role="status"
      class="text-xs leading-relaxed text-n-slate-10"
    >
      {{
        t('JRC_CONTACT_CENTER.RECORDINGS.AVERAGE_COUNTS', {
          count: metrics.average_count,
          partial: metrics.partial_count,
        })
      }}
      <span v-if="metrics.average_count === 0">{{
        t('JRC_CONTACT_CENTER.RECORDINGS.AVERAGE_EMPTY')
      }}</span>
    </p>
    <div
      class="grid min-w-0 gap-5 2xl:grid-cols-[minmax(260px,1fr)_minmax(0,2fr)]"
    >
      <section
        class="min-w-0 rounded-2xl border border-n-weak bg-n-solid-1 p-5 shadow-sm"
      >
        <h2 class="border-b border-n-weak pb-4 font-bold">
          {{ t('JRC_CONTACT_CENTER.RECORDINGS.UPLOAD_TITLE') }}
        </h2>
        <p class="my-4 text-sm leading-relaxed text-n-slate-10">
          {{ t('JRC_CONTACT_CENTER.RECORDINGS.UPLOAD_DESCRIPTION') }}
        </p>
        <div
          class="rounded-xl border-2 border-dashed border-n-blue-5 bg-n-blue-1 p-5 text-center"
          @dragover.prevent
          @drop.prevent="chooseFiles($event.dataTransfer.files)"
        >
          <Icon
            icon="i-lucide-cloud-upload"
            class="mx-auto mb-4 size-9 text-n-blue-10"
          />
          <p class="mb-4 text-sm font-semibold">
            {{ t('JRC_CONTACT_CENTER.RECORDINGS.DROP') }}
          </p>
          <input
            ref="fileInput"
            type="file"
            multiple
            :disabled="uploading"
            accept=".mp3,.wav,.ogg,.m4a"
            class="sr-only"
            :aria-label="t('JRC_CONTACT_CENTER.RECORDINGS.CHOOSE')"
            @change="chooseFiles($event.target.files)"
          />
          <button
            type="button"
            class="rounded-full bg-n-blue-9 px-5 py-3 text-xs font-bold text-white hover:bg-n-blue-10"
            :disabled="uploading"
            @click="fileInput.click()"
          >
            {{ t('JRC_CONTACT_CENTER.RECORDINGS.CHOOSE') }}
          </button>
          <p v-if="batch.length" class="mt-4 text-sm font-medium" role="status">
            {{
              t('JRC_CONTACT_CENTER.RECORDINGS.BATCH_COUNT', {
                total: batch.length,
                sent: sentCount,
              })
            }}
          </p>
          <p class="mt-4 text-xs leading-relaxed text-n-slate-10">
            {{ t('JRC_CONTACT_CENTER.RECORDINGS.FORMATS') }}
          </p>
        </div>
        <ul
          v-if="batch.length"
          class="mt-4 max-h-72 space-y-2 overflow-y-auto text-sm"
          data-testid="audio-upload-batch"
        >
          <li
            v-for="entry in batch"
            :key="entry.key"
            class="rounded-lg border border-n-weak p-3"
          >
            <div class="flex items-start justify-between gap-3">
              <p class="min-w-0 break-all font-medium">{{ entry.file.name }}</p>
              <button
                type="button"
                :disabled="uploading"
                class="shrink-0 text-n-blue-11 underline disabled:opacity-40"
                @click="removeFile(entry.key)"
              >
                {{ t('JRC_CONTACT_CENTER.RECORDINGS.REMOVE_SELECTION') }}
              </button>
            </div>
            <p
              class="mt-1 text-xs"
              :class="entry.error ? 'text-red-600' : 'text-n-slate-10'"
              role="status"
            >
              {{
                tm('JRC_CONTACT_CENTER.RECORDINGS.BATCH_STATES')[entry.status]
              }}
            </p>
            <p v-if="entry.error" class="mt-1 text-xs text-red-600">
              {{ entry.error }}
            </p>
            <button
              v-if="entry.status === 'upload_failed'"
              type="button"
              :disabled="uploading"
              class="mt-2 text-xs text-n-blue-11 underline"
              @click="
                entry.status = 'ready';
                entry.error = '';
              "
            >
              {{ t('JRC_CONTACT_CENTER.RECORDINGS.RETRY_UPLOAD') }}
            </button>
          </li>
        </ul>
        <p class="my-4 text-xs leading-relaxed text-n-slate-10">
          {{ t('JRC_CONTACT_CENTER.RECORDINGS.PROVIDER_NOTICE') }}
        </p>
        <button
          type="button"
          :disabled="
            !readyFiles.length || !configuration?.configured || uploading
          "
          class="flex w-full items-center justify-center gap-2 rounded-full bg-n-blue-9 px-5 py-3 text-sm font-bold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
          @click="upload"
        >
          <Icon icon="i-lucide-audio-lines" class="size-4" />{{
            uploading
              ? t('JRC_CONTACT_CENTER.RECORDINGS.UPLOADING')
              : t('JRC_CONTACT_CENTER.RECORDINGS.ANALYZE_BATCH', {
                  count: readyFiles.length,
                })
          }}
        </button>
      </section>
      <section
        ref="historySection"
        class="flex min-w-0 flex-col rounded-2xl border border-n-weak bg-n-solid-1 p-5 shadow-sm"
      >
        <header class="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 class="font-bold">
            {{ t('JRC_CONTACT_CENTER.RECORDINGS.HISTORY') }}
          </h2>
          <button
            type="button"
            :disabled="loading"
            class="rounded-lg border border-n-weak px-3 py-2 text-xs font-semibold disabled:opacity-50"
            @click="refresh"
          >
            {{ t('JRC_CONTACT_CENTER.RECORDINGS.REFRESH') }}
          </button>
        </header>
        <nav
          :aria-label="t('JRC_CONTACT_CENTER.RECORDINGS.HISTORY_FILTERS')"
          class="mb-4 flex flex-wrap gap-2"
        >
          <button
            v-for="option in historyFilters"
            :key="option.id"
            type="button"
            :data-testid="`recording-filter-${option.id}`"
            :aria-pressed="filter === option.id"
            :disabled="loading"
            class="rounded-full border px-3 py-2 text-xs font-semibold disabled:opacity-50"
            :class="
              filter === option.id
                ? 'border-n-blue-9 bg-n-blue-9 text-white'
                : 'border-n-weak bg-n-solid-1 text-n-slate-11 hover:bg-n-alpha-2'
            "
            @click="selectFilter(option.id)"
          >
            {{ option.label }}
          </button>
        </nav>
        <p class="mb-3 text-xs leading-relaxed text-n-slate-10">
          {{
            t('JRC_CONTACT_CENTER.RECORDINGS.FILTER_NOTICE', { count: perPage })
          }}
        </p>
        <div class="min-w-0 flex-1 overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-n-solid-2 text-n-slate-10">
              <tr>
                <th class="p-3">
                  {{ t('JRC_CONTACT_CENTER.RECORDINGS.DATE') }}
                </th>
                <th class="p-3">
                  {{ t('JRC_CONTACT_CENTER.RECORDINGS.FILE') }}
                </th>
                <th class="p-3">
                  {{ t('JRC_CONTACT_CENTER.RECORDINGS.TEMPERATURE') }}
                </th>
                <th class="p-3">
                  {{ t('JRC_CONTACT_CENTER.RECORDINGS.SENTIMENT') }}
                </th>
                <th class="p-3">
                  {{ t('JRC_CONTACT_CENTER.RECORDINGS.SCORE') }}
                </th>
                <th class="p-3">
                  {{ t('JRC_CONTACT_CENTER.RECORDINGS.CLASSIFICATION') }}
                </th>
                <th class="p-3">
                  {{ t('JRC_CONTACT_CENTER.RECORDINGS.STATUS') }}
                </th>
                <th class="p-3">
                  {{ t('JRC_CONTACT_CENTER.RECORDINGS.ALERT') }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-n-weak">
              <tr
                v-for="item in items"
                :key="item.id"
                :class="selected?.id === item.id ? 'bg-n-blue-1' : ''"
              >
                <td class="whitespace-nowrap p-3">
                  {{ date(item.created_at) }}
                </td>
                <td class="min-w-32 max-w-56 break-all p-3">
                  <button
                    type="button"
                    class="line-clamp-2 break-all text-left font-semibold text-n-blue-11 underline"
                    :title="item.filename"
                    @click="openAudit(item.id)"
                  >
                    {{ item.filename }}
                  </button>
                </td>
                <td class="p-3">{{ label(item.temperatura_conversa) }}</td>
                <td class="p-3">{{ label(item.sentimento_cliente) }}</td>
                <td class="p-3 font-bold">
                  {{ item.nota_final ?? '—' }}
                  <p
                    v-if="item.status === 'completed' && !item.score_version"
                    class="mt-1 text-[10px] font-normal text-n-slate-10"
                  >
                    {{ t('JRC_CONTACT_CENTER.RECORDINGS.LEGACY_SCORE') }}
                  </p>
                  <p
                    v-else-if="item.score_partial"
                    class="mt-1 text-[10px] font-normal text-n-slate-10"
                  >
                    {{ t('JRC_CONTACT_CENTER.RECORDINGS.PARTIAL_SCORE') }}
                  </p>
                </td>
                <td class="p-3">
                  <ClassificationBadge :value="item.classificacao_ligacao" />
                </td>
                <td class="p-3">
                  <p
                    :class="
                      item.status === 'failed'
                        ? 'text-red-600'
                        : 'text-n-slate-11'
                    "
                  >
                    {{ label(item.status) }}
                  </p>
                  <button
                    v-if="item.status === 'failed'"
                    type="button"
                    :disabled="uploading"
                    class="mt-2 block text-n-blue-11 underline"
                    @click="retry(item.id)"
                  >
                    {{ t('JRC_CONTACT_CENTER.RECORDINGS.RETRY') }}
                  </button>
                </td>
                <td class="p-3">
                  {{
                    label(
                      item.alerta_supervisao === undefined
                        ? null
                        : String(item.alerta_supervisao)
                    )
                  }}
                </td>
              </tr>
              <tr v-if="!items.length">
                <td
                  colspan="8"
                  class="py-16 text-center text-sm text-n-slate-10"
                >
                  {{ emptyHistoryMessage }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <footer
          class="mt-4 flex items-center justify-between gap-3 border-t border-n-weak pt-4 text-xs"
        >
          <button
            type="button"
            :disabled="page <= 1 || loading"
            class="rounded-lg border border-n-weak px-3 py-2 disabled:opacity-40"
            @click="changePage(-1)"
          >
            {{ t('JRC_CONTACT_CENTER.RECORDINGS.PREVIOUS') }}
          </button>
          <span>{{
            t('JRC_CONTACT_CENTER.RECORDINGS.PAGE', { page, total })
          }}</span>
          <button
            type="button"
            :disabled="page * perPage >= total || loading"
            class="rounded-lg border border-n-weak px-3 py-2 disabled:opacity-40"
            @click="changePage(1)"
          >
            {{ t('JRC_CONTACT_CENTER.RECORDINGS.NEXT') }}
          </button>
        </footer>
      </section>
    </div>
    <AudioAuditDialog ref="reportDialog" @close="closeReport">
      <p v-if="opening" role="status" class="text-sm text-n-slate-10">
        {{ t('JRC_CONTACT_CENTER.COMMON.LOADING') }}
      </p>
      <p v-if="selected" class="mb-4 break-all text-xs text-n-slate-10">
        {{ selected.filename }}
      </p>
      <p
        v-if="error"
        role="alert"
        class="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
      >
        {{ error }}
      </p>
      <div
        v-if="selected && busy(selected.status)"
        role="status"
        class="rounded-xl border border-n-blue-5 bg-n-blue-1 p-5 text-sm text-n-blue-11"
      >
        {{ t('JRC_CONTACT_CENTER.RECORDINGS.PROCESSING') }}
      </div>
      <p
        v-if="selected?.status === 'failed'"
        role="alert"
        class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
      >
        {{
          tm('JRC_CONTACT_CENTER.RECORDINGS.ERRORS')[selected.error_code] ||
          t('JRC_CONTACT_CENTER.RECORDINGS.ERROR')
        }}
      </p>
      <audio
        v-if="audioUrl"
        :key="audioUrl"
        ref="audioPlayer"
        controls
        :src="audioUrl"
        class="mb-4 w-full"
        :aria-label="t('JRC_CONTACT_CENTER.RECORDINGS.LISTEN')"
      />
      <AudioAuditResult
        v-if="selected?.status === 'completed'"
        :key="selected.id"
        :audit="selected"
        @download="download"
        @play="listen"
      />
      <template #actions>
        <p
          v-if="selected?.refreshable_partial"
          class="w-full text-xs leading-relaxed text-n-slate-10"
        >
          {{ t('JRC_CONTACT_CENTER.RECORDINGS.REFRESH_PARTIAL_NOTICE') }}
        </p>
        <button
          v-if="selected?.refreshable_partial"
          type="button"
          :disabled="uploading"
          class="rounded-lg border border-n-blue-5 px-4 py-2 text-sm font-semibold text-n-blue-11 disabled:opacity-40"
          @click="retry(selected.id)"
        >
          {{ t('JRC_CONTACT_CENTER.RECORDINGS.REFRESH_PARTIAL') }}
        </button>
      </template>
    </AudioAuditDialog>
  </div>
</template>
