import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { compare } from 'bcrypt-ts';
import { getUser } from 'app/db';
import { authConfig } from 'app/auth.config';
import { redirect } from 'next/navigation';

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize({ email, password }: any) {
        let user = await getUser(email);
        if (user.length === 0) return null;
        let passwordsMatch = await compare(password, user[0].password!);
        if (passwordsMatch) return user[0] as any;
      },
    }),
  ],
});

// Pages must use this instead of trusting the session cookie alone: the JWT
// is stateless, so a session can outlive its database row (e.g. DB switch).
// Unknown users are bounced through /api/force-logout (clears the cookie,
// which page render itself is not allowed to do) and land on /login.
export async function requireUser() {
  const session = await auth();
  const email = session?.user?.email;
  const rows = email ? await getUser(email) : [];
  if (!rows[0]) {
    redirect('/api/force-logout');
  }
  return rows[0];
}
