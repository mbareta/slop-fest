// Playwright fixtures for journey specs. Import `test` and `expect` from here
// instead of '@playwright/test':
//
//   import { expect, test } from '../support/fixtures.ts';
//
//   test('shows the tenant', async ({ signedInPage: page, tenant, tenantDb }) => {
//     await tenantDb.insert(schema.connections, { provider: 'stripe', displayName: 'Stripe' });
//     await page.goto('/');
//     ...
//   });
//
// Every test gets its own tenant, deleted (with all its rows) when the test ends.
import { test as base, type Page } from '@playwright/test';
import { eq } from 'drizzle-orm';
import { createDb, forTenant, schema, type Db, type TenantDb } from '@slop/db';
import { signIn } from './sign-in.ts';

export { expect } from '@playwright/test';
export { schema } from '@slop/db';

type Tenant = typeof schema.tenants.$inferSelect;

type TestFixtures = {
  /** A fresh tenant for this test. */
  tenant: Tenant;
  /** Seeds and reads this test's tenant data, through forTenant(). */
  tenantDb: TenantDb;
  /** `page`, signed in to `tenant`. */
  signedInPage: Page;
};

type WorkerFixtures = {
  /** Test database connection, shared by the tests in one worker. */
  db: Db;
};

export const test = base.extend<TestFixtures, WorkerFixtures>({
  db: [
    // Playwright needs the destructuring pattern even when no fixtures are used.
    // eslint-disable-next-line no-empty-pattern
    async ({}, use) => {
      const db = createDb(process.env.DATABASE_URL);
      await use(db);
      await db.$client.end();
    },
    { scope: 'worker' },
  ],

  tenant: async ({ db }, use, testInfo) => {
    const [tenant] = await db
      .insert(schema.tenants)
      .values({ name: `E2E ${testInfo.title} ${testInfo.testId}`.slice(0, 120) })
      .returning();
    if (!tenant) throw new Error('Could not create the test tenant');
    await use(tenant);
    // Tenant data cascades on delete.
    await db.delete(schema.tenants).where(eq(schema.tenants.id, tenant.id));
  },

  tenantDb: async ({ db, tenant }, use) => {
    await use(forTenant(db, tenant.id));
  },

  signedInPage: async ({ page, tenant }, use) => {
    await signIn(page, { tenantId: tenant.id });
    await use(page);
  },
});
