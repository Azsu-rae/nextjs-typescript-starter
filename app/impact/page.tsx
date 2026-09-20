import { auth, requireUser } from 'app/auth';
import { db, getUser } from 'app/db';
import { applications, certificates, opportunities, organizations, volunteerLogs } from 'app/schema';
import { and, desc, eq, inArray, sum } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import TopBar from 'app/components/top-bar';

async function logHoursAction(formData: FormData) {
  'use server';
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return;
  const rows = await getUser(email);
  const me = rows[0];
  if (!me) return;

  const opportunityId = Number(formData.get('opportunityId'));
  const hours = Number(formData.get('hours'));
  if (!opportunityId || !hours || hours < 1 || hours > 500) return;

  // Must have applied to the task to log hours against it
  const apps = await db
    .select({ id: applications.id })
    .from(applications)
    .where(
      and(
        eq(applications.opportunityId, opportunityId),
        eq(applications.userId, me.id),
      ),
    );
  if (apps.length === 0) return;

  await db.insert(volunteerLogs).values({
    userId: me.id,
    opportunityId,
    hours,
    note: ((formData.get('note') as string) || '').trim() || null,
  });
  revalidatePath('/impact');
}

export default async function ImpactPage() {
  const me: any = await requireUser();
  const email = me.email as string;

  const myApps = await db
    .select({
      opportunityId: opportunities.id,
      title: opportunities.title,
      status: applications.status,
    })
    .from(applications)
    .innerJoin(opportunities, eq(applications.opportunityId, opportunities.id))
    .where(eq(applications.userId, me.id));

  const totals = await db
    .select({ verified: volunteerLogs.verified, total: sum(volunteerLogs.hours) })
    .from(volunteerLogs)
    .where(eq(volunteerLogs.userId, me.id))
    .groupBy(volunteerLogs.verified);
  const verifiedHours = Number(totals.find((t) => t.verified)?.total ?? 0);
  const pendingHours = Number(totals.find((t) => !t.verified)?.total ?? 0);

  const oppIds = myApps.map((a) => a.opportunityId);
  const logs = oppIds.length
    ? await db
        .select({
          id: volunteerLogs.id,
          hours: volunteerLogs.hours,
          verified: volunteerLogs.verified,
          note: volunteerLogs.note,
          createdAt: volunteerLogs.createdAt,
          title: opportunities.title,
          orgName: organizations.name,
        })
        .from(volunteerLogs)
        .innerJoin(opportunities, eq(volunteerLogs.opportunityId, opportunities.id))
        .leftJoin(organizations, eq(opportunities.orgId, organizations.id))
        .where(
          and(
            eq(volunteerLogs.userId, me.id),
            inArray(volunteerLogs.opportunityId, oppIds),
          ),
        )
        .orderBy(desc(volunteerLogs.createdAt))
    : [];

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
    .where(eq(certificates.userId, me.id))
    .orderBy(desc(certificates.issuedAt));

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar name={me.name ?? email} avatarUrl={me.avatarUrl} active="/impact" />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <div className="mb-4">
          <h1 className="text-xl font-bold">My impact</h1>
          <p className="text-sm text-gray-500">
            {verifiedHours}h verified · {pendingHours}h pending review
          </p>
        </div>
        <form action={logHoursAction} className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="mb-2 font-semibold">Log hours</h2>
          {myApps.length === 0 ? (
            <p className="text-sm text-gray-500">
              Apply to a task from the <Link href="/protected" className="underline">feed</Link> first.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              <select
                name="opportunityId"
                required
                className="min-w-[180px] flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                {myApps.map((a) => (
                  <option key={a.opportunityId} value={a.opportunityId}>
                    {a.title} ({a.status})
                  </option>
                ))}
              </select>
              <input
                name="hours"
                type="number"
                min={1}
                max={500}
                required
                placeholder="Hours"
                className="w-24 rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
              <input
                name="note"
                placeholder="What did you do? (optional)"
                className="min-w-[160px] flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
              <button className="rounded-md bg-sky-700 px-4 py-2 text-sm text-white hover:bg-sky-800" type="submit">
                Log
              </button>
            </div>
          )}
          <p className="mt-2 text-xs text-gray-500">
            Logs start as pending — the organization verifies them, then they count toward certificates.
          </p>
        </form>

        <h2 className="mb-2 mt-8 text-sm font-bold uppercase text-gray-500">
          Certificates ({certs.length})
        </h2>
        {certs.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-500">
            No certificates yet — they are issued automatically when an organization verifies your hours.
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
                  <p className="mt-1 font-mono text-xs text-gray-500">{c.certUid}</p>
                </div>
                <Link
                  href={`/c/${c.certUid}`}
                  className="shrink-0 rounded-md bg-sky-700 px-3 py-1.5 text-xs text-white hover:bg-sky-800"
                >
                  View / share
                </Link>
              </li>
            ))}
          </ul>
        )}

        <h2 className="mb-2 mt-8 text-sm font-bold uppercase text-gray-500">
          History ({logs.length})
        </h2>
        {logs.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
            No hours logged yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {logs.map((l) => (
              <li key={l.id} className="flex items-start justify-between gap-3 rounded-xl border border-gray-200 bg-white p-3">
                <div>
                  <p className="font-medium">{l.title}</p>
                  <p className="text-sm text-gray-500">
                    {l.orgName ?? '—'} · {l.hours}h ·{' '}
                    {l.createdAt ? new Date(l.createdAt).toLocaleDateString() : ''}
                  </p>
                  {l.note && <p className="mt-1 text-sm text-gray-600">“{l.note}”</p>}
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${l.verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}
                >
                  {l.verified ? 'verified ✓' : 'pending'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
