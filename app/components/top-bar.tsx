import Link from 'next/link';
import { signOut } from 'app/auth';
import ProfileMenu from 'app/components/profile-menu';

const DISCOVERY = [
  { href: '/protected', label: 'Feed' },
  { href: '/organizations', label: 'Organizations' },
  { href: '/volunteers', label: 'Volunteers' },
  { href: '/faculties', label: 'Faculties' },
  { href: '/about', label: 'About' },
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
  name: string | null;
  avatarUrl?: string | null;
  active?: string;
}) {
  async function signOutAction() {
    'use server';
    await signOut({ redirectTo: '/' });
  }

  return (
    <header className="sticky top-0 z-20 border-b border-[#163A2B] bg-[#1E4D38]">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-2.5">
        <div className="flex items-center gap-5">
          <Link href="/" aria-label="Athar home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/athar_logo.png"
              alt="Athar home"
              width={36}
              height={36}
              className={`rounded-md bg-[#f8f8f5] object-cover ${active === '/' ? 'ring-2 ring-[#C19A5B] ring-offset-2 ring-offset-[#1E4D38]' : ''}`}
              style={{ width: 36, height: 36 }}
            />
          </Link>
          <nav className="flex gap-4 text-sm" aria-label="Discover">
            {DISCOVERY.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={active === l.href ? 'border-b-2 border-[#C19A5B] font-semibold text-white' : 'text-[#f8f8f5]/80 hover:text-white'}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        {name ? (
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
        ) : (
          <div className="flex gap-2">
            <Link
              href="/login"
              className="rounded-md px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-[#1E4D38] hover:bg-[#f8f8f5]"
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
