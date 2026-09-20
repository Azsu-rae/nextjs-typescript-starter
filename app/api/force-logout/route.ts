import { signOut } from 'app/auth';

// Clears a session cookie whose user no longer exists, then lands on /login.
// Reached via redirect from requireUser() — signOut() can't run during page
// render, but it can run here.
export async function GET() {
  await signOut({ redirectTo: '/login' });
}
