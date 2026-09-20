import Link from 'next/link';
import { signOut } from 'app/auth';
import ProfileMenu from 'app/components/profile-menu';

const DISCOVERY = [
  { href: '/organizations', label: 'Organizations' },
  { href: '/volunteers', label: 'Volunteers' },
];

const PROFILE_LINKS = [
  { href: '/profile', label: 'Edit profile' },
  { href: '/applications', label: 'Applications' },
  { href: '/schedule', label: 'Schedule' },
  { href: '/impact', label: 'Impact' },
];

export default function TopBar({
  name,
  avatarUrl,
  active,
}: {
  name: string;
  avatarUrl?: string | null;
  active?: string;
}) {
  async function signOutAction() {
    'use server';
    await signOut({ redirectTo: '/' });
  }

  return (
    <header className="sticky top-0 z-20 border-b border-sky-800 bg-sky-700">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-2.5">
        <div className="flex items-center gap-5">
          <Link href="/protected" aria-label="Home feed">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/mahoraga_wheel.svg"
              alt="Impetus home"
              width={36}
              height={36}
              className={`rounded-full ${active === '/protected' ? 'ring-2 ring-white ring-offset-2 ring-offset-sky-700' : ''}`}
              style={{ width: 36, height: 36 }}
            />
          </Link>
          <nav className="flex gap-4 text-sm" aria-label="Discover">
            {DISCOVERY.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={active === l.href ? 'font-semibold text-white' : 'text-sky-100 hover:text-white'}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <ProfileMenu name={name} avatarUrl={avatarUrl}>
          {PROFILE_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              role="menuitem"
              className={`block px-4 py-2 text-sm hover:bg-gray-100 ${active === l.href ? 'font-semibold text-black' : 'text-gray-700'}`}
            >
              {l.label}
            </Link>
          ))}
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
      </div>
    </header>
  );
}
