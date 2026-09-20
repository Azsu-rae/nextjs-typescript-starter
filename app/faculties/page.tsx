import { auth, requireUser } from 'app/auth';
import { db } from 'app/db';
import { opportunities, organizations } from 'app/schema';
import OrgAvatar from 'app/components/org-avatar';
import TopBar from 'app/components/top-bar';
import { eq } from 'drizzle-orm';
import Link from 'next/link';

export default async function FacultiesPage() {
  const me: any = await requireUser();

  const orgs = await db.select().from(organizations).orderBy(organizations.name);
  const openOpps = await db
    .select({ orgId: opportunities.orgId })
    .from(opportunities)
    .where(eq(opportunities.status, 'open'));
  const openCount = new Map<number, number>();
  for (const o of openOpps) {
    if (o.orgId === null) continue;
    openCount.set(o.orgId, (openCount.get(o.orgId) ?? 0) + 1);
  }

  const groups = new Map<string, { label: string; orgs: typeof orgs }>();
  for (const o of orgs) {
    const raw = (o.campus ?? '').trim();
    const key = raw ? raw.toLowerCase() : 'independent';
    const g = groups.get(key) ?? { label: raw || 'Independent', orgs: [] };
    g.orgs.push(o);
    groups.set(key, g);
  }
  const sorted = Array.from(groups.values()).sort((a, b) => b.orgs.length - a.orgs.length);

  return (
    <div className="min-h-screen bg-[#f8f8f5]">
      <TopBar name={me.name ?? ''} avatarUrl={me.avatarUrl} active="/faculties" />

      <main className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="text-xl font-bold">Faculty chapters</h1>
        <p className="mb-4 text-sm text-gray-500">
          Every campus with an active organization, and what&apos;s open there.
        </p>
        <div className="space-y-4">
          {sorted.map((g) => (
            <section key={g.label} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-baseline justify-between">
                <h2 className="font-semibold">{g.label}</h2>
                <p className="text-sm text-gray-500">
                  {g.orgs.length} org{g.orgs.length === 1 ? '' : 's'} ·{' '}
                  {g.orgs.reduce((s, o) => s + (openCount.get(o.id) ?? 0), 0)} open
                </p>
              </div>
              <ul className="mt-3 space-y-2">
                {g.orgs.map((o) => (
                  <li key={o.id}>
                    <Link href={`/organizations/${o.id}`} className="flex items-center gap-3 rounded-lg p-1 hover:bg-gray-50">
                      <OrgAvatar name={o.name} logoUrl={o.logoUrl} size={32} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          {o.name} {o.verified ? '✓' : ''}
                        </p>
                        <p className="truncate text-xs text-gray-500">
                          {openCount.get(o.id) ?? 0} open
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
