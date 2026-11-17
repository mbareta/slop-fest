// E2E sign-in seam (client side). Signs the page's browser context in to a
// tenant through /api/e2e/sign-in, which only exists when the app runs with
// E2E_MODE=1. When real customer auth lands, this file changes, specs don't.
//
// Protected path: changes need code-owner review.
import { expect, type Page } from '@playwright/test';

export async function signIn(page: Page, { tenantId, userId }: { tenantId: string; userId?: string }) {
  // page.request shares cookies with the page, so the session cookie sticks.
  const res = await page.request.post('/api/e2e/sign-in', { data: { tenantId, userId } });
  expect(res.ok(), `e2e sign-in failed: ${res.status()} ${await res.text()}`).toBe(true);
}
