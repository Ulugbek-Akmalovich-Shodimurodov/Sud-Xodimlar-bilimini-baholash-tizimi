export function scoreColorClass(score) {
  const value = Number(score);
  if (Number.isNaN(value)) return 'text-indigo-700';
  if (value <= 60) return 'text-rose-700';
  if (value <= 70) return 'text-amber-700';
  if (value <= 80) return 'text-indigo-700';
  if (value <= 90) return 'text-indigo-900';
  return 'text-indigo-900';
}
