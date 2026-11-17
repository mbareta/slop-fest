// E2E against a production build (`next build` + `next start`) and a real
// Postgres. The test database is DATABASE_URL with `_test` added to its name
// (see support/env.ts). Run everything with `pnpm e2e`, or one journey with
// `pnpm e2e e2e/journeys/health.spec.ts`.
import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { e2eEnv } from './support/env.ts';

const PREPARE_DB = JSON.stringify(fileURLToPath(new URL('./support/prepare-db.ts', import.meta.url)));

const PORT = Number(process.env.E2E_PORT ?? 3100);
const CI = !!process.env.CI;

export default defineConfig({
  testDir: './journeys',
  globalSetup: './global-setup.ts',
  outputDir: '../test-results',
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  reporter: CI
    ? [['github'], ['html', { outputFolder: '../playwright-report', open: 'never' }]]
    : [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // The server's readiness check needs the database, and Playwright starts the
    // server before global setup, so prepare the database here too.
    command: `node ${PREPARE_DB} && pnpm --filter @slop/web build && pnpm --filter @slop/web start --port ${PORT}`,
    url: `http://localhost:${PORT}/api/health`,
    reuseExistingServer: !CI,
    timeout: 180_000,
    stdout: 'pipe',
    env: e2eEnv,
  },
});
