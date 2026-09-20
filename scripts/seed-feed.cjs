const fs = require('fs');

for (const line of fs.readFileSync('.env', 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
}

async function main() {
  const { default: postgres } = await import('postgres');
  const { drizzle } = await import('drizzle-orm/postgres-js');
  const schema = await import('../app/schema.ts');
  const sql = postgres(process.env.POSTGRES_URL + '?sslmode=require');
  const db = drizzle(sql, { schema });

  const existingUsers = await db.select().from(schema.users).limit(1);
  if (existingUsers.length === 0) throw new Error('No users found. Register first.');
  const owner = existingUsers[0];

  let orgs = await db.select().from(schema.organizations);
  if (orgs.length === 0) {
    const inserted = await db
      .insert(schema.organizations)
      .values([
        {
          name: 'USTHB Solidarity Club',
          description: 'Student-run volunteering chapter.',
          campus: 'USTHB',
          verified: true,
          ownerId: owner.id,
        },
      ])
      .returning();
    orgs = inserted;
    console.log('SEEDED org:', orgs[0].name);
  }

  let opps = await db.select().from(schema.opportunities);
  if (opps.length === 0) {
    const orgId = orgs[0].id;
    await db.insert(schema.opportunities).values([
      {
        orgId,
        title: 'Translate weekend workshop flyer (AR/FR)',
        description: '2-page flyer for a campus cleanup workshop. First-contribution friendly, mentor provided.',
        skills: ['translation', 'arabic', 'french'],
        effortHours: 2,
        difficulty: 'beginner',
        campus: 'USTHB',
        urgent: false,
        status: 'open',
      },
      {
        orgId,
        title: 'Redesign donation poster',
        description: 'Redesign an A3 poster for a food drive. Figma or Canva ok.',
        skills: ['design', 'figma'],
        effortHours: 3,
        difficulty: 'beginner',
        campus: 'USTHB',
        urgent: true,
        status: 'open',
      },
      {
        orgId,
        title: 'Math tutoring for first-years',
        description: 'Weekly 1h tutoring session, analysis 101. Verified hours + certificate.',
        skills: ['tutoring', 'math'],
        effortHours: 4,
        difficulty: 'intermediate',
        campus: 'USTHB',
        urgent: false,
        status: 'open',
      },
      {
        orgId,
        title: 'Fix charity site contact form (Next.js)',
        description: 'Debug a broken server action on the association site. Good for dev portfolio.',
        skills: ['dev', 'nextjs', 'typescript'],
        effortHours: 5,
        difficulty: 'advanced',
        campus: 'Algiers',
        urgent: true,
        status: 'open',
      },
    ]);
    console.log('SEEDED 4 opportunities');
  } else {
    console.log('SKIP seed, opportunities:', opps.length);
  }
  await sql.end();
}

main().catch((e) => {
  console.error('SEED_FAIL', e.message);
  process.exit(1);
});
