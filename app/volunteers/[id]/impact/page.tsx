import { auth } from 'app/auth';
import { db, getUser } from 'app/db';
import { certificates, opportunities, organizations, users, volunteerLogs } from 'app/schema';
import OrgAvatar from 'app/components/org-avatar';
import TopBar from 'app/components/top-bar';
import { and, desc, eq, sum } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export default async function VolunteerImpactPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  const email = session?.user?.email ?? '';
  const rows = email ? await getUser(email) : [];
  if (!rows[0]) redirect('/login');
  const me: any = rows[0];

  const userId = Number(params.id);
  if (!userId) notFound();
  const userRows = await db.select().from(users).where(eq(users.id, userId));
  const v: any = userRows[0];
  if (!v) notFound();

  const totals = await db
    .select({ total: sum(volunteerLogs.hours) })
    .from(volunteerLogs)
    .where(and(eq(volunteerLogs.userId, userId), eq(volunteerLogs.verified, true)));

  const logs = await db
    .select({
      hours: volunteerLogs.hours,
      note: volunteerLogs.note,
      createdAt: volunteerLogs.createdAt,
      title: opportunities.title,
      orgName: organizations.name,
    })
    .from(volunteerLogs)
    .innerJoin(opportunities, eq(volunteerLogs.opportunityId, opportunities.id))
    .leftJoin(organizations, eq(opportunities.orgId, organizations.id))
    .where(and(eq(volunteerLogs.userId, userId), eq(volunteerLogs.verified, true)))
    .orderBy(desc(volunteerLogs.createdAt));

  const certs = await db
    .select({
      certUid: certificates.certUid,
      issuedAt: certificates.issuedAt,
      hours: volunteerLogs.hours,
      title: opportunities.title,
      orgName: organizations.name,
    })
    .from(certificates)
    .innerJoin(opportunities, eq(certificates.opportunityId, opportunities.id))
    .leftJoin(organizations, eq(opportunities.orgId, organizations.id))
    .leftJoin(volunteerLogs, eq(certificates.logId, volunteerLogs.id))
    .where(eq(certificates.userId, userId))
    .orderBy(desc(certificates.issuedAt));

  const verifiedHours = Number(totals[0]?.total ?? 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar name={me.name ?? ''} avatarUrl={me.avatarUrl} active="/volunteers" />

      <main className="mx-auto max-w-3xl px-4 py-6">
        <Link href={`/volunteers/${userId}`} className="text-sm text-gray-600 underline">
          ← {v.name ?? `Volunteer #${v.id}`}
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <OrgAvatar name={v.name ?? `Volunteer ${v.id}`} logoUrl={v.avatarUrl} size={48} />
          <div>
            <h1 className="text-xl font-bold">Impact</h1>
            <p className="text-sm text-gray-500">
              {verifiedHours}h verified · {certs.length} certificates
            </p>
          </div>
        </div>

        <h2 className="mb-2 mt-6 text-sm font-bold uppercase text-gray-500">
          Certificates ({certs.length})
        </h2>
        {certs.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-500">
            No certificates yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {certs.map((c) => (
              <li key={c.certUid} className="flex items-start justify-between gap-3 rounded-xl border border-gray-200 bg-white p-3">
                <div>
                  <p className="font-medium">{c.title}</p>
                  <p className="text-sm text-gray-500">
                    {c.orgName ?? '—'} · {c.hours ?? '?'}h · issued{' '}
                    {c.issuedAt ? new Date(c.issuedAt).toLocaleDateString() : ''}
                  </p>
                </div>
                <Link
                  href={`/c/${c.certUid}`}
                  className="shrink-0 rounded-md bg-sky-700 px-3 py-1.5 text-xs text-white hover:bg-sky-800"
                >
                  Verify
                </Link>
              </li>
            ))}
          </ul>
        )}

        <h2 className="mb-2 mt-6 text-sm font-bold uppercase text-gray-500">
          Verified history ({logs.length})
        </h2>
        {logs.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-500">
            No verified hours yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {logs.map((l, idx) => (
              <li key={idx} className="rounded-xl border border-gray-200 bg-white p-3">
                <p className="font-medium">{l.title}</p>
                <p className="text-sm text-gray-500">
                  {l.orgName ?? '—'} · {l.hours}h ·{' '}
                  {l.createdAt ? new Date(l.createdAt).toLocaleDateString() : ''} · verified ✓
                </p>
                {l.note && <p className="mt-1 text-sm text-gray-600">“{l.note}”</p>}
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
