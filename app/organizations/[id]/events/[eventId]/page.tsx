import { auth, requireUser } from 'app/auth';
import { db, getUser } from 'app/db';
import { applications, certificates, opportunities, organizations, users, volunteerLogs } from 'app/schema';
import { deadlineLabel, formatDeadline } from 'app/dates';
import { and, desc, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import TopBar from 'app/components/top-bar';
import { randomUUID } from 'crypto';

const PATH = (orgId: number, eventId: number) => `/organizations/${orgId}/events/${eventId}`;

async function setAppStatus(formData: FormData) {
  'use server';
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return;
  const rows = await getUser(email);
  const me = rows[0];
  if (!me) return;
  const orgId = Number(formData.get('orgId'));
  const eventId = Number(formData.get('eventId'));
  const appId = Number(formData.get('appId'));
  const status = formData.get('status') as string;
  if (!['accepted', 'rejected'].includes(status)) return;

  const org = (await db.select().from(organizations).where(eq(organizations.id, orgId)))[0];
  if (!org || org.ownerId !== me.id) return;
  const opp = (await db.select().from(opportunities).where(eq(opportunities.id, eventId)))[0];
  if (!opp || opp.orgId !== orgId) return;

  await db
    .update(applications)
    .set({ status: status as any })
    .where(and(eq(applications.id, appId), eq(applications.opportunityId, eventId)));
  revalidatePath(PATH(orgId, eventId));
  revalidatePath('/applications');
}

async function verifyLogAction(formData: FormData) {
  'use server';
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return;
  const rows = await getUser(email);
  const me = rows[0];
  if (!me) return;
  const orgId = Number(formData.get('orgId'));
  const eventId = Number(formData.get('eventId'));
  const logId = Number(formData.get('logId'));
  if (!logId) return;

  const org = (await db.select().from(organizations).where(eq(organizations.id, orgId)))[0];
  if (!org || org.ownerId !== me.id) return;
  const opp = (await db.select().from(opportunities).where(eq(opportunities.id, eventId)))[0];
  if (!opp || opp.orgId !== orgId) return;

  const logs = await db
    .select()
    .from(volunteerLogs)
    .where(and(eq(volunteerLogs.id, logId), eq(volunteerLogs.opportunityId, eventId)));
  const log = logs[0];
  if (!log || log.verified) return;

  await db
    .update(volunteerLogs)
    .set({ verified: true, verifiedBy: me.id })
    .where(eq(volunteerLogs.id, logId));

  const existing = await db
    .select({ id: certificates.id })
    .from(certificates)
    .where(eq(certificates.logId, logId));
  if (existing.length === 0) {
    await db.insert(certificates).values({
      userId: log.userId,
      opportunityId: eventId,
      logId,
      certUid: randomUUID(),
    });
  }
  revalidatePath(PATH(orgId, eventId));
  revalidatePath('/impact');
}

async function declineLogAction(formData: FormData) {
  'use server';
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return;
  const rows = await getUser(email);
  const me = rows[0];
  if (!me) return;
  const orgId = Number(formData.get('orgId'));
  const eventId = Number(formData.get('eventId'));
  const logId = Number(formData.get('logId'));
  if (!logId) return;

  const org = (await db.select().from(organizations).where(eq(organizations.id, orgId)))[0];
  if (!org || org.ownerId !== me.id) return;
  const opp = (await db.select().from(opportunities).where(eq(opportunities.id, eventId)))[0];
  if (!opp || opp.orgId !== orgId) return;

  await db
    .delete(volunteerLogs)
    .where(
      and(
        eq(volunteerLogs.id, logId),
        eq(volunteerLogs.verified, false),
        eq(volunteerLogs.opportunityId, eventId),
      ),
    );
  revalidatePath(PATH(orgId, eventId));
  revalidatePath('/impact');
}

async function setEventStatus(formData: FormData) {
  'use server';
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return;
  const rows = await getUser(email);
  const me = rows[0];
  if (!me) return;
  const orgId = Number(formData.get('orgId'));
  const eventId = Number(formData.get('eventId'));
  const status = formData.get('status') as string;
  if (!['open', 'closed'].includes(status)) return;

  const org = (await db.select().from(organizations).where(eq(organizations.id, orgId)))[0];
  if (!org || org.ownerId !== me.id) return;
  await db
    .update(opportunities)
    .set({ status: status as any })
    .where(and(eq(opportunities.id, eventId), eq(opportunities.orgId, orgId)));
  revalidatePath(PATH(orgId, eventId));
  revalidatePath('/protected');
}

export default async function EventManagePage({
  params,
}: {
  params: { id: string; eventId: string };
}) {
  const me: any = await requireUser();

  const orgId = Number(params.id);
  const eventId = Number(params.eventId);
  const orgRows = await db.select().from(organizations).where(eq(organizations.id, orgId));
  const org = orgRows[0];
  if (!org) notFound();
  if (org.ownerId !== me.id) redirect(`/organizations/${orgId}`);

  const oppRows = await db.select().from(opportunities).where(eq(opportunities.id, eventId));
  const event = oppRows[0];
  if (!event || event.orgId !== orgId) notFound();

  const apps = await db
    .select({
      id: applications.id,
      status: applications.status,
      message: applications.message,
      userId: applications.userId,
      name: users.name,
      email: users.email,
      occupation: users.occupation,
      skills: users.skills,
    })
    .from(applications)
    .innerJoin(users, eq(applications.userId, users.id))
    .where(eq(applications.opportunityId, eventId))
    .orderBy(desc(applications.createdAt));

  const logs = await db
    .select({
      id: volunteerLogs.id,
      hours: volunteerLogs.hours,
      verified: volunteerLogs.verified,
      note: volunteerLogs.note,
      createdAt: volunteerLogs.createdAt,
      userId: volunteerLogs.userId,
      name: users.name,
      email: users.email,
    })
    .from(volunteerLogs)
    .innerJoin(users, eq(volunteerLogs.userId, users.id))
    .where(eq(volunteerLogs.opportunityId, eventId))
    .orderBy(desc(volunteerLogs.createdAt));

  const pendingLogs = logs.filter((l) => !l.verified);
  const verifiedLogs = logs.filter((l) => l.verified);
  const pendingApps = apps.filter((a) => a.status === 'pending');

  return (
    <div className="min-h-screen bg-[#f8f8f5]">
      <TopBar name={me.name ?? ''} avatarUrl={me.avatarUrl} active="/organizations" />
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <Link href={`/organizations/${orgId}/manage`} className="text-sm text-gray-600 underline">
            ← Manage {org.name}
          </Link>
          <h1 className="mt-1 text-xl font-bold">{event.title}</h1>
          <p className="text-sm text-gray-500">
            {event.status} · {event.difficulty} · {event.effortHours ?? '?'}h ·{' '}
            {formatDeadline(event.deadline)} ({deadlineLabel(event.deadline)})
          </p>
          <form action={setEventStatus} className="mt-2">
            <input type="hidden" name="orgId" value={orgId} />
            <input type="hidden" name="eventId" value={eventId} />
            <input type="hidden" name="status" value={event.status === 'open' ? 'closed' : 'open'} />
            <button className="rounded-md border border-gray-300 px-3 py-1 text-xs" type="submit">
              {event.status === 'open' ? 'Close event' : 'Reopen event'}
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-8 px-4 py-6">
        <section className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-700">{event.description}</p>
          {(event.skills ?? []).length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {(event.skills ?? []).map((s) => (
                <span key={s} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                  {s}
                </span>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-2 text-sm font-bold uppercase text-gray-500">
            Candidates ({apps.length}{pendingApps.length ? `, ${pendingApps.length} pending` : ''})
          </h2>
          {apps.length === 0 ? (
            <p className="rounded-xl border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-500">
              No applicants yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {apps.map((a) => (
                <li key={a.id} className="flex items-start justify-between gap-2 rounded-xl border border-gray-200 bg-white p-3">
                  <div className="text-sm">
                    <p className="font-medium">
                      <Link href={`/volunteers/${a.userId}`} className="underline">
                        {a.name ?? a.email}
                      </Link>{' '}
                      · {a.occupation ?? '—'}
                    </p>
                    <p className="text-gray-500">{(a.skills ?? []).join(', ') || 'no skills listed'}</p>
                    {a.message && <p className="text-gray-600">“{a.message}”</p>}
                    <p className="text-xs text-gray-500">status: {a.status}</p>
                  </div>
                  {a.status === 'pending' && (
                    <div className="flex shrink-0 gap-1">
                      <form action={setAppStatus}>
                        <input type="hidden" name="orgId" value={orgId} />
                        <input type="hidden" name="eventId" value={eventId} />
                        <input type="hidden" name="appId" value={a.id} />
                        <input type="hidden" name="status" value="accepted" />
                        <button className="rounded-md bg-[#1E4D38] px-3 py-1 text-xs text-white hover:bg-[#163A2B]" type="submit">
                          Accept
                        </button>
                      </form>
                      <form action={setAppStatus}>
                        <input type="hidden" name="orgId" value={orgId} />
                        <input type="hidden" name="eventId" value={eventId} />
                        <input type="hidden" name="appId" value={a.id} />
                        <input type="hidden" name="status" value="rejected" />
                        <button className="rounded-md border border-gray-300 px-3 py-1 text-xs" type="submit">
                          Reject
                        </button>
                      </form>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-2 text-sm font-bold uppercase text-gray-500">
            Hours to verify ({pendingLogs.length})
          </h2>
          {pendingLogs.length === 0 ? (
            <p className="rounded-xl border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-500">
              Nothing pending. Verifying mints a certificate automatically.
            </p>
          ) : (
            <ul className="space-y-2">
              {pendingLogs.map((l) => (
                <li key={l.id} className="flex items-start justify-between gap-2 rounded-xl border border-gray-200 bg-white p-3">
                  <div className="text-sm">
                    <p className="font-medium">
                      <Link href={`/volunteers/${l.userId}`} className="underline">
                        {l.name ?? l.email}
                      </Link>{' '}
                      · {l.hours}h
                    </p>
                    {l.note && <p className="text-gray-600">“{l.note}”</p>}
                    <p className="text-xs text-gray-500">
                      {l.createdAt ? new Date(l.createdAt).toLocaleDateString() : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <form action={verifyLogAction}>
                      <input type="hidden" name="orgId" value={orgId} />
                      <input type="hidden" name="eventId" value={eventId} />
                      <input type="hidden" name="logId" value={l.id} />
                      <button className="rounded-md bg-[#1E4D38] px-3 py-1 text-xs text-white hover:bg-[#163A2B]" type="submit">
                        Verify + certify
                      </button>
                    </form>
                    <form action={declineLogAction}>
                      <input type="hidden" name="orgId" value={orgId} />
                      <input type="hidden" name="eventId" value={eventId} />
                      <input type="hidden" name="logId" value={l.id} />
                      <button className="rounded-md border border-gray-300 px-3 py-1 text-xs" type="submit">
                        Decline
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {verifiedLogs.length > 0 && (
          <section>
            <h2 className="mb-2 text-sm font-bold uppercase text-gray-500">
              Verified ({verifiedLogs.length})
            </h2>
            <ul className="space-y-2">
              {verifiedLogs.map((l) => (
                <li key={l.id} className="rounded-xl border border-gray-200 bg-white p-3 text-sm">
                  <p className="font-medium">
                    <Link href={`/volunteers/${l.userId}`} className="underline">
                      {l.name ?? l.email}
                    </Link>{' '}
                    · {l.hours}h <span className="text-green-700">✓</span>
                  </p>
                  {l.note && <p className="text-gray-600">“{l.note}”</p>}
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
