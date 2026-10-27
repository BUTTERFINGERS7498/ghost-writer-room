const PALETTE = ['#8ee6d0', '#e0b97a', '#b49ae6', '#e07a7a', '#7ab8e0', '#a8d672', '#e69ac9'];

function colorFor(name = '') {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export default function Avatar({ name, size = 32 }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-night"
      style={{ width: size, height: size, background: colorFor(name), fontSize: size * 0.42 }}
    >
      {name?.[0]?.toUpperCase() ?? '?'}
    </span>
  );
}
