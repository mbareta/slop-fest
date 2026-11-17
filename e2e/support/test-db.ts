// Creates the e2e database if it doesn't exist yet and applies migrations.
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createDb } from '@slop/db';
import { databaseName } from './env.ts';

const MIGRATE = fileURLToPath(new URL('../../packages/db/src/migrate.ts', import.meta.url));

export async function prepareTestDatabase(url: string): Promise<void> {
  const target = new URL(url);
  const name = databaseName(target);
  if (!name.endsWith('_test')) throw new Error(`Not a test database: ${name}`);

  // Connect to the server's default database to create the test one.
  const admin = new URL(url);
  admin.pathname = '/postgres';
  const db = createDb(admin.toString());
  try {
    const { rowCount } = await db.$client.query('select 1 from pg_database where datname = $1', [name]);
    if (!rowCount) {
      // Name is checked against /^[a-z0-9_]+_test$/ in env.ts; quote it anyway.
      await db.$client.query(`create database "${name.replaceAll('"', '""')}"`);
      console.log(`Created database ${name}`);
    }
  } finally {
    await db.$client.end();
  }

  execFileSync(process.execPath, [MIGRATE], {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: url },
  });
}
