import { auth, requireUser } from 'app/auth';
import { db, getUser } from 'app/db';
import { applications, opportunities, organizations, volunteerLogs } from 'app/schema';
import OrgAvatar from 'app/components/org-avatar';
import Slideshow from 'app/components/slideshow';
import { deadlineLabel, formatDeadline } from 'app/dates';
import { difficultyLabel } from 'app/labels';
import { and, desc, eq, inArray, sum } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import TopBar from 'app/components/top-bar';

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
  revalidatePath(`/organizations/${formData.get('orgId')}`);
}

export default async function OrgProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const me: any = await requireUser();

  const orgId = Number(params.id);
  if (!orgId) notFound();
  const orgRows = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, orgId));
  const org = orgRows[0];
  if (!org) notFound();

  const opps = await db
    .select()
    .from(opportunities)
    .where(
      and(
        eq(opportunities.orgId, orgId),
        eq(opportunities.status, 'open'),
      ),
    )
    .orderBy(desc(opportunities.createdAt));

  const oppIds = opps.map((o) => o.id);
  const hours = oppIds.length
    ? await db
        .select({ total: sum(volunteerLogs.hours) })
        .from(volunteerLogs)
        .where(inArray(volunteerLogs.opportunityId, oppIds))
    : [{ total: 0 }];
  const appCount = oppIds.length
    ? await db
        .select({ id: applications.id })
        .from(applications)
        .where(inArray(applications.opportunityId, oppIds))
    : [];

  const myApps = await db
    .select({ opportunityId: applications.opportunityId })
    .from(applications)
    .where(eq(applications.userId, me.id));
  const appliedSet = new Set(myApps.map((a) => a.opportunityId));

  return (
    <div className="min-h-screen bg-[#f8f8f5]">
      <TopBar name={me.name ?? ''} avatarUrl={me.avatarUrl} active="/organizations" />
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <Link href="/organizations" className="text-sm text-gray-600 underline">
              الجمعيات
            </Link>
            {org.ownerId === me.id && (
              <Link href={`/organizations/${org.id}/manage`} className="rounded-md bg-[#1E4D38] px-3 py-1.5 text-xs text-white hover:bg-[#163A2B]">
                إدارة
              </Link>
            )}
          </div>
          <div className="mt-3 flex items-center gap-3">
            <OrgAvatar name={org.name} logoUrl={org.logoUrl} size={56} />
            <div>
              <h1 className="text-xl font-bold">
                {org.name} {org.verified ? '✓' : ''}
              </h1>
              <p className="text-sm text-gray-500">
                {org.campus ?? '—'} · {opps.length} مفتوحة · {appCount.length} طلبات ·{' '}
                {Number((hours[0]?.total ?? 0) as any) || 0} سا مسجلة
              </p>
            </div>
          </div>
          {org.description && <p className="mt-3 text-sm text-gray-700">{org.description}</p>}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        <h2 className="mb-2 text-sm font-bold uppercase text-gray-500">
          الفرص المفتوحة ({opps.length})
        </h2>
        {opps.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
            لا توجد فرص مفتوحة حاليا.
          </p>
        ) : (
          <ul className="space-y-3">
            {opps.map((o) => {
              const applied = appliedSet.has(o.id);
              return (
                <li key={o.id} className="rounded-xl border border-gray-200 bg-white p-4">
                  <h3 className="font-semibold">{o.title}</h3>
                  <p className="text-sm text-gray-500">
                    {difficultyLabel(o.difficulty)} · {o.effortHours ?? '?'} سا · {formatDeadline(o.deadline)} ({deadlineLabel(o.deadline)})
                    {o.urgent ? ' · مستعجل' : ''}
                  </p>
                  <p className="mt-2 text-sm text-gray-700">{o.description}</p>
                  <Slideshow images={o.images ?? []} title={o.title} />
                  <div className="mt-3">
                    {applied ? (
                      <Link href="/applications" className="text-sm font-medium text-green-700 underline">
                        تم التقديم ✓ — إدارة
                      </Link>
                    ) : (
                      <form action={applyAction} className="flex gap-2">
                        <input type="hidden" name="opportunityId" value={o.id} />
                        <input type="hidden" name="orgId" value={org.id} />
                        <input
                          name="message"
                          placeholder="ملاحظة قصيرة (اختياري)"
                          className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                        />
                        <button className="rounded-md bg-[#1E4D38] px-4 py-1.5 text-sm text-white hover:bg-[#163A2B]" type="submit">
                          قدّم
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
