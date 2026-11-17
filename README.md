# Slop Fest

A prototype that pulls data from several outside sources and shows charts and
reports to external customers. Project rules and layout are in
[CLAUDE.md](CLAUDE.md); user journeys are in [docs/journeys.md](docs/journeys.md).

## Prerequisites
- Node 24 (see `.nvmrc`) and pnpm 10 (`corepack enable`)
- PostgreSQL 15 or newer, running locally

## Setup
```bash
pnpm install
cp .env.example .env        # then edit DATABASE_URL and SESSION_SECRET
createdb slop_fest_dev      # the database named in DATABASE_URL
pnpm db:migrate
pnpm dev                    # http://localhost:3000
```

### Environment
One `.env` file at the repo root serves the web app, the worker, migrations and
e2e. Variables already set in your shell (or in CI) take precedence over it.

| Variable | Used for |
|----------|----------|
| `DATABASE_URL` | Dev database. Required. |
| `SESSION_SECRET` | Signs session cookies, 32+ characters. Required to sign in. |
| `E2E_DATABASE_URL` | Optional. Overrides the e2e database (name must end in `_test`). |
| `APP_ENV` | `production` in production only. Not needed locally. |

## Commands
| Command | What it does |
|---------|--------------|
| `pnpm dev` | Web app in dev mode |
| `pnpm --filter @slop/workers start` | Ingestion worker |
| `pnpm db:migrate` | Apply migrations to `DATABASE_URL` |
| `pnpm db:generate` | Create a migration after changing `packages/db/src/schema.ts` |
| `pnpm typecheck` / `pnpm lint` | Static checks |
| `pnpm e2e` | Playwright journeys (see below) |

## End-to-end tests
`pnpm e2e` builds the app, starts it with `next start` and runs every journey in
`e2e/journeys/` in Chromium. Run one journey with
`pnpm e2e e2e/journeys/sign-in.spec.ts`. The first run needs the browser:
`pnpm exec playwright install chromium`.

**Test database.** e2e never touches your dev database. It uses the database in
`DATABASE_URL` with `_test` added to its name (`slop_fest_dev` becomes
`slop_fest_dev_test`), creates it if needed and applies migrations. It refuses
to run against any database whose name doesn't end in `_test`.

**Writing a journey spec.** Import `test` and `expect` from
`e2e/support/fixtures.ts`. Each test gets its own tenant, deleted afterwards:

```ts
import { expect, schema, test } from '../support/fixtures.ts';

test('shows the tenant', async ({ signedInPage: page, tenant, tenantDb }) => {
  // Seed data through forTenant(); it is deleted with the tenant.
  await tenantDb.insert(schema.connections, { provider: 'stripe', displayName: 'Stripe' });
  await page.goto('/');
  await expect(page.getByText(`Signed in to ${tenant.name}`)).toBeVisible();
});
```

- `tenant`: a fresh tenant row for this test
- `tenantDb`: `forTenant()` for that tenant, to seed and read data
- `signedInPage`: `page`, signed in to that tenant

Sign-in goes through a test-only route that exists only when the app runs with
`E2E_MODE=1`, which `pnpm e2e` sets. The app refuses to start with
`E2E_MODE` set and `APP_ENV=production`.
