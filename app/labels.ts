export function difficultyLabel(d: string | null | undefined): string {
  switch (d) {
    case 'beginner':
      return 'مبتدئ';
    case 'intermediate':
      return 'متوسط';
    case 'advanced':
      return 'متقدم';
    default:
      return d ?? '—';
  }
}

export function opportunityStatusLabel(s: string | null | undefined): string {
  switch (s) {
    case 'open':
      return 'مفتوح';
    case 'closed':
      return 'مغلق';
    case 'filled':
      return 'مكتمل العدد';
    default:
      return s ?? '—';
  }
}

export function applicationStatusLabel(s: string | null | undefined): string {
  switch (s) {
    case 'pending':
      return 'قيد الانتظار';
    case 'accepted':
      return 'مقبول';
    case 'rejected':
      return 'مرفوض';
    case 'completed':
      return 'منجز';
    default:
      return s ?? '—';
  }
}
