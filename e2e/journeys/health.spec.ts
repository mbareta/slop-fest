// Journey: health. The app boots and reaches its database.
import { expect, test } from '@playwright/test';

test('home page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Slop Fest' })).toBeVisible();
});

test('health endpoint reports the database as reachable', async ({ request }) => {
  const res = await request.get('/api/health');
  expect(res.status()).toBe(200);
  expect(await res.json()).toEqual({ status: 'ok', db: 'ok' });
});
