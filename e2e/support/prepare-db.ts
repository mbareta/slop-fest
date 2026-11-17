// CLI entry for prepareTestDatabase(). Playwright starts the web server before
// global setup, so the webServer command runs this first.
import { prepareTestDatabase } from './test-db.ts';
import { e2eEnv } from './env.ts';

await prepareTestDatabase(e2eEnv.DATABASE_URL);
