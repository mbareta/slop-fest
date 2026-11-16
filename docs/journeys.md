# User journeys

Each journey has exactly one Playwright spec in `e2e/journeys/<id>.spec.ts`.
Happy path only, unless QA asks for edge or regression cases.

| ID | Journey | Spec |
|----|---------|------|
| health | The app boots, renders the home page and reaches its database | `e2e/journeys/health.spec.ts` |
| tenant-isolation | Two tenants never see each other's data (permanent) | added with the test harness (sign-in seam, seeding, fixture server) |

<!-- Add a row when a ticket introduces a new journey. -->
