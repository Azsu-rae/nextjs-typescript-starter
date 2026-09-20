import { auth, requireUser } from 'app/auth';
import { db, getUser } from 'app/db';
import { applications, opportunities, organizations, volunteerLogs } from 'app/schema';
import { parseCommaList } from 'app/match';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { opportunityStatusLabel } from 'app/labels';
import { revalidatePath } from 'next/cache';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import AvatarInput from 'app/components/avatar-input';
import TopBar from 'app/components/top-bar';

async function postEventAction(formData: FormData) {
  'use server';
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return;
  const rows = await getUser(email);
  const me = rows[0];
  if (!me) return;
  const orgId = Number(formData.get('orgId'));
  const org = (await db.select().from(organizations).where(eq(organizations.id, orgId)))[0];
  if (!org || org.ownerId !== me.id) return;

  const title = ((formData.get('title') as string) || '').trim();
  const description = ((formData.get('description') as string) || '').trim();
  if (!title || !description) return;
  const deadlineRaw = (formData.get('deadline') as string) || '';

  await db.insert(opportunities).values({
    orgId,
    title,
    description,
    skills: parseCommaList(formData.get('skills')),
    effortHours: Number(formData.get('effortHours')) || null,
    difficulty: (['beginner', 'intermediate', 'advanced'] as const).includes(
      formData.get('difficulty') as any,
    )
      ? ((formData.get('difficulty') as string) as any)
      : 'beginner',
    campus: ((formData.get('campus') as string) || '').trim() || null,
    urgent: formData.get('urgent') === '1',
    deadline: deadlineRaw ? new Date(deadlineRaw) : null,
  });
  revalidatePath(`/organizations/${orgId}/manage`);
  revalidatePath('/protected');
}

async function updateOrgAction(formData: FormData) {
  'use server';
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return;
  const rows = await getUser(email);
  const me = rows[0];
  if (!me) return;
  const orgId = Number(formData.get('orgId'));
  const org = (await db.select().from(organizations).where(eq(organizations.id, orgId)))[0];
  if (!org || org.ownerId !== me.id) return;

  const logoUrl = ((formData.get('logoUrl') as string) || '').trim();
  if (logoUrl && (logoUrl.length > 400_000 || !logoUrl.startsWith('data:image/'))) return;
  await db
    .update(organizations)
    .set({
      description: ((formData.get('description') as string) || '').trim() || null,
      campus: ((formData.get('campus') as string) || '').trim() || null,
      logoUrl: logoUrl || null,
    })
    .where(eq(organizations.id, orgId));
  revalidatePath(`/organizations/${orgId}/manage`);
  revalidatePath(`/organizations/${orgId}`);
}

export default async function OrgManagePage({
  params,
}: {
  params: { id: string };
}) {
  const me: any = await requireUser();

  const orgId = Number(params.id);
  const orgRows = await db.select().from(organizations).where(eq(organizations.id, orgId));
  const org = orgRows[0];
  if (!org) notFound();
  if (org.ownerId !== me.id) redirect(`/organizations/${orgId}`);

  const opps = await db
    .select()
    .from(opportunities)
    .where(eq(opportunities.orgId, orgId))
    .orderBy(desc(opportunities.createdAt));
  const oppIds = opps.map((o) => o.id);

  const appStats = oppIds.length
    ? await db
        .select({
          opportunityId: applications.opportunityId,
          status: applications.status,
        })
        .from(applications)
        .where(inArray(applications.opportunityId, oppIds))
    : [];
  const pendingLogStats = oppIds.length
    ? await db
        .select({ opportunityId: volunteerLogs.opportunityId })
        .from(volunteerLogs)
        .where(
          and(
            eq(volunteerLogs.verified, false),
            inArray(volunteerLogs.opportunityId, oppIds),
          ),
        )
    : [];
  const statByOpp = new Map<number, { apps: number; pendingApps: number; pendingLogs: number }>();
  for (const o of opps) statByOpp.set(o.id, { apps: 0, pendingApps: 0, pendingLogs: 0 });
  for (const a of appStats) {
    const s = statByOpp.get(a.opportunityId);
    if (!s) continue;
    s.apps += 1;
    if (a.status === 'pending') s.pendingApps += 1;
  }
  for (const l of pendingLogStats) {
    if (l.opportunityId === null) continue;
    const s = statByOpp.get(l.opportunityId);
    if (s) s.pendingLogs += 1;
  }

  return (
    <div className="min-h-screen bg-[#f8f8f5]">
      <TopBar name={me.name ?? ''} avatarUrl={me.avatarUrl} active="/organizations" />

      <main className="mx-auto max-w-3xl space-y-8 px-4 py-6">
        <div>
          <h1 className="text-xl font-bold">إدارة {org.name}</h1>
          <Link href={`/organizations/${orgId}`} className="text-sm text-gray-600 underline">
            العرض العام
          </Link>
        </div>
        <form action={updateOrgAction} className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="font-semibold">ملف الجمعية</h2>
          <input type="hidden" name="orgId" value={orgId} />
          <AvatarInput name="logoUrl" defaultValue={org.logoUrl} label="الشعار" />
          <textarea
            name="description"
            placeholder="الرسالة…"
            rows={2}
            defaultValue={org.description ?? ''}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <div className="flex flex-wrap items-center gap-2">
            <input
              name="campus"
              placeholder="الحرم"
              defaultValue={org.campus ?? ''}
              className="w-36 rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
            <button className="rounded-md bg-[#1E4D38] px-4 py-2 text-sm text-white hover:bg-[#163A2B]" type="submit">
              حفظ الملف
            </button>
          </div>
        </form>

        <form action={postEventAction} className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="font-semibold">انشر فعالية</h2>
          <input type="hidden" name="orgId" value={orgId} />
          <input name="title" required placeholder="العنوان — مثال: نحتاج مترجما لنهاية الأسبوع" className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
          <textarea name="description" required placeholder="صف المشكلة…" rows={3} className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <input name="skills" placeholder="المهارات (بفواصل)" className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
            <input name="effortHours" type="number" min={1} placeholder="الساعات" className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
            <select name="difficulty" className="rounded-md border border-gray-300 px-2 py-2 text-sm">
              <option value="beginner">مبتدئ</option>
              <option value="intermediate">متوسط</option>
              <option value="advanced">متقدم</option>
            </select>
            <input name="deadline" type="date" className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input name="campus" placeholder="الحرم" defaultValue={org.campus ?? ''} className="w-36 rounded-md border border-gray-300 px-3 py-2 text-sm" />
            <label className="flex items-center gap-1 text-sm text-gray-600">
              <input type="checkbox" name="urgent" value="1" /> مستعجل
            </label>
            <button className="rounded-md bg-[#1E4D38] px-4 py-2 text-sm text-white hover:bg-[#163A2B]" type="submit">
              نشر
            </button>
          </div>
        </form>

        <section>
          <h2 className="mb-2 text-sm font-bold uppercase text-gray-500">
            الفعاليات ({opps.length})
          </h2>
          {opps.length === 0 ? (
            <p className="rounded-xl border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-500">
              انشر فعاليتك الأولى أعلاه.
            </p>
          ) : (
            <ul className="space-y-2">
              {opps.map((o) => {
                const s = statByOpp.get(o.id) ?? { apps: 0, pendingApps: 0, pendingLogs: 0 };
                return (
                  <li key={o.id} className="rounded-xl border border-gray-200 bg-white p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{o.title}</p>
                        <p className="text-sm text-gray-500">
                          {opportunityStatusLabel(o.status)} · {s.apps} متقدمين
                          {s.pendingApps > 0 && ` (${s.pendingApps} قيد الانتظار)`} ·{' '}
                          {s.pendingLogs > 0 ? `${s.pendingLogs} سا للتحقق` : 'الساعات واضحة'}
                        </p>
                      </div>
                      <Link
                        href={`/organizations/${orgId}/events/${o.id}`}
                        className="shrink-0 rounded-md bg-[#1E4D38] px-3 py-1.5 text-xs text-white hover:bg-[#163A2B]"
                      >
                        فتح
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
