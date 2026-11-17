import { e2eEnv } from './support/env.ts';
import { prepareTestDatabase } from './support/test-db.ts';

/**
 * Creates the test database if needed and brings its schema up to date before any journey runs.
 * The webServer command does the same; this covers a reused, already running server.
 */
export default async function globalSetup() {
  await prepareTestDatabase(e2eEnv.DATABASE_URL);
}
