export function formatDeadline(d: Date | string | null | undefined): string {
  if (!d) return 'بدون أجل';
  const dt = d instanceof Date ? d : new Date(d);
  return dt.toLocaleDateString('ar', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function daysUntil(d: Date | string | null | undefined): number | null {
  if (!d) return null;
  const dt = d instanceof Date ? d : new Date(d);
  const ms = dt.getTime() - Date.now();
  return Math.ceil(ms / 86_400_000);
}

export function deadlineLabel(d: Date | string | null | undefined): string {
  const days = daysUntil(d);
  if (days === null) return 'بدون أجل';
  if (days < 0) return `متجاوز بـ ${Math.abs(days)} يوم`;
  if (days === 0) return 'آخر أجل اليوم';
  if (days === 1) return 'آخر أجل غدا';
  if (days === 2) return 'آخر أجل بعد غد';
  return `متبق ${days} يوم`;
}
