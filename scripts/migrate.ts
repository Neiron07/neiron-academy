import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';

/**
 * Простой раннер миграций. Использует DIRECT_URL (session pooler, порт 5432) —
 * transaction pooler на 6543 не поддерживает часть DDL и prepared statements.
 */
const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!url) { console.error('Нет DIRECT_URL / DATABASE_URL'); process.exit(1); }

const withSeed = process.argv.includes('--seed');
const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });

await client.connect();
await client.query(`create table if not exists _migrations (
  name text primary key, applied_at timestamptz not null default now())`);

const dirs = [path.resolve('db/migrations'), ...(withSeed ? [path.resolve('db/seed')] : [])];
const files = dirs.flatMap((d) =>
  fs.existsSync(d) ? fs.readdirSync(d).filter((f) => f.endsWith('.sql')).map((f) => path.join(d, f)) : [],
).sort((a, b) => path.basename(a).localeCompare(path.basename(b)));

for (const file of files) {
  const name = path.basename(file);
  const done = await client.query('select 1 from _migrations where name = $1', [name]);
  if (done.rowCount) { console.log(`⏭  ${name} — уже применена`); continue; }

  const sql = fs.readFileSync(file, 'utf8');
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('insert into _migrations (name) values ($1)', [name]);
    await client.query('COMMIT');
    console.log(`✅ ${name}`);
  } catch (e: any) {
    await client.query('ROLLBACK');
    console.error(`❌ ${name}: ${e.message}`);
    process.exit(1);
  }
}

await client.end();
console.log('Готово.');
