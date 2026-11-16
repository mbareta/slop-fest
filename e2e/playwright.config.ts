// E2E against a production build (`next build` + `next start`) and a real
// Postgres at DATABASE_URL. Run everything with `pnpm e2e`, or one journey
// with `pnpm e2e e2e/journeys/health.spec.ts`.
import { defineConfig, devices } from '@playwright/test';

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
    command: `pnpm --filter @slop/web build && pnpm --filter @slop/web start --port ${PORT}`,
    url: `http://localhost:${PORT}/api/health`,
    reuseExistingServer: !CI,
    timeout: 180_000,
    stdout: 'pipe',
  },
});
