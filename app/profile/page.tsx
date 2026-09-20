import { auth, requireUser } from 'app/auth';
import { db, getSkillSuggestions, getUser } from 'app/db';
import { applications, users, volunteerLogs } from 'app/schema';
import { parseCommaList } from 'app/match';
import { eq, sum } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import SkillsInput from 'app/profile/skills-input';
import AvatarInput from 'app/components/avatar-input';
import OrgAvatar from 'app/components/org-avatar';
import TopBar from 'app/components/top-bar';

const OCCUPATIONS = [
  'student',
  'employee',
  'teacher',
  'freelancer',
  'housewife',
  'retiree',
  'job_seeker',
  'other',
] as const;

async function updateProfile(formData: FormData) {
  'use server';
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return;
  const rows = await getUser(email);
  const me = rows[0];
  if (!me) return;

  const occupation = (formData.get('occupation') as string) || null;
  const avatarUrl = ((formData.get('avatarUrl') as string) || '').trim();
  if (avatarUrl && (avatarUrl.length > 400_000 || !avatarUrl.startsWith('data:image/'))) return;
  await db
    .update(users)
    .set({
      name: ((formData.get('name') as string) || '').trim() || null,
      occupation: (OCCUPATIONS as readonly string[]).includes(occupation ?? '')
        ? (occupation as any)
        : null,
      university: ((formData.get('university') as string) || '').trim() || null,
      campus: ((formData.get('campus') as string) || '').trim() || null,
      city: ((formData.get('city') as string) || '').trim() || null,
      phone: ((formData.get('phone') as string) || '').trim() || null,
      availability: ((formData.get('availability') as string) || '').trim() || null,
      skills: parseCommaList(formData.get('skills')),
      languages: parseCommaList(formData.get('languages')),
      interests: parseCommaList(formData.get('interests')),
      portfolioUrl: ((formData.get('portfolioUrl') as string) || '').trim() || null,
      avatarUrl: avatarUrl || null,
      bio: ((formData.get('bio') as string) || '').trim() || null,
    })
    .where(eq(users.id, me.id));
  redirect('/profile?saved=1');
}

function completeness(me: any): number {
  const fields = [
    me?.name,
    me?.occupation,
    me?.campus,
    me?.city,
    (me?.skills ?? []).length > 0,
    (me?.languages ?? []).length > 0,
    me?.bio,
  ];
  const done = fields.filter(Boolean).length;
  return Math.round((done / fields.length) * 100);
}

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: { saved?: string };
}) {
  const me: any = await requireUser();
  const email = me.email as string;

  const apps = await db
    .select({ id: applications.id })
    .from(applications)
    .where(eq(applications.userId, me.id));
  const hours = await db
    .select({ total: sum(volunteerLogs.hours) })
    .from(volunteerLogs)
    .where(eq(volunteerLogs.userId, me.id));

  const pct = completeness(me);
  const join = (v: string[] | null) => (v ?? []).join(', ');
  const skillSuggestions = await getSkillSuggestions();

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar name={me.name ?? email} avatarUrl={me.avatarUrl} active="/profile" />

      <main className="mx-auto max-w-3xl px-4 py-6">
        <div className="mb-4 flex items-center gap-3">
          <OrgAvatar name={me.name ?? email} logoUrl={me.avatarUrl} size={48} />
          <div>
            <h1 className="text-xl font-bold">Profile</h1>
            <p className="text-sm text-gray-500">
              {pct}% complete · {apps.length} applications ·{' '}
              {Number((hours[0]?.total ?? 0) as any) || 0}h logged
            </p>
          </div>
        </div>
        {searchParams.saved === '1' && (
          <p className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            Profile saved. Matching now uses your occupation + skills.
          </p>
        )}
        <form action={updateProfile} className="space-y-4 rounded-xl border border-gray-200 bg-white p-4">
          <AvatarInput name="avatarUrl" defaultValue={me.avatarUrl} label="Profile picture" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="text-sm">
              Name
              <input name="name" defaultValue={me.name ?? ''} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
            </label>
            <label className="text-sm">
              Occupation
              <select name="occupation" defaultValue={me.occupation ?? ''} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2">
                <option value="">Select…</option>
                {OCCUPATIONS.map((o) => (
                  <option key={o} value={o}>{o.replace('_', ' ')}</option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              University
              <input name="university" defaultValue={me.university ?? ''} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
            </label>
            <label className="text-sm">
              Campus chapter
              <input name="campus" defaultValue={me.campus ?? ''} placeholder="USTHB" className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
            </label>
            <label className="text-sm">
              City
              <input name="city" defaultValue={me.city ?? ''} placeholder="Algiers" className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
            </label>
            <label className="text-sm">
              Phone
              <input name="phone" defaultValue={me.phone ?? ''} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
            </label>
            <label className="text-sm">
              Availability
              <input name="availability" defaultValue={me.availability ?? ''} placeholder="weekends, evenings" className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
            </label>
            <label className="text-sm">
              Portfolio URL
              <input name="portfolioUrl" defaultValue={me.portfolioUrl ?? ''} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
            </label>
          </div>
          <label className="block text-sm">
            Skills
            <span className="mt-1 block">
              <SkillsInput
                name="skills"
                defaultValue={me.skills ?? []}
                suggestions={skillSuggestions}
              />
            </span>
          </label>
          <label className="block text-sm">
            Languages (comma-separated)
            <input name="languages" defaultValue={join(me.languages)} placeholder="arabic, french, english" className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
          </label>
          <label className="block text-sm">
            Interests (comma-separated)
            <input name="interests" defaultValue={join(me.interests)} placeholder="education, environment" className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
          </label>
          <label className="block text-sm">
            Bio
            <textarea name="bio" defaultValue={me.bio ?? ''} rows={3} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
          </label>
          <button className="rounded-md bg-sky-700 px-4 py-2 text-sm text-white hover:bg-sky-800" type="submit">
            Save profile
          </button>
        </form>
      </main>
    </div>
  );
}
