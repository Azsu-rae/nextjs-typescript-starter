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
      name: 'بنك الجزائر الغذائي',
      description: 'توزيع أسبوعي للطرود الغذائية على العائلات المحتاجة.',
      campus: 'الجزائر',
      verified: true,
      owner: u1.id,
    },
    {
      name: 'مبادرة الحرم الأخضر',
      description: 'غرس الأشجار وحملات تنظيف الحرم الجامعي.',
      campus: 'USTHB',
      verified: false,
      owner: u1.id,
    },
    {
      name: 'جماعة الجزائر الخضراء',
      description: 'غرس الأشجار وإعادة تأهيل الحدائق عبر العاصمة.',
      campus: 'الجزائر',
      verified: true,
      owner: u2.id,
    },
    {
      name: 'فريق نظافة الحرم',
      description: 'حملات تنظيف طلابية داخل الحرم الجامعي ومحيطه.',
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
      org: 'بنك الجزائر الغذائي',
      title: 'توضيب الطرود الغذائية أيام السبت',
      description: 'فرز وتوضيب الطرود لـ80 عائلة. لا حاجة لخبرة.',
      skills: ['اللوجستيك'],
      effortHours: 4,
      difficulty: 'beginner',
      campus: 'الجزائر',
      urgent: true,
      days: 5,
    },
    {
      org: 'مبادرة الحرم الأخضر',
      title: 'جرد أشجار الحرم',
      description: 'رسم خريطة وتصوير 30 شجرة في الحرم للسجل الأخضر.',
      skills: ['البيئة', 'التصوير'],
      effortHours: 3,
      difficulty: 'beginner',
      campus: 'USTHB',
      urgent: false,
      days: 12,
    },
    {
      org: 'جماعة الجزائر الخضراء',
      title: 'يوم غرس الصنوبر في باب الزوار',
      description: 'غرس 200 شتلة صنوبر على محيط الحرم. الأدوات والقفازات متوفرة، المبتدئون مرحب بهم.',
      skills: ['البيئة', 'العمل الجماعي'],
      effortHours: 6,
      difficulty: 'beginner',
      campus: 'باب الزوار',
      urgent: false,
      days: 9,
    },
    {
      org: 'جماعة الجزائر الخضراء',
      title: 'مناوبات سقي الشتلات الجديدة',
      description: 'مناوبات سقي مرتين أسبوعيا للصفوف المغروسة حديثا خلال الأسابيع الجافة.',
      skills: ['البيئة'],
      effortHours: 2,
      difficulty: 'beginner',
      campus: 'باب الزوار',
      urgent: false,
      days: 16,
    },
    {
      org: 'جماعة الجزائر الخضراء',
      title: 'تنظيف حديقة الحميز وإعادة الغرس',
      description: 'إزالة النفايات من امتداد الحديقة ثم إعادة غرس شجيرات محلية. يوم السبت.',
      skills: ['البيئة', 'التنظيف', 'العمل الجماعي'],
      effortHours: 5,
      difficulty: 'intermediate',
      campus: 'الجزائر',
      urgent: true,
      days: 7,
    },
    {
      org: 'فريق نظافة الحرم',
      title: 'تنظيف ساحة كلية العلوم',
      description: 'تنظيف عميق لساحة الكلية: جمع النفايات، فرز الحاويات، تجديد جدار الملصقات.',
      skills: ['التنظيف', 'العمل الجماعي'],
      effortHours: 3,
      difficulty: 'beginner',
      campus: 'كلية العلوم',
      urgent: true,
      days: 6,
    },
    {
      org: 'فريق نظافة الحرم',
      title: 'تنظيف شاطئ الصابلات',
      description: 'تنظيف الشاطئ صباح الأحد مع محطات فرز للمواد القابلة للتدوير. النقل من الحرم مؤمّن.',
      skills: ['التنظيف', 'اللوجستيك'],
      effortHours: 4,
      difficulty: 'intermediate',
      campus: 'الجزائر',
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
    [u1.id, 'توضيب الطرود الغذائية أيام السبت', 'accepted'],
    [u2.id, 'توضيب الطرود الغذائية أيام السبت', 'accepted'],
    [u1.id, 'يوم غرس الصنوبر في باب الزوار', 'pending'],
    [u1.id, 'تنظيف ساحة كلية العلوم', 'pending'],
    [u2.id, 'يوم غرس الصنوبر في باب الزوار', 'accepted'],
    [u2.id, 'تنظيف شاطئ الصابلات', 'pending'],
    [u2.id, 'تنظيف حديقة الحميز وإعادة الغرس', 'pending'],
    [u3.id, 'يوم غرس الصنوبر في باب الزوار', 'pending'],
    [u3.id, 'تنظيف ساحة كلية العلوم', 'accepted'],
    [u3.id, 'مناوبات سقي الشتلات الجديدة', 'accepted'],
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
    [u1.id, 'توضيب الطرود الغذائية أيام السبت', 4, 'فرز وتوضيب الطرود العائلية'],
    [u1.id, 'يوم غرس الصنوبر في باب الزوار', 5, 'غرس صف الشتلات الشرقي'],
    [u2.id, 'توضيب الطرود الغذائية أيام السبت', 5, 'خط التوضيب والتوزيع'],
    [u2.id, 'يوم غرس الصنوبر في باب الزوار', 6, 'غرس صف الشتلات الشمالي'],
    [u3.id, 'مناوبات سقي الشتلات الجديدة', 2, 'مناوبة السقي المسائية'],
    [u3.id, 'تنظيف ساحة كلية العلوم', 3, 'كنس الساحة وفرز الحاويات'],
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
