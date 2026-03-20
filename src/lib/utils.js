export function fmt(val) {
  if (val === 0) return '$0';
  const abs = Math.abs(val);
  const sign = val < 0 ? '-' : '';
  if (abs >= 1_000_000) return sign + '$' + (abs / 1_000_000).toFixed(2) + 'M';
  if (abs >= 10_000) return sign + '$' + (abs / 1000).toFixed(1) + 'K';
  if (abs >= 1_000) return sign + '$' + (abs / 1000).toFixed(1) + 'K';
  return sign + '$' + abs.toFixed(0);
}

export function fmtFull(val) {
  const sign = val < 0 ? '-' : '';
  return sign + '$' + Math.abs(val).toLocaleString('en-US', { maximumFractionDigits: 0 });
}

export function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val));
}
