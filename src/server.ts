import { buildApp } from './app.js';
import { config } from './config.js';
import { startJobs } from './jobs/index.js';
import { pool } from './db.js';

const app = await buildApp();

try {
  await pool.query('select 1');
  app.log.info('БД подключена');
} catch (e) {
  app.log.error(e, 'Нет соединения с БД — проверьте DATABASE_URL');
  process.exit(1);
}

startJobs(app.log);

await app.listen({ port: config.PORT, host: '0.0.0.0' });

for (const sig of ['SIGINT', 'SIGTERM'] as const) {
  process.on(sig, async () => {
    app.log.info('Останавливаюсь...');
    await app.close();
    await pool.end();
    process.exit(0);
  });
}
