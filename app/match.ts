const ALIASES: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
  'next.js': 'nextjs',
  reactjs: 'react',
  'node.js': 'nodejs',
  figma: 'design',
  canva: 'design',
  tutoring: 'teaching',
  mentor: 'teaching',
};

export function normalizeSkill(s: string): string {
  const k = s.toLowerCase().trim();
  return ALIASES[k] ?? k;
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
  teacher: ['teaching', 'tutoring', 'mentoring', 'arabic', 'french', 'math'],
  student: ['teaching', 'tutoring', 'translation', 'design', 'dev', 'nextjs', 'math'],
  freelancer: ['design', 'dev', 'nextjs', 'typescript', 'translation'],
  employee: ['dev', 'management', 'logistics'],
  housewife: ['cooking', 'tutoring', 'translation', 'crafts'],
  retiree: ['mentoring', 'teaching', 'logistics'],
  job_seeker: ['beginner', 'logistics', 'translation'],
};

export function scoreOpportunity(user: UserLike, opp: OppLike) {
  const userSkills = normalizeList(user.skills);
  const reqSkills = normalizeList(opp.skills);
  const userSet = new Set(userSkills);

  const matched = reqSkills.filter((s) => userSet.has(s));
  const missing = reqSkills.filter((s) => !userSet.has(s));
  const matchPct =
    reqSkills.length === 0 ? 100 : Math.round((matched.length / reqSkills.length) * 100);

  const reasons: string[] = [];
  if (reqSkills.length === 0) reasons.push('open to all');
  else if (matched.length > 0)
    reasons.push(`${matched.length}/${reqSkills.length} skills (${matched.join(', ')})`);
  else reasons.push('new skills to learn');

  const campusMatch =
    !!user.campus &&
    !!opp.campus &&
    user.campus.toLowerCase().trim() === opp.campus.toLowerCase().trim();
  if (campusMatch) reasons.push('same campus');

  const occ = user.occupation?.toLowerCase() ?? '';
  const fitSkills = OCCUPATION_FIT[occ] ?? [];
  if (occ && matched.some((s) => fitSkills.includes(s))) {
    reasons.push(`good fit for ${occ.replace('_', ' ')}`);
  }
  if (opp.difficulty === 'beginner') reasons.push('beginner-friendly');

  return { matchCount: matched.length, matchPct, matched, missing, campusMatch, reasons };
}
