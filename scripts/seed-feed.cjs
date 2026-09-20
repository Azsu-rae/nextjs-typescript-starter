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
          name: 'نادي التضامن USTHB',
          description: 'نادٍ طلابي تطوعي.',
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
        title: 'ترجمة مطوية ورشة نهاية الأسبوع (عربي/فرنسي)',
        description: 'مطوية من صفحتين لورشة تنظيف في الحرم. مناسبة للمساهمين الجدد، مع مرافقة.',
        skills: ['الترجمة', 'العربية', 'الفرنسية'],
        effortHours: 2,
        difficulty: 'beginner',
        campus: 'USTHB',
        urgent: false,
        status: 'open',
      },
      {
        orgId,
        title: 'إعادة تصميم ملصق التبرعات',
        description: 'إعادة تصميم ملصق A3 لحملة جمع المواد الغذائية. فيغما أو كانفا.',
        skills: ['التصميم'],
        effortHours: 3,
        difficulty: 'beginner',
        campus: 'USTHB',
        urgent: true,
        status: 'open',
      },
      {
        orgId,
        title: 'دروس دعم في الرياضيات للسنة الأولى',
        description: 'حصة دعم أسبوعية (ساعة) في التحليل. ساعات موثقة + شهادة.',
        skills: ['التدريس', 'الرياضيات'],
        effortHours: 4,
        difficulty: 'intermediate',
        campus: 'USTHB',
        urgent: false,
        status: 'open',
      },
      {
        orgId,
        title: 'إصلاح نموذج الاتصال في موقع الجمعية',
        description: 'خلل في إجراء خادم على موقع الجمعية. مفيد لملف الأعمال.',
        skills: ['البرمجة', 'nextjs', 'typescript'],
        effortHours: 5,
        difficulty: 'advanced',
        campus: 'الجزائر',
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
