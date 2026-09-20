// Applies every drizzle/*.sql migration in filename order.
// Run once per fresh database: node scripts/setup-db.cjs
const fs = require('fs');
const path = require('path');

for (const line of fs.readFileSync('.env', 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
}

async function main() {
  const { default: postgres } = await import('postgres');
  const sql = postgres(process.env.POSTGRES_URL + '?sslmode=require');
  const dir = path.join(__dirname, '..', 'drizzle');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
  for (const f of files) {
    await sql.unsafe(fs.readFileSync(path.join(dir, f), 'utf8'));
    console.log('APPLIED:', f);
  }
  const tables = await sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`;
  console.log('TABLES:', tables.map((t) => t.tablename).join(','));
  await sql.end();
}

main().catch((e) => {
  console.error('SETUP_FAIL', e.message);
  process.exit(1);
});
