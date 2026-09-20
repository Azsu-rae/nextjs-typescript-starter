import { auth, requireUser } from 'app/auth';
import { db, getUser } from 'app/db';
import { users, volunteerLogs } from 'app/schema';
import OrgAvatar from 'app/components/org-avatar';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import TopBar from 'app/components/top-bar';

type Search = {
  q?: string;
  skill?: string;
  campus?: string;
  occupation?: string;
};

const OCCUPATIONS = [
  'student',
  'employee',
  'teacher',
  'freelancer',
  'housewife',
  'retiree',
  'job_seeker',
  'other',
] as const;

export default async function VolunteersPage({
  searchParams,
}: {
  searchParams: Search;
}) {
  const me: any = await requireUser();

  // Public fields only — never passwords, emails, or phones
  const all = await db
    .select({
      id: users.id,
      name: users.name,
      occupation: users.occupation,
      campus: users.campus,
      university: users.university,
      city: users.city,
      skills: users.skills,
      bio: users.bio,
      avatarUrl: users.avatarUrl,
    })
    .from(users)
    .orderBy(users.createdAt);

  const logs = await db
    .select({ userId: volunteerLogs.userId, verified: volunteerLogs.verified, hours: volunteerLogs.hours })
    .from(volunteerLogs);
  const verifiedHours = new Map<number, number>();
  for (const l of logs) {
    if (!l.verified) continue;
    verifiedHours.set(l.userId, (verifiedHours.get(l.userId) ?? 0) + l.hours);
  }

  const q = (searchParams.q ?? '').toLowerCase().trim();
  const fSkill = (searchParams.skill ?? '').toLowerCase().trim();
  const fCampus = (searchParams.campus ?? '').toLowerCase().trim();
  const fOccupation = searchParams.occupation ?? '';

  const filtered = all.filter((v) => {
    if (q && !(`${v.name ?? ''} ${v.bio ?? ''}`.toLowerCase().includes(q))) return false;
    if (fSkill && !(v.skills ?? []).map((s) => s.toLowerCase()).some((s) => s.includes(fSkill))) return false;
    if (fCampus && !`${v.campus ?? ''} ${v.university ?? ''}`.toLowerCase().includes(fCampus)) return false;
    if (fOccupation && v.occupation !== fOccupation) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#f8f8f5]">
      <TopBar name={me.name ?? ''} avatarUrl={me.avatarUrl} active="/volunteers" />

      <main className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="mb-4 text-xl font-bold">Volunteers</h1>
        <form method="get" className="mb-6 flex flex-wrap gap-2 rounded-xl border border-gray-200 bg-white p-3">
          <input
            name="q"
            defaultValue={searchParams.q ?? ''}
            placeholder="Search name or bio…"
            className="min-w-[160px] flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            name="skill"
            defaultValue={searchParams.skill ?? ''}
            placeholder="Skill"
            className="w-32 rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            name="campus"
            defaultValue={searchParams.campus ?? ''}
            placeholder="Campus"
            className="w-32 rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <select
            name="occupation"
            defaultValue={fOccupation}
            className="rounded-md border border-gray-300 px-2 py-2 text-sm"
          >
            <option value="">All occupations</option>
            {OCCUPATIONS.map((o) => (
              <option key={o} value={o}>{o.replace('_', ' ')}</option>
            ))}
          </select>
          <button className="rounded-md bg-[#1E4D38] px-4 py-2 text-sm text-white hover:bg-[#163A2B]" type="submit">
            Search
          </button>
          <Link href="/volunteers" className="px-2 py-2 text-sm text-gray-500 underline">
            Reset
          </Link>
        </form>

        {filtered.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
            No volunteers match.
          </p>
        ) : (
          <ul className="space-y-2">
            {filtered.map((v) => (
              <li key={v.id} className="rounded-xl border border-gray-200 bg-white p-3">
                <Link href={`/volunteers/${v.id}`} className="flex items-center gap-3">
                  <OrgAvatar name={v.name ?? `Volunteer ${v.id}`} logoUrl={v.avatarUrl} />
                  <div className="min-w-0">
                    <p className="font-medium">{v.name ?? `Volunteer #${v.id}`}</p>
                    <p className="truncate text-sm text-gray-500">
                      {v.occupation ? String(v.occupation).replace('_', ' ') : '—'} ·{' '}
                      {v.campus ?? v.university ?? '—'} · {verifiedHours.get(v.id) ?? 0}h verified
                    </p>
                    {(v.skills ?? []).length > 0 && (
                      <p className="mt-1 truncate text-sm text-gray-600">{(v.skills ?? []).join(', ')}</p>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
