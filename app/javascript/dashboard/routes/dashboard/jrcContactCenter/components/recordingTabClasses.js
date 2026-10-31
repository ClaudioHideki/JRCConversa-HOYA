// Shared tab colors keep report sections, history filters and roles consistent.
const colors = {
  sky: {
    inactive:
      'border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-200',
    active:
      'border-sky-800 bg-sky-800 text-white ring-sky-800 dark:ring-sky-200 dark:border-sky-200 dark:bg-sky-200 dark:text-sky-950',
  },
  indigo: {
    inactive:
      'border-indigo-200 bg-indigo-50 text-indigo-900 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-200',
    active:
      'border-indigo-800 bg-indigo-800 text-white ring-indigo-800 dark:ring-indigo-200 dark:border-indigo-200 dark:bg-indigo-200 dark:text-indigo-950',
  },
  emerald: {
    inactive:
      'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
    active:
      'border-emerald-800 bg-emerald-800 text-white ring-emerald-800 dark:ring-emerald-200 dark:border-emerald-200 dark:bg-emerald-200 dark:text-emerald-950',
  },
  rose: {
    inactive:
      'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200',
    active:
      'border-rose-800 bg-rose-800 text-white ring-rose-800 dark:ring-rose-200 dark:border-rose-200 dark:bg-rose-200 dark:text-rose-950',
  },
  teal: {
    inactive:
      'border-teal-200 bg-teal-50 text-teal-900 dark:border-teal-800 dark:bg-teal-950 dark:text-teal-200',
    active:
      'border-teal-800 bg-teal-800 text-white ring-teal-800 dark:ring-teal-200 dark:border-teal-200 dark:bg-teal-200 dark:text-teal-950',
  },
  cyan: {
    inactive:
      'border-cyan-200 bg-cyan-50 text-cyan-900 dark:border-cyan-800 dark:bg-cyan-950 dark:text-cyan-200',
    active:
      'border-cyan-800 bg-cyan-800 text-white ring-cyan-800 dark:ring-cyan-200 dark:border-cyan-200 dark:bg-cyan-200 dark:text-cyan-950',
  },
  amber: {
    inactive:
      'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200',
    active:
      'border-amber-800 bg-amber-800 text-white ring-amber-800 dark:ring-amber-200 dark:border-amber-200 dark:bg-amber-200 dark:text-amber-950',
  },
  zinc: {
    inactive:
      'border-zinc-200 bg-zinc-50 text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200',
    active:
      'border-zinc-800 bg-zinc-800 text-white ring-zinc-800 dark:ring-zinc-200 dark:border-zinc-200 dark:bg-zinc-200 dark:text-zinc-950',
  },
  orange: {
    inactive:
      'border-orange-200 bg-orange-50 text-orange-900 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-200',
    active:
      'border-orange-800 bg-orange-800 text-white ring-orange-800 dark:ring-orange-200 dark:border-orange-200 dark:bg-orange-200 dark:text-orange-950',
  },
  fuchsia: {
    inactive:
      'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-900 dark:border-fuchsia-800 dark:bg-fuchsia-950 dark:text-fuchsia-200',
    active:
      'border-fuchsia-800 bg-fuchsia-800 text-white ring-fuchsia-800 dark:ring-fuchsia-200 dark:border-fuchsia-200 dark:bg-fuchsia-200 dark:text-fuchsia-950',
  },
};
const tones = {
  summary: 'sky',
  score: 'indigo',
  positive: 'emerald',
  negative: 'rose',
  context: 'teal',
  criteria: 'cyan',
  audit: 'amber',
  transcript: 'zinc',
  all: 'sky',
  audited: 'sky',
  scored: 'emerald',
  alerts: 'amber',
  critical: 'rose',
  hot: 'orange',
  churn: 'fuchsia',
  atendente: 'sky',
  cliente: 'fuchsia',
};

export const recordingTabClasses = (id, selected) => [
  colors[tones[id]][selected ? 'active' : 'inactive'],
  selected ? 'ring-2 ring-offset-2 ring-offset-n-solid-1' : '',
];
