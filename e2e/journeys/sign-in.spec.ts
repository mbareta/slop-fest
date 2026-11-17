// Journey: sign-in. A signed-in user sees which tenant they are in.
// Also the smallest working example of the e2e fixtures.
import { expect, test } from '../support/fixtures.ts';

test('home page shows the signed-in tenant', async ({ signedInPage: page, tenant }) => {
  await page.goto('/');
  await expect(page.getByText(`Signed in to ${tenant.name}`)).toBeVisible();
});
