import { auth } from 'app/auth';
import { db, getUser } from 'app/db';
import { applications, certificates, users, volunteerLogs } from 'app/schema';
import OrgAvatar from 'app/components/org-avatar';
import { asExternalUrl } from 'app/urls';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import TopBar from 'app/components/top-bar';

export default async function VolunteerProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  const email = session?.user?.email ?? '';
  const rows = email ? await getUser(email) : [];
  if (!rows[0]) redirect('/login');

  const userId = Number(params.id);
  if (!userId) notFound();
  const userRows = await db.select().from(users).where(eq(users.id, userId));
  const v: any = userRows[0];
  if (!v) notFound();

  const logs = await db
    .select({ verified: volunteerLogs.verified, hours: volunteerLogs.hours })
    .from(volunteerLogs)
    .where(eq(volunteerLogs.userId, userId));
  const vHours = logs.filter((l) => l.verified).reduce((s, l) => s + l.hours, 0);
  const tasks = await db
    .select({ id: applications.id })
    .from(applications)
    .where(eq(applications.userId, userId));
  const certs = await db
    .select({ id: certificates.id })
    .from(certificates)
    .where(eq(certificates.userId, userId));

  const tags = (list: string[] | null, empty: string) =>
    (list ?? []).length > 0 ? (
      <div className="flex flex-wrap gap-1">
        {(list ?? []).map((s) => (
          <span key={s} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
            {s}
          </span>
        ))}
      </div>
    ) : (
      <p className="text-sm text-gray-400">{empty}</p>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar name={rows[0].name ?? ''} avatarUrl={rows[0].avatarUrl} active="/volunteers" />
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <div className="flex items-center gap-3">
            <OrgAvatar name={v.name ?? `Volunteer ${v.id}`} logoUrl={v.avatarUrl} size={56} />
            <div>
              <h1 className="text-xl font-bold">{v.name ?? `Volunteer #${v.id}`}</h1>
              <p className="text-sm text-gray-500">
                {v.occupation ? String(v.occupation).replace('_', ' ') : '—'}
                {' · '}
                {v.campus ?? v.university ?? '—'}
                {' · '}
                {v.city ?? '—'}
              </p>
              <p className="text-sm text-gray-500">
                {vHours}h verified · {tasks.length} applications · {certs.length} certificates
              </p>
              <Link href={`/volunteers/${v.id}/impact`} className="mt-1 inline-block rounded-md bg-sky-700 px-3 py-1.5 text-xs text-white hover:bg-sky-800">
                View impact →
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-4 px-4 py-6">
        {v.bio && (
          <section className="rounded-xl border border-gray-200 bg-white p-4">
            <h2 className="mb-1 text-sm font-bold uppercase text-gray-500">About</h2>
            <p className="text-sm text-gray-700">{v.bio}</p>
          </section>
        )}
        <section className="rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="mb-2 text-sm font-bold uppercase text-gray-500">Skills</h2>
          {tags(v.skills, 'No skills listed.')}
        </section>
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <h2 className="mb-2 text-sm font-bold uppercase text-gray-500">Languages</h2>
            {tags(v.languages, '—')}
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <h2 className="mb-2 text-sm font-bold uppercase text-gray-500">Interests</h2>
            {tags(v.interests, '—')}
          </div>
        </section>
        {(v.availability || v.portfolioUrl) && (
          <section className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-700">
            {v.availability && <p>Available: {v.availability}</p>}
            {asExternalUrl(v.portfolioUrl) && (
              <p>
                Portfolio:{' '}
                <a href={asExternalUrl(v.portfolioUrl)!} target="_blank" rel="noreferrer" className="underline">
                  {v.portfolioUrl}
                </a>
              </p>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
