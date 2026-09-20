import { auth, requireUser } from 'app/auth';
import { db, getUser } from 'app/db';
import { applications, opportunities, organizations } from 'app/schema';
import { deadlineLabel, formatDeadline } from 'app/dates';
import OrgAvatar from 'app/components/org-avatar';
import Slideshow from 'app/components/slideshow';
import TopBar from 'app/components/top-bar';
import { normalizeList, scoreOpportunity } from 'app/match';
import { and, desc, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';

type Search = {
  q?: string;
  campus?: string;
  skill?: string;
  difficulty?: string;
  urgent?: string;
  matched?: string;
};

async function applyAction(formData: FormData) {
  'use server';
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return;
  const rows = await getUser(email);
  const user = rows[0];
  if (!user) return;
  const opportunityId = Number(formData.get('opportunityId'));
  if (!opportunityId) return;

  const existing = await db
    .select()
    .from(applications)
    .where(
      and(
        eq(applications.opportunityId, opportunityId),
        eq(applications.userId, user.id),
      ),
    );
  if (existing.length === 0) {
    await db.insert(applications).values({
      opportunityId,
      userId: user.id,
      message: (formData.get('message') as string) || null,
    });
  }
  revalidatePath('/protected');
}

export default async function ProtectedPage({
  searchParams,
}: {
  searchParams: Search;
}) {
  const me = await requireUser() as any;
  const email = me.email as string;
  const mySkills = normalizeList(me?.skills);

  const rows = await db
    .select({
      id: opportunities.id,
      title: opportunities.title,
      description: opportunities.description,
      skills: opportunities.skills,
      effortHours: opportunities.effortHours,
      difficulty: opportunities.difficulty,
      campus: opportunities.campus,
      urgent: opportunities.urgent,
      status: opportunities.status,
      deadline: opportunities.deadline,
      images: opportunities.images,
      createdAt: opportunities.createdAt,
      orgName: organizations.name,
      orgVerified: organizations.verified,
      orgCampus: organizations.campus,
      orgLogoUrl: organizations.logoUrl,
      orgId: organizations.id,
    })
    .from(opportunities)
    .leftJoin(organizations, eq(opportunities.orgId, organizations.id))
    .where(eq(opportunities.status, 'open'))
    .orderBy(desc(opportunities.urgent), desc(opportunities.createdAt))
    .limit(50);

  const q = (searchParams.q ?? '').toLowerCase().trim();
  const fCampus = (searchParams.campus ?? '').toLowerCase().trim();
  const fSkill = (searchParams.skill ?? '').toLowerCase().trim();
  const fDifficulty = searchParams.difficulty ?? '';
  const urgentOnly = searchParams.urgent === '1';
  const matchedOnly = searchParams.matched === '1' && mySkills.length > 0;

  const scored = rows
    .map((r) => {
      const oppSkills = normalizeList(r.skills);
      const s = scoreOpportunity(
        { skills: mySkills, campus: me?.campus ?? null, occupation: me?.occupation ?? null },
        { skills: oppSkills, campus: r.campus ?? null, difficulty: r.difficulty ?? null },
      );
      return { ...r, oppSkills, ...s };
    })
    .filter((r) => {
      if (q && !(r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q))) return false;
      if (fCampus && !(r.campus ?? '').toLowerCase().includes(fCampus)) return false;
      if (fSkill && !r.oppSkills.map((s) => s.toLowerCase()).some((s) => s.includes(fSkill))) return false;
      if (fDifficulty && r.difficulty !== fDifficulty) return false;
      if (urgentOnly && !r.urgent) return false;
      if (matchedOnly && r.matchCount === 0) return false;
      return true;
    })
    .sort((a, b) => b.matchPct - a.matchPct || Number(b.urgent) - Number(a.urgent));

  const myApps = me
    ? await db
        .select({ opportunityId: applications.opportunityId })
        .from(applications)
        .where(eq(applications.userId, me.id))
    : [];
  const appliedSet = new Set(myApps.map((a) => a.opportunityId));

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar name={me?.name ?? email} avatarUrl={me?.avatarUrl} active="/protected" />

      <main className="mx-auto max-w-4xl px-4 py-6">
        <div className="mb-4">
          <h1 className="text-xl font-bold">Opportunities</h1>
          <p className="text-sm text-gray-500">
            {me?.occupation ? `${String(me.occupation).replace('_', ' ')} · ` : ''}
            {mySkills.length > 0 ? `skills: ${mySkills.join(', ')}` : 'add skills to your profile for matching'}
          </p>
        </div>
        <form method="get" className="mb-6 flex flex-wrap gap-2 rounded-xl border border-gray-200 bg-white p-3">
          <input
            name="q"
            defaultValue={searchParams.q ?? ''}
            placeholder="Search problems…"
            className="min-w-[160px] flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            name="campus"
            defaultValue={searchParams.campus ?? ''}
            placeholder="Campus"
            className="w-32 rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            name="skill"
            defaultValue={searchParams.skill ?? ''}
            placeholder="Skill"
            className="w-32 rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <select
            name="difficulty"
            defaultValue={fDifficulty}
            className="rounded-md border border-gray-300 px-2 py-2 text-sm"
          >
            <option value="">All levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          <label className="flex items-center gap-1 text-sm text-gray-600">
            <input type="checkbox" name="urgent" value="1" defaultChecked={urgentOnly} /> Urgent
          </label>
          {mySkills.length > 0 && (
            <label className="flex items-center gap-1 text-sm text-gray-600">
              <input type="checkbox" name="matched" value="1" defaultChecked={matchedOnly} /> Matched to me
            </label>
          )}
          <button className="rounded-md bg-sky-700 px-4 py-2 text-sm text-white hover:bg-sky-800" type="submit">
            Filter
          </button>
          <Link href="/protected" className="px-2 py-2 text-sm text-gray-500 underline">
            Reset
          </Link>
        </form>

        {scored.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
            No open opportunities match these filters.
          </p>
        ) : (
          <ul className="space-y-3">
            {scored.map((r) => {
              const applied = appliedSet.has(r.id);
              return (
                <li key={r.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      {r.orgId ? (
                        <Link href={`/organizations/${r.orgId}`}>
                          <OrgAvatar name={r.orgName} logoUrl={r.orgLogoUrl} />
                        </Link>
                      ) : (
                        <OrgAvatar name={r.orgName} logoUrl={r.orgLogoUrl} />
                      )}
                      <div>
                        <h2 className="font-semibold">{r.title}</h2>
                        <p className="text-sm text-gray-500">
                          {r.orgId ? (
                            <Link href={`/organizations/${r.orgId}`} className="underline">
                              {r.orgName}
                            </Link>
                          ) : (
                            r.orgName
                          )}{' '}
                          {r.orgVerified ? '✓ verified' : ''} · {r.campus ?? r.orgCampus ?? '—'} ·{' '}
                          {r.difficulty} · {r.effortHours ?? '?'}h · {formatDeadline(r.deadline)} ({deadlineLabel(r.deadline)})
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      {r.urgent && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">urgent</span>
                      )}
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${r.matchPct >= 50 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
                        title={r.reasons.join(' · ')}
                      >
                        {r.matchPct}% match
                      </span>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-gray-700">{r.description}</p>
                  <p className="mt-1 text-xs text-gray-500">Why: {r.reasons.join(' · ')}</p>
                  {r.oppSkills.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {r.oppSkills.map((s) => (
                        <span key={s} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                  <Slideshow images={r.images ?? []} title={r.title} />
                  <div className="mt-3">
                    {applied ? (
                      <Link href="/applications" className="text-sm font-medium text-green-700 underline">
                        Applied ✓ — manage
                      </Link>
                    ) : (
                      <form action={applyAction} className="flex gap-2">
                        <input type="hidden" name="opportunityId" value={r.id} />
                        <input
                          name="message"
                          placeholder="Short note (optional)"
                          className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                        />
                        <button className="rounded-md bg-sky-700 px-4 py-1.5 text-sm text-white hover:bg-sky-800" type="submit">
                          Apply
                        </button>
                      </form>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
