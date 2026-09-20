import { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  providers: [
    // added later in auth.ts since it requires bcrypt which is only compatible with Node.js
    // while this file is also used in non-Node.js environments
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      let isLoggedIn = !!auth?.user;
      let isProtected =
        nextUrl.pathname.startsWith('/protected') ||
        nextUrl.pathname.startsWith('/profile') ||
        nextUrl.pathname.startsWith('/applications') ||
        nextUrl.pathname.startsWith('/schedule') ||
        nextUrl.pathname.startsWith('/impact') ||
        nextUrl.pathname.startsWith('/volunteers') ||
        nextUrl.pathname.startsWith('/faculties') ||
        nextUrl.pathname.startsWith('/organizations');
      let isAuthPage =
        nextUrl.pathname.startsWith('/login') ||
        nextUrl.pathname.startsWith('/register');

      if (isProtected) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      } else if (isLoggedIn && isAuthPage) {
        return Response.redirect(new URL('/protected', nextUrl));
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
