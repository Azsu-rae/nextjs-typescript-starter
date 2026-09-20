// Canonical skill keys are Arabic. Legacy English/French values (from before
// Arabization) still normalize to the same keys so old rows keep matching.
const ALIASES: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
  'next.js': 'nextjs',
  reactjs: 'react',
  'node.js': 'nodejs',
  figma: 'التصميم',
  canva: 'التصميم',
  design: 'التصميم',
  tutoring: 'التدريس',
  teaching: 'التدريس',
  mentor: 'التدريس',
  mentoring: 'التدريس',
  translation: 'الترجمة',
  arabic: 'العربية',
  french: 'الفرنسية',
  english: 'الإنجليزية',
  math: 'الرياضيات',
  dev: 'البرمجة',
  development: 'البرمجة',
  'web development': 'تطوير الويب',
  environment: 'البيئة',
  teamwork: 'العمل الجماعي',
  cleaning: 'التنظيف',
  logistics: 'اللوجستيك',
  photography: 'التصوير',
  management: 'التنظيم',
  cooking: 'الطبخ',
  crafts: 'الحرف',
  'infrastructure & systems administration': 'إدارة الأنظمة',
  'ai agentic integration': 'الذكاء الاصطناعي',
};

export function normalizeSkill(s: string): string {
  const k = s.toLowerCase().trim();
  return ALIASES[k] ?? s.trim();
}

export function normalizeList(input: string[] | null | undefined): string[] {
  if (!input) return [];
  const out: string[] = [];
  for (const raw of input) {
    // entries may themselves be comma-separated from legacy data
    for (const part of String(raw).split(',')) {
      const n = normalizeSkill(part);
      if (n && !out.includes(n)) out.push(n);
    }
  }
  return out;
}

export function parseCommaList(input: FormDataEntryValue | null): string[] {
  if (typeof input !== 'string') return [];
  return normalizeList([input]);
}

type UserLike = {
  skills?: string[] | null;
  campus?: string | null;
  occupation?: string | null;
};

type OppLike = {
  skills?: string[] | null;
  campus?: string | null;
  difficulty?: string | null;
};

const OCCUPATION_FIT: Record<string, string[]> = {
  teacher: ['التدريس', 'العربية', 'الفرنسية', 'الرياضيات'],
  student: ['التدريس', 'الترجمة', 'التصميم', 'البرمجة', 'nextjs', 'الرياضيات'],
  freelancer: ['التصميم', 'البرمجة', 'nextjs', 'typescript', 'الترجمة'],
  employee: ['البرمجة', 'التنظيم', 'اللوجستيك'],
  housewife: ['الطبخ', 'التدريس', 'الترجمة', 'الحرف'],
  retiree: ['التدريس', 'التنظيم', 'اللوجستيك'],
  job_seeker: ['الترجمة', 'اللوجستيك'],
  other: [],
};

const OCCUPATION_AR: Record<string, string> = {
  teacher: 'أستاذ',
  student: 'طالب',
  freelancer: 'مستقل',
  employee: 'موظف',
  housewife: 'ربة بيت',
  retiree: 'متقاعد',
  job_seeker: 'باحث عن عمل',
  other: 'أخرى',
};

export function occupationLabel(o: string | null | undefined): string {
  if (!o) return '—';
  return OCCUPATION_AR[o.toLowerCase()] ?? o;
}

export function scoreOpportunity(user: UserLike, opp: OppLike) {
  const userSkills = normalizeList(user.skills);
  const reqSkills = normalizeList(opp.skills);
  const userSet = new Set(userSkills);

  const matched = reqSkills.filter((s) => userSet.has(s));
  const missing = reqSkills.filter((s) => !userSet.has(s));
  const matchPct =
    reqSkills.length === 0 ? 100 : Math.round((matched.length / reqSkills.length) * 100);

  const reasons: string[] = [];
  if (reqSkills.length === 0) reasons.push('مفتوح للجميع');
  else if (matched.length > 0)
    reasons.push(`${matched.length}/${reqSkills.length} مهارات (${matched.join('، ')})`);
  else reasons.push('مهارات جديدة لاكتسابها');

  const campusMatch =
    !!user.campus &&
    !!opp.campus &&
    user.campus.toLowerCase().trim() === opp.campus.toLowerCase().trim();
  if (campusMatch) reasons.push('نفس الحرم');

  const occ = user.occupation?.toLowerCase() ?? '';
  const fitSkills = OCCUPATION_FIT[occ] ?? [];
  if (occ && matched.some((s) => fitSkills.includes(s))) {
    reasons.push(`مناسب لـ${occupationLabel(occ)}`);
  }
  if (opp.difficulty === 'beginner') reasons.push('مناسب للمبتدئين');

  return { matchCount: matched.length, matchPct, matched, missing, campusMatch, reasons };
}
