export const GENRES = ['fantasy', 'sci-fi', 'horror', 'mystery', 'romance', 'comedy', 'thriller', 'other'];

export const GENRE_EMOJI = {
  fantasy: '🐉',
  'sci-fi': '🚀',
  horror: '🕯️',
  mystery: '🔍',
  romance: '🌹',
  comedy: '🎭',
  thriller: '🔪',
  other: '📜',
};

export const ROUND_PRESETS = [
  { label: '2 minutes (demo)', value: 2 },
  { label: '15 minutes', value: 15 },
  { label: '1 hour', value: 60 },
  { label: '6 hours', value: 360 },
  { label: '24 hours', value: 1440 },
  { label: '3 days', value: 4320 },
];

export function formatDuration(ms) {
  if (ms <= 0) return '0s';
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d) return `${d}d ${h}h`;
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m ${sec.toString().padStart(2, '0')}s`;
  return `${sec}s`;
}

export function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
