import 'dotenv/config';
import readline from 'node:readline/promises';
import { pool } from '../src/db.js';
import { hash, normalizePhone } from '../src/lib/auth.js';
import { config } from '../src/config.js';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

const name = await rl.question('Имя администратора: ');
const phone = await rl.question('Телефон (77011234567): ');
const password = await rl.question('Пароль (минимум 8 символов): ');
rl.close();

if (password.length < 8) { console.error('Пароль слишком короткий'); process.exit(1); }

const res = await pool.query(
  `insert into users (branch_id, role, full_name, phone, password_hash)
   values ($1,'admin',$2,$3,$4)
   on conflict (phone) do update set password_hash = excluded.password_hash, role='admin'
   returning id`,
  [config.BRANCH_ID, name, normalizePhone(phone), await hash(password)],
);

console.log('Администратор создан:', res.rows[0].id);
await pool.end();
