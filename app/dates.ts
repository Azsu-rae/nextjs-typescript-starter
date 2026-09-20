export function formatDeadline(d: Date | string | null | undefined): string {
  if (!d) return 'No deadline';
  const dt = d instanceof Date ? d : new Date(d);
  return dt.toLocaleDateString(undefined, {
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
  if (days === null) return 'No deadline';
  if (days < 0) return `Overdue by ${Math.abs(days)}d`;
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `Due in ${days}d`;
}
