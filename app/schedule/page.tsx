import { auth, requireUser } from 'app/auth';
import { db, getUser } from 'app/db';
import { applications, opportunities, organizations } from 'app/schema';
import { deadlineLabel, formatDeadline } from 'app/dates';
import { asc, eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import TopBar from 'app/components/top-bar';

export default async function SchedulePage() {
  const me: any = await requireUser();
  const email = me.email as string;

  const confirmed = await db
    .select({
      id: applications.id,
      status: applications.status,
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
    .orderBy(asc(opportunities.deadline));

  const upcoming = confirmed.filter((a) => a.status === 'accepted');
  const withDeadline = upcoming.filter((a) => a.deadline);
  const withoutDeadline = upcoming.filter((a) => !a.deadline);

  return (
    <div className="min-h-screen bg-[#f8f8f5]">
      <TopBar name={me.name ?? email} avatarUrl={me.avatarUrl} active="/schedule" />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <div className="mb-4">
          <h1 className="text-xl font-bold">جدولي</h1>
          <p className="text-sm text-gray-500">{upcoming.length} مؤكدة</p>
        </div>
        {upcoming.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
            لا شيء مؤكد بعد. قدّم من{' '}
            <Link href="/protected" className="underline">الفرص</Link>، وستظهر
            المهام المؤكدة هنا مرتبة حسب الأجل.
          </p>
        ) : (
          <>
            <ul className="space-y-2">
              {withDeadline.map((a) => (
                <li
                  key={a.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-gray-200 bg-white p-3"
                >
                  <div>
                    <p className="font-medium">{a.title}</p>
                    <p className="text-sm text-gray-500">
                      {a.orgName ?? '—'} · {a.campus ?? '—'} · {a.effortHours ?? '?'} سا
                    </p>
                  </div>
                  <div className="shrink-0 text-left">
                    <p className="text-sm font-medium">{formatDeadline(a.deadline)}</p>
                    <p className="text-xs text-gray-500">{deadlineLabel(a.deadline)}</p>
                  </div>
                </li>
              ))}
            </ul>
            {withoutDeadline.length > 0 && (
              <>
                <h2 className="mb-2 mt-6 text-sm font-bold uppercase text-gray-500">
                  بدون أجل ({withoutDeadline.length})
                </h2>
                <ul className="space-y-2">
                  {withoutDeadline.map((a) => (
                    <li key={a.id} className="rounded-xl border border-gray-200 bg-white p-3">
                      <p className="font-medium">{a.title}</p>
                      <p className="text-sm text-gray-500">
                        {a.orgName ?? '—'} · {a.campus ?? '—'}
                      </p>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
