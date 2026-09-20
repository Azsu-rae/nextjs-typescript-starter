import { auth, requireUser } from 'app/auth';
import { db, getUser } from 'app/db';
import { opportunities, organizations } from 'app/schema';
import OrgAvatar from 'app/components/org-avatar';
import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import TopBar from 'app/components/top-bar';

type Search = {
  q?: string;
  campus?: string;
  verified?: string;
};

async function createOrgAction(formData: FormData) {
  'use server';
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return;
  const rows = await getUser(email);
  const me = rows[0];
  if (!me) return;

  const name = ((formData.get('name') as string) || '').trim();
  if (!name) return;
  const inserted = await db
    .insert(organizations)
    .values({
      name,
      description: ((formData.get('description') as string) || '').trim() || null,
      campus: ((formData.get('campus') as string) || '').trim() || null,
      logoUrl: ((formData.get('logoUrl') as string) || '').trim() || null,
      ownerId: me.id,
    })
    .returning({ id: organizations.id });
  revalidatePath('/organizations');
  redirect(`/organizations/${inserted[0].id}/manage`);
}

export default async function OrganizationsPage({
  searchParams,
}: {
  searchParams: Search;
}) {
  const me: any = await requireUser();

  const orgs = await db.select().from(organizations).orderBy(organizations.name);
  const openOpps = await db
    .select({ orgId: opportunities.orgId })
    .from(opportunities)
    .where(and(eq(opportunities.status, 'open')));
  const openCount = new Map<number, number>();
  for (const o of openOpps) {
    if (o.orgId === null) continue;
    openCount.set(o.orgId, (openCount.get(o.orgId) ?? 0) + 1);
  }

  const q = (searchParams.q ?? '').toLowerCase().trim();
  const fCampus = (searchParams.campus ?? '').toLowerCase().trim();
  const verifiedOnly = searchParams.verified === '1';

  const filtered = orgs.filter((o) => {
    if (q && !(`${o.name} ${o.description ?? ''}`.toLowerCase().includes(q))) return false;
    if (fCampus && !(o.campus ?? '').toLowerCase().includes(fCampus)) return false;
    if (verifiedOnly && !o.verified) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#f8f8f5]">
      <TopBar name={me.name ?? ''} avatarUrl={me.avatarUrl} active="/organizations" />

      <main className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="mb-4 text-xl font-bold">Organizations</h1>
        <form method="get" className="mb-6 flex flex-wrap gap-2 rounded-xl border border-gray-200 bg-white p-3">
          <input
            name="q"
            defaultValue={searchParams.q ?? ''}
            placeholder="Search name or mission…"
            className="min-w-[160px] flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            name="campus"
            defaultValue={searchParams.campus ?? ''}
            placeholder="Campus"
            className="w-32 rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <label className="flex items-center gap-1 text-sm text-gray-600">
            <input type="checkbox" name="verified" value="1" defaultChecked={verifiedOnly} /> Verified only
          </label>
          <button className="rounded-md bg-[#1E4D38] px-4 py-2 text-sm text-white hover:bg-[#163A2B]" type="submit">
            Search
          </button>
          <Link href="/organizations" className="px-2 py-2 text-sm text-gray-500 underline">
            Reset
          </Link>
        </form>

        {filtered.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
            No organizations match.
          </p>
        ) : (
          <ul className="space-y-2">
            {filtered.map((o) => (
              <li key={o.id} className="rounded-xl border border-gray-200 bg-white p-3">
                <div className="flex items-center justify-between gap-3">
                  <Link href={`/organizations/${o.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                    <OrgAvatar name={o.name} logoUrl={o.logoUrl} />
                    <div className="min-w-0">
                      <p className="font-medium">
                        {o.name} {o.verified ? '✓ verified' : ''}
                      </p>
                      <p className="truncate text-sm text-gray-500">
                        {o.campus ?? '—'} · {openCount.get(o.id) ?? 0} open
                      </p>
                      {o.description && (
                        <p className="mt-1 truncate text-sm text-gray-600">{o.description}</p>
                      )}
                    </div>
                  </Link>
                  {o.ownerId === me.id && (
                    <Link
                      href={`/organizations/${o.id}/manage`}
                      className="shrink-0 rounded-md bg-[#1E4D38] px-3 py-1.5 text-xs text-white hover:bg-[#163A2B]"
                    >
                      Manage
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        <form action={createOrgAction} className="mt-8 space-y-3 rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="font-semibold">Start an organization</h2>
          <p className="text-sm text-gray-500">
            You become the owner — post events, accept candidates, verify hours.
          </p>
          <input
            name="name"
            required
            placeholder="Name — e.g. Bab Ezzouar Tutoring Collective"
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <textarea
            name="description"
            placeholder="Mission…"
            rows={2}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <div className="flex flex-wrap gap-2">
            <input
              name="campus"
              placeholder="Campus"
              className="w-36 rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
            <input
              name="logoUrl"
              placeholder="Logo URL (optional)"
              className="min-w-[180px] flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
            <button className="rounded-md bg-[#1E4D38] px-4 py-2 text-sm text-white hover:bg-[#163A2B]" type="submit">
              Create
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
