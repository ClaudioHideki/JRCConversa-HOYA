<script setup>
import { nextTick, onBeforeUnmount, ref } from 'vue';
import { useScrollLock } from '@vueuse/core';
import { useI18n } from 'vue-i18n';
import TeleportWithDirection from 'dashboard/components-next/TeleportWithDirection.vue';

const emit = defineEmits(['close']);
const { t } = useI18n();
const dialog = ref(null);
const opened = ref(false);
const scrollLocked = useScrollLock(document.body);
let previousLock = false;

const open = async () => {
  if (opened.value) return;
  previousLock = scrollLocked.value;
  scrollLocked.value = true;
  opened.value = true;
  await nextTick();
  if (opened.value && !dialog.value.open) dialog.value.showModal();
};
const handleClose = () => {
  if (!opened.value) return;
  opened.value = false;
  scrollLocked.value = previousLock;
  emit('close');
};
const close = () => {
  if (dialog.value?.open) dialog.value.close();
  else handleClose();
};
onBeforeUnmount(() => {
  if (opened.value) {
    close();
    scrollLocked.value = previousLock;
  }
});
defineExpose({ open, close });
</script>

<template>
  <TeleportWithDirection to="body">
    <dialog
      ref="dialog"
      aria-modal="true"
      aria-labelledby="jrc-audio-report-title"
      class="m-auto max-h-[90dvh] w-[calc(100vw-2rem)] max-w-6xl overflow-hidden rounded-2xl border border-n-weak bg-n-solid-1 p-0 text-n-slate-12 shadow-xl backdrop:bg-black/50 backdrop:backdrop-blur-sm"
      @close="handleClose"
      @cancel.prevent="close"
    >
      <section v-if="opened" class="flex max-h-[90dvh] min-h-0 flex-col">
        <header
          class="flex shrink-0 items-center justify-between gap-4 border-b border-n-weak p-4"
        >
          <h2 id="jrc-audio-report-title" class="text-lg font-bold">
            {{ t('JRC_CONTACT_CENTER.RECORDINGS.REPORT_DIALOG_TITLE') }}
          </h2>
          <button
            type="button"
            class="rounded-lg border border-n-weak px-3 py-2 text-sm font-semibold hover:bg-n-alpha-2"
            :aria-label="t('JRC_CONTACT_CENTER.RECORDINGS.CLOSE_REPORT')"
            @click="close"
          >
            {{ t('JRC_CONTACT_CENTER.RECORDINGS.CLOSE_REPORT') }}
          </button>
        </header>
        <div
          class="min-h-0 overflow-y-auto overscroll-contain p-4 md:p-6"
          data-testid="audit-dialog-content"
        >
          <slot />
        </div>
        <footer
          class="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-n-weak p-4"
        >
          <slot name="actions" />
          <button
            type="button"
            class="rounded-lg bg-n-blue-9 px-5 py-2 text-sm font-bold text-white hover:bg-n-blue-10"
            @click="close"
          >
            {{ t('JRC_CONTACT_CENTER.RECORDINGS.CLOSE_REPORT') }}
          </button>
        </footer>
      </section>
    </dialog>
  </TeleportWithDirection>
</template>
