// Applies pending migrations from ../migrations. Run with `pnpm db:migrate`.
import { fileURLToPath } from 'node:url';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { createDb } from './client.ts';

const db = createDb();
try {
  await migrate(db, { migrationsFolder: fileURLToPath(new URL('../migrations', import.meta.url)) });
  console.log('Migrations applied');
} finally {
  await db.$client.end();
}
