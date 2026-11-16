import { execSync } from 'node:child_process';

/** Brings the test database schema up to date before any journey runs. */
export default function globalSetup() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL must point at a test Postgres');
  execSync('pnpm --filter @slop/db migrate', { stdio: 'inherit' });
}
