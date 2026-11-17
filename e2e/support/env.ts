// Environment for e2e runs. Imported by playwright.config.ts, so it runs once in
// the Playwright main process before global setup, the web server and the test
// workers start, and they all inherit what it sets.
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const rootEnv = fileURLToPath(new URL('../../.env', import.meta.url));
if (existsSync(rootEnv)) process.loadEnvFile(rootEnv);

/**
 * The database e2e runs against: E2E_DATABASE_URL if set, otherwise DATABASE_URL
 * with `_test` added to the database name (slop_fest_dev -> slop_fest_dev_test).
 * Journeys create and delete data, so they never run against a database whose
 * name doesn't end in `_test`.
 */
export function testDatabaseUrl(): string {
  const source = process.env.E2E_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!source) throw new Error('Set DATABASE_URL (or E2E_DATABASE_URL) to a Postgres server for e2e');
  const url = new URL(source);
  if (!process.env.E2E_DATABASE_URL) {
    const name = databaseName(url);
    if (!name.endsWith('_test')) url.pathname = `/${name}_test`;
  }
  const name = databaseName(url);
  if (!/^[a-z0-9_]+_test$/.test(name)) {
    throw new Error(`e2e refuses to run against database "${name}": the name must end in _test`);
  }
  return url.toString();
}

export function databaseName(url: URL): string {
  return decodeURIComponent(url.pathname.replace(/^\//, ''));
}

/** Fixed secret for e2e session cookies. Never used outside tests. */
const E2E_SESSION_SECRET = 'e2e-only-session-secret-not-for-production-use';

/** Variables every e2e process gets: global setup, the web server and the workers. */
export const e2eEnv = {
  DATABASE_URL: testDatabaseUrl(),
  E2E_MODE: '1',
  SESSION_SECRET: E2E_SESSION_SECRET,
};

Object.assign(process.env, e2eEnv);
