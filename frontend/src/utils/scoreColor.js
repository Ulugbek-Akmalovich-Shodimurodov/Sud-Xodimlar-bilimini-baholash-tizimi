export function scoreColorClass(score) {
  const value = Number(score);
  if (Number.isNaN(value)) return 'text-slate-700';
  if (value <= 60) return 'text-red-600';
  if (value <= 70) return 'text-orange-700';
  if (value <= 80) return 'text-orange-500';
  if (value <= 90) return 'text-yellow-500';
  return 'text-emerald-600';
}
