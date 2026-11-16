# User journeys

Each journey has exactly one Playwright spec in `e2e/journeys/<id>.spec.ts`.
Happy path only, unless QA asks for edge or regression cases.

| ID | Journey | Spec |
|----|---------|------|
| tenant-isolation | Two tenants never see each other's data (permanent) | `e2e/journeys/tenant-isolation.spec.ts` |

<!-- Add a row when a ticket introduces a new journey. -->
