// Demo seed: traditional volunteering orgs + events + pending/accepted
// applications across the 3 existing users. No users are created.
// Idempotent — safe to rerun.
const fs = require('fs');

for (const line of fs.readFileSync('.env', 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
}

async function main() {
  const { default: postgres } = await import('postgres');
  const sql = postgres(process.env.POSTGRES_URL + '?sslmode=require');

  const users = await sql`SELECT id, email FROM users ORDER BY id`;
  if (users.length !== 3) throw new Error(`Expected 3 users, found ${users.length}`);
  const [u1, u2, u3] = users;
  console.log('USERS:', users.map((u) => `${u.id}:${u.email}`).join(' '));

  // --- Organizations (ownership spread so each user manages one) ---
  const orgDefs = [
    {
      name: 'Green Algiers Collective',
      description: 'Tree planting and park rehabilitation across Algiers.',
      campus: 'Algiers',
      verified: true,
      owner: u2.id,
    },
    {
      name: 'Clean Campus Crew',
      description: 'Student cleaning campaigns on and around campus.',
      campus: 'USTHB',
      verified: false,
      owner: u3.id,
    },
  ];
  for (const o of orgDefs) {
    const found = await sql`SELECT id FROM organizations WHERE name = ${o.name} LIMIT 1`;
    if (found.length === 0) {
      await sql`INSERT INTO organizations (name, description, campus, verified, owner_id)
        VALUES (${o.name}, ${o.description}, ${o.campus}, ${o.verified}, ${o.owner})`;
    }
  }
  const orgs = await sql`SELECT id, name FROM organizations`;
  const orgId = Object.fromEntries(orgs.map((o) => [o.name, o.id]));

  // --- Events ---
  const eventDefs = [
    {
      org: 'Green Algiers Collective',
      title: 'Bab Ezzouar pine planting day',
      description: 'Plant 200 pine saplings along the campus perimeter. Tools and gloves provided, beginners welcome.',
      skills: ['environment', 'teamwork'],
      effortHours: 6,
      difficulty: 'beginner',
      campus: 'Bab Ezzouar',
      urgent: false,
      days: 9,
    },
    {
      org: 'Green Algiers Collective',
      title: 'Watering rota for new saplings',
      description: 'Twice-weekly watering shifts for the newly planted rows through the dry weeks.',
      skills: ['environment'],
      effortHours: 2,
      difficulty: 'beginner',
      campus: 'Bab Ezzouar',
      urgent: false,
      days: 16,
    },
    {
      org: 'Green Algiers Collective',
      title: 'El Hamiz park cleanup + replanting',
      description: 'Clear dumped waste from the park extension, then replant native shrubs. Saturday blitz.',
      skills: ['environment', 'cleaning', 'teamwork'],
      effortHours: 5,
      difficulty: 'intermediate',
      campus: 'Algiers',
      urgent: true,
      days: 7,
    },
    {
      org: 'Clean Campus Crew',
      title: 'Faculty of Sciences courtyard cleanup',
      description: 'Deep-clean the faculty courtyard: litter sweep, bin sorting, poster wall refresh.',
      skills: ['cleaning', 'teamwork'],
      effortHours: 3,
      difficulty: 'beginner',
      campus: 'Faculty of Sciences',
      urgent: true,
      days: 6,
    },
    {
      org: 'Clean Campus Crew',
      title: 'Sablettes beach cleanup',
      description: 'Sunday morning beach sweep with sorting stations for recyclables. Transport from campus included.',
      skills: ['cleaning', 'logistics'],
      effortHours: 4,
      difficulty: 'intermediate',
      campus: 'Algiers',
      urgent: false,
      days: 20,
    },
  ];
  for (const e of eventDefs) {
    const found = await sql`SELECT id FROM opportunities WHERE title = ${e.title} AND org_id = ${orgId[e.org]} LIMIT 1`;
    if (found.length === 0) {
      await sql`INSERT INTO opportunities (org_id, title, description, skills, effort_hours, difficulty, campus, urgent, status, deadline)
        VALUES (${orgId[e.org]}, ${e.title}, ${e.description}, ${sql.array(e.skills)}, ${e.effortHours}, ${e.difficulty}, ${e.campus}, ${e.urgent}, 'open', NOW() + (${e.days} || ' days')::interval)`;
    }
  }
  const opps = await sql`SELECT id, title FROM opportunities`;
  const oppId = Object.fromEntries(opps.map((o) => [o.title, o.id]));

  // --- Applications: pending + accepted spread across the 3 users ---
  // [userId, eventTitle, status]
  const appDefs = [
    [u1.id, 'Bab Ezzouar pine planting day', 'pending'],
    [u1.id, 'Faculty of Sciences courtyard cleanup', 'pending'],
    [u2.id, 'Bab Ezzouar pine planting day', 'accepted'],
    [u2.id, 'Sablettes beach cleanup', 'pending'],
    [u2.id, 'El Hamiz park cleanup + replanting', 'pending'],
    [u3.id, 'Bab Ezzouar pine planting day', 'pending'],
    [u3.id, 'Faculty of Sciences courtyard cleanup', 'accepted'],
    [u3.id, 'Watering rota for new saplings', 'accepted'],
  ];
  for (const [uid, title, status] of appDefs) {
    await sql`INSERT INTO applications (opportunity_id, user_id, status)
      VALUES (${oppId[title]}, ${uid}, ${status})
      ON CONFLICT (user_id, opportunity_id) DO NOTHING`;
    await sql`UPDATE applications SET status = ${status}
      WHERE user_id = ${uid} AND opportunity_id = ${oppId[title]}`;
  }

  const summary = await sql`
    SELECT u.email, o.title, a.status
    FROM applications a
    JOIN users u ON u.id = a.user_id
    JOIN opportunities o ON o.id = a.opportunity_id
    ORDER BY u.id, o.id`;
  console.log('APPLICATIONS:');
  for (const r of summary) console.log(`  ${r.status.padEnd(8)} ${r.email} -> ${r.title}`);

  // --- Hour logs (pending verification, no certificates yet) ---
  // [userId, eventTitle, hours, note]
  const logDefs = [
    [u1.id, 'Saturday food parcel packing', 4, 'Sorted and packed family parcels'],
    [u1.id, 'Bab Ezzouar pine planting day', 5, 'Planted the east row saplings'],
    [u2.id, 'Saturday food parcel packing', 5, 'Packing line and distribution'],
    [u2.id, 'Bab Ezzouar pine planting day', 6, 'Planted the north row saplings'],
    [u3.id, 'Watering rota for new saplings', 2, 'Evening watering shift'],
    [u3.id, 'Faculty of Sciences courtyard cleanup', 3, 'Courtyard sweep and bin sorting'],
  ];
  for (const [uid, title, hours, note] of logDefs) {
    const found = await sql`SELECT id FROM volunteer_logs
      WHERE user_id = ${uid} AND opportunity_id = ${oppId[title]} LIMIT 1`;
    if (found.length === 0) {
      await sql`INSERT INTO volunteer_logs (user_id, opportunity_id, hours, note, verified)
        VALUES (${uid}, ${oppId[title]}, ${hours}, ${note}, false)`;
    }
  }
  const logSummary = await sql`
    SELECT u.email, o.title, l.hours, l.verified
    FROM volunteer_logs l
    JOIN users u ON u.id = l.user_id
    JOIN opportunities o ON o.id = l.opportunity_id
    ORDER BY u.id, o.id`;
  console.log('LOGS:');
  for (const r of logSummary) console.log(`  ${r.verified ? 'verified' : 'pending '} ${r.hours}h ${r.email} -> ${r.title}`);
  const counts = await sql`SELECT count(*)::int AS orgs FROM organizations`;
  const ecount = await sql`SELECT count(*)::int AS n FROM opportunities`;
  console.log(`ORGS: ${counts[0].orgs}, EVENTS: ${ecount[0].n}, APPLICATIONS: ${summary.length}, LOGS: ${logSummary.length}`);
  await sql.end();
}

main().catch((e) => {
  console.error('SEED_FAIL', e.message);
  process.exit(1);
});
