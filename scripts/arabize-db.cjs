// Arabize persisted content: orgs, events, campuses, skills, languages, log notes.
// Idempotent: every update is keyed on exact current values; reruns only
// touch rows that still hold untranslated content.
const fs = require('fs');

for (const line of fs.readFileSync('.env', 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
}

const CAMPUS = {
  Algiers: 'الجزائر',
  'Bab Ezzouar': 'باب الزوار',
  'Faculty of Sciences': 'كلية العلوم',
  'Factulty of Sciences': 'كلية العلوم',
  'Faculty of Technologies': 'كلية التكنولوجيا',
};

const SKILL = {
  translation: 'الترجمة',
  arabic: 'العربية',
  french: 'الفرنسية',
  english: 'الإنجليزية',
  tutoring: 'التدريس',
  teaching: 'التدريس',
  math: 'الرياضيات',
  design: 'التصميم',
  figma: 'التصميم',
  dev: 'البرمجة',
  environment: 'البيئة',
  teamwork: 'العمل الجماعي',
  cleaning: 'التنظيف',
  logistics: 'اللوجستيك',
  photography: 'التصوير',
  'web development': 'تطوير الويب',
  'infrastructure & systems administration': 'إدارة الأنظمة',
  'ai agentic integration': 'الذكاء الاصطناعي',
};

const ORGS = {
  'USTHB Solidarity Club': ['نادي التضامن USTHB', 'نادٍ طلابي تطوعي.'],
  'Algiers Food Bank': ['بنك الجزائر الغذائي', 'توزيع أسبوعي للطرود الغذائية على العائلات المحتاجة.'],
  'Green Campus Initiative': ['مبادرة الحرم الأخضر', 'غرس الأشجار وحملات تنظيف الحرم الجامعي.'],
  'Green Algiers Collective': ['جماعة الجزائر الخضراء', 'غرس الأشجار وإعادة تأهيل الحدائق عبر العاصمة.'],
  'Clean Campus Crew': ['فريق نظافة الحرم', 'حملات تنظيف طلابية داخل الحرم الجامعي ومحيطه.'],
};

const EVENTS = {
  'Translate weekend workshop flyer (AR/FR)': [
    'ترجمة مطوية ورشة نهاية الأسبوع (عربي/فرنسي)',
    'مطوية من صفحتين لورشة تنظيف في الحرم. مناسبة للمساهمين الجدد، مع مرافقة.',
    ['الترجمة', 'العربية', 'الفرنسية'],
  ],
  'Redesign donation poster': [
    'إعادة تصميم ملصق التبرعات',
    'إعادة تصميم ملصق A3 لحملة جمع المواد الغذائية. فيغما أو كانفا.',
    ['التصميم'],
  ],
  'Math tutoring for first-years': [
    'دروس دعم في الرياضيات للسنة الأولى',
    'حصة دعم أسبوعية (ساعة) في التحليل. ساعات موثقة + شهادة.',
    ['التدريس', 'الرياضيات'],
  ],
  'Fix charity site contact form (Next.js)': [
    'إصلاح نموذج الاتصال في موقع الجمعية',
    'خلل في إجراء خادم على موقع الجمعية. مفيد لملف الأعمال.',
    ['البرمجة', 'nextjs', 'typescript'],
  ],
  'Saturday food parcel packing': [
    'توضيب الطرود الغذائية أيام السبت',
    'فرز وتوضيب الطرود لـ80 عائلة. لا حاجة لخبرة.',
    ['اللوجستيك'],
  ],
  'Campus tree mapping': [
    'جرد أشجار الحرم',
    'رسم خريطة وتصوير 30 شجرة في الحرم للسجل الأخضر.',
    ['البيئة', 'التصوير'],
  ],
  'Bab Ezzouar pine planting day': [
    'يوم غرس الصنوبر في باب الزوار',
    'غرس 200 شتلة صنوبر على محيط الحرم. الأدوات والقفازات متوفرة، المبتدئون مرحب بهم.',
    ['البيئة', 'العمل الجماعي'],
  ],
  'Watering rota for new saplings': [
    'مناوبات سقي الشتلات الجديدة',
    'مناوبات سقي مرتين أسبوعيا للصفوف المغروسة حديثا خلال الأسابيع الجافة.',
    ['البيئة'],
  ],
  'El Hamiz park cleanup + replanting': [
    'تنظيف حديقة الحميز وإعادة الغرس',
    'إزالة النفايات من امتداد الحديقة ثم إعادة غرس شجيرات محلية. يوم السبت.',
    ['البيئة', 'التنظيف', 'العمل الجماعي'],
  ],
  'Faculty of Sciences courtyard cleanup': [
    'تنظيف ساحة كلية العلوم',
    'تنظيف عميق لساحة الكلية: جمع النفايات، فرز الحاويات، تجديد جدار الملصقات.',
    ['التنظيف', 'العمل الجماعي'],
  ],
  'Sablettes beach cleanup': [
    'تنظيف شاطئ الصابلات',
    'تنظيف الشاطئ صباح الأحد مع محطات فرز للمواد القابلة للتدوير. النقل من الحرم مؤمّن.',
    ['التنظيف', 'اللوجستيك'],
  ],
};

const NOTES = {
  'Sorted and packed family parcels': 'فرز وتوضيب الطرود العائلية',
  'Planted the east row saplings': 'غرس صف الشتلات الشرقي',
  'Packing line and distribution': 'خط التوضيب والتوزيع',
  'Planted the north row saplings': 'غرس صف الشتلات الشمالي',
  'Evening watering shift': 'مناوبة السقي المسائية',
  'Courtyard sweep and bin sorting': 'كنس الساحة وفرز الحاويات',
};

function mapList(list, dict) {
  if (!list) return list;
  let changed = false;
  const out = list.map((s) => {
    const key = s.toLowerCase().trim();
    if (dict[key] && dict[key] !== s) {
      changed = true;
      return dict[key];
    }
    return s;
  });
  return changed ? out : null;
}

async function main() {
  const { default: postgres } = await import('postgres');
  const sql = postgres(process.env.POSTGRES_URL + '?sslmode=require');
  let touched = 0;

  for (const [en, ar] of Object.entries(CAMPUS)) {
    const r1 = await sql`UPDATE users SET campus = ${ar} WHERE campus = ${en}`;
    const r2 = await sql`UPDATE organizations SET campus = ${ar} WHERE campus = ${en}`;
    const r3 = await sql`UPDATE opportunities SET campus = ${ar} WHERE campus = ${en}`;
    touched += r1.count + r2.count + r3.count;
  }
  console.log('campuses arabized rows:', touched);

  for (const [en, arName, arDesc] of Object.values(ORGS).map((v, i) => [Object.keys(ORGS)[i], ...v])) {
    await sql`UPDATE organizations SET name = ${arName}, description = ${arDesc} WHERE name = ${en}`;
  }
  console.log('orgs arabized');

  for (const [en, [arTitle, arDesc, arSkills]] of Object.entries(EVENTS)) {
    await sql`UPDATE opportunities SET title = ${arTitle}, description = ${arDesc}, skills = ${sql.array(arSkills)} WHERE title = ${en}`;
  }
  console.log('events arabized');

  const users = await sql`SELECT id, skills, languages FROM users`;
  for (const u of users) {
    const skills = mapList(u.skills, SKILL);
    const languages = mapList(u.languages, SKILL);
    if (skills || languages) {
      await sql`UPDATE users SET skills = ${skills ? sql.array(skills) : u.skills}, languages = ${languages ? sql.array(languages) : u.languages} WHERE id = ${u.id}`;
    }
  }
  console.log('user skills/languages arabized');

  for (const [en, ar] of Object.entries(NOTES)) {
    await sql`UPDATE volunteer_logs SET note = ${ar} WHERE note = ${en}`;
  }
  console.log('log notes arabized');

  const left = await sql`SELECT DISTINCT s FROM (SELECT unnest(skills) AS s FROM users WHERE skills IS NOT NULL UNION ALL SELECT unnest(skills) AS s FROM opportunities WHERE skills IS NOT NULL) x`;
  console.log('REMAINING_SKILLS:', JSON.stringify(left.map((r) => r.s)));
  const camps = await sql`SELECT DISTINCT campus FROM users UNION SELECT DISTINCT campus FROM organizations UNION SELECT DISTINCT campus FROM opportunities ORDER BY 1`;
  console.log('REMAINING_CAMPUSES:', JSON.stringify(camps.map((r) => r.campus)));
  await sql.end();
}

main().catch((e) => {
  console.error('ARABIZE_FAIL', e.message);
  process.exit(1);
});
