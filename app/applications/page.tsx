import { auth } from 'app/auth';
import { db, getUser } from 'app/db';
import { applications, opportunities, organizations } from 'app/schema';
import { deadlineLabel, formatDeadline } from 'app/dates';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import TopBar from 'app/components/top-bar';

async function cancelAction(formData: FormData) {
  'use server';
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return;
  const rows = await getUser(email);
  const me = rows[0];
  if (!me) return;
  const id = Number(formData.get('id'));
  if (!id) return;

  // Only pending/confirmed (accepted) can be cancelled by the owner
  await db
    .delete(applications)
    .where(
      and(
        eq(applications.id, id),
        eq(applications.userId, me.id),
        inArray(applications.status, ['pending', 'accepted']),
      ),
    );
  revalidatePath('/applications');
  revalidatePath('/schedule');
  revalidatePath('/protected');
}

export default async function ApplicationsPage() {
  const session = await auth();
  const email = session?.user?.email ?? '';
  const rows = email ? await getUser(email) : [];
  const me: any = rows[0];
  if (!me) redirect('/login');

  const apps = await db
    .select({
      id: applications.id,
      status: applications.status,
      message: applications.message,
      appliedAt: applications.createdAt,
      opportunityId: opportunities.id,
      title: opportunities.title,
      deadline: opportunities.deadline,
      campus: opportunities.campus,
      effortHours: opportunities.effortHours,
      orgName: organizations.name,
    })
    .from(applications)
    .innerJoin(opportunities, eq(applications.opportunityId, opportunities.id))
    .leftJoin(organizations, eq(opportunities.orgId, organizations.id))
    .where(eq(applications.userId, me.id))
    .orderBy(desc(applications.createdAt));

  const pending = apps.filter((a) => a.status === 'pending');
  const confirmed = apps.filter((a) => a.status === 'accepted');
  const other = apps.filter((a) => a.status !== 'pending' && a.status !== 'accepted');

  function Section({
    title,
    list,
    cancellable,
  }: {
    title: string;
    list: typeof apps;
    cancellable: boolean;
  }) {
    return (
      <section className="mb-8">
        <h2 className="mb-2 text-sm font-bold uppercase text-gray-500">
          {title} ({list.length})
        </h2>
        {list.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-500">
            None.
          </p>
        ) : (
          <ul className="space-y-2">
            {list.map((a) => (
              <li
                key={a.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-gray-200 bg-white p-3"
              >
                <div>
                  <p className="font-medium">{a.title}</p>
                  <p className="text-sm text-gray-500">
                    {a.orgName ?? '—'} · {a.campus ?? '—'} · {a.effortHours ?? '?'}h ·{' '}
                    {formatDeadline(a.deadline)} ({deadlineLabel(a.deadline)})
                  </p>
                  {a.message && <p className="mt-1 text-sm text-gray-600">“{a.message}”</p>}
                </div>
                {cancellable ? (
                  <form action={cancelAction}>
                    <input type="hidden" name="id" value={a.id} />
                    <button
                      className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-700"
                      type="submit"
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                    {a.status}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar name={me.name ?? email} avatarUrl={me.avatarUrl} active="/applications" />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="mb-4 text-xl font-bold">My applications</h1>
        <Section title="Confirmed" list={confirmed} cancellable />
        <Section title="Pending" list={pending} cancellable />
        <Section title="Other" list={other} cancellable={false} />
      </main>
    </div>
  );
}
