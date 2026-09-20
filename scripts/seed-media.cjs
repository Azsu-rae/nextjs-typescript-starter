// Media seeds: org logos + event slideshows (files live in public/).
// Idempotent plain UPDATEs — safe to rerun.
const fs = require('fs');

for (const line of fs.readFileSync('.env', 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
}

async function main() {
  const { default: postgres } = await import('postgres');
  const sql = postgres(process.env.POSTGRES_URL + '?sslmode=require');

  const logos = {
    'نادي التضامن USTHB': '/orgs/USTHB_solidarity_club.jpg',
    'بنك الجزائر الغذائي': '/orgs/bank_of_food.jpeg',
    'مبادرة الحرم الأخضر': '/orgs/green_campus_initiative.png',
    'جماعة الجزائر الخضراء': '/orgs/gree_algiers_collective.jpeg',
    'فريق نظافة الحرم': '/orgs/cleaning_crew.jpg',
  };
  for (const [name, url] of Object.entries(logos)) {
    await sql`UPDATE organizations SET logo_url = ${url} WHERE name = ${name}`;
  }

  const galleries = {
    'توضيب الطرود الغذائية أيام السبت': ['/events/food_parcel_packing/im1.jpeg'],
    'تنظيف حديقة الحميز وإعادة الغرس': ['/events/el_hamiz_park_cleanup/im1.jpeg'],
    'تنظيف ساحة كلية العلوم': [
      '/events/faculty_of_sciences_cleaning/im1.jpeg',
      '/events/faculty_of_sciences_cleaning/im2.jpeg',
    ],
    'تنظيف شاطئ الصابلات': [
      '/events/sablette_beach_cleanup/im1.jpeg',
      '/events/sablette_beach_cleanup/im2.jpg',
    ],
  };
  for (const [title, images] of Object.entries(galleries)) {
    await sql`UPDATE opportunities SET images = ${sql.array(images)} WHERE title = ${title}`;
  }

  const orgs = await sql`SELECT name, logo_url FROM organizations ORDER BY id`;
  console.log('ORG_LOGOS:', orgs.map((o) => `${o.name}=${o.logo_url ? 'Y' : '-'}`).join(' '));
  const opps = await sql`SELECT title, images FROM opportunities WHERE images IS NOT NULL`;
  console.log('GALLERIES:', opps.map((o) => `${o.title.slice(0, 30)}(${o.images.length})`).join(' '));
  await sql.end();
}

main().catch((e) => {
  console.error('SEED_FAIL', e.message);
  process.exit(1);
});
