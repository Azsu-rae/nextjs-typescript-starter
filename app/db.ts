import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import postgres from 'postgres';
import { genSaltSync, hashSync } from 'bcrypt-ts';
import * as schema from 'app/schema';
import { users } from 'app/schema';

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle
export const client = postgres(`${process.env.POSTGRES_URL!}?sslmode=require`);
export const db = drizzle(client, { schema });

export async function getUser(email: string) {
  return await db.select().from(users).where(eq(users.email, email));
}

export async function createUser(email: string, password: string) {
  let salt = genSaltSync(10);
  let hash = hashSync(password, salt);

  return await db.insert(users).values({ email, password: hash });
}

export async function getSkillSuggestions(): Promise<string[]> {
  const u = (await client`
    SELECT DISTINCT unnest(skills) AS s FROM users WHERE skills IS NOT NULL
  `) as { s: string }[];
  const o = (await client`
    SELECT DISTINCT unnest(skills) AS s FROM opportunities WHERE skills IS NOT NULL
  `) as { s: string }[];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const row of [...u, ...o]) {
    const raw = (row.s ?? '').trim();
    if (!raw) continue;
    const key = raw.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(raw);
    }
  }
  return out.sort((a, b) => a.localeCompare(b));
}
