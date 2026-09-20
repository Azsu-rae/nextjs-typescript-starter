import { auth, signOut } from 'app/auth';
import { getUser } from 'app/db';
import ProfileMenu from 'app/components/profile-menu';
import Link from 'next/link';

export default async function AboutPage() {
  const session = await auth();
  const email = session?.user?.email;
  const rows = email ? await getUser(email) : [];
  const me: any = rows[0] ?? null;

  async function signOutAction() {
    'use server';
    await signOut({ redirectTo: '/' });
  }

  return (
    <div className="min-h-screen bg-[#f8f8f5]">
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-2.5">
          <Link href="/" aria-label="Athar home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/athar_logo.png"
              alt="Athar home"
              width={36}
              height={36}
              className="rounded-md bg-[#f8f8f5] object-cover"
              style={{ width: 36, height: 36 }}
            />
          </Link>
          {me ? (
            <ProfileMenu name={me.name ?? email ?? ''} avatarUrl={me.avatarUrl}>
              <Link href="/protected" role="menuitem" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                Feed
              </Link>
              <Link href="/profile" role="menuitem" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                Edit profile
              </Link>
              <form action={signOutAction} className="border-t border-gray-100">
                <button
                  type="submit"
                  role="menuitem"
                  className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                >
                  Sign out
                </button>
              </form>
            </ProfileMenu>
          ) : (
            <div className="flex gap-2">
              <Link href="/login" className="rounded-md px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100">
                Sign In
              </Link>
              <Link href="/register" className="rounded-md bg-[#1E4D38] px-4 py-2 text-sm font-semibold text-white hover:bg-[#163A2B]">
                Register
              </Link>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-10">
        <p className="text-sm font-bold uppercase tracking-widest text-[#1E4D38]">Our story</p>
        <h1 className="mt-2 text-3xl font-bold">
          A volunteer work cultural revolution in Algeria
        </h1>
        <div className="mt-4 space-y-4 text-gray-700">
          <p>
            Athar starts with a simple observation: Algerian university
            students — and active youth in general — want to contribute, but
            charities and volunteering associations struggle to find the right
            hands for the right problems.
          </p>
          <p>
            We are building the platform that connects them: students offer
            concrete skills — tutoring, design, translation, dev work, weekend
            muscle — and organizations post specific problems instead of vague
            calls for bodies. Every hour is logged, verified by the
            organization, and turned into shareable certificates that make
            volunteering count on a CV.
          </p>
          <p>
            All of this runs under a non-profit, open-source umbrella whose
            mission is helping Algerian youth access knowledge and
            opportunities. Campus chapters keep it local: each faculty sees
            what&apos;s alive on its own ground.
          </p>
        </div>

        <h2 className="mt-8 text-xl font-bold">How it works</h2>
        <ol className="mt-3 space-y-3">
          {[
            ['Volunteer your skills', 'Create a profile with your occupation, campus and skills. Get matched to problems that fit you — not generic event feeds.'],
            ['Log verified hours', 'Apply, do the work, log your hours. The organization confirms them.'],
            ['Earn certificates', 'Verified hours mint shareable digital certificates with a public proof page.'],
          ].map(([title, body], i) => (
            <li key={title} className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="font-semibold">{i + 1}. {title}</p>
              <p className="mt-1 text-sm text-gray-600">{body}</p>
            </li>
          ))}
        </ol>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/protected"
            className="rounded-md bg-[#1E4D38] px-6 py-3 text-center text-sm font-semibold text-white hover:bg-[#163A2B]"
          >
            Browse opportunities
          </Link>
          <Link
            href="/organizations"
            className="rounded-md border border-gray-300 bg-white px-6 py-3 text-center text-sm font-semibold text-gray-800 hover:bg-gray-50"
          >
            Register an organization
          </Link>
        </div>
      </main>
    </div>
  );
}
