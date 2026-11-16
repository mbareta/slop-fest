# Software Factory: handoff to Claude Code

Context: this repo is a new prototype that aggregates data from multiple sources and shows charts and reports to external customers. It is built with a "software factory" process: Linear tickets, AI agents that open PRs, CI gates, auto-merge for small tickets. This file summarizes decisions made in a planning chat. The full plan is the "Software Factory: Implementation Plan" doc (shared by the user).

## Roles
CEO (reads Linear and a weekly digest only), product owner (writes tickets, sets size, approves plans), engineer (prompts for large tickets, reviews PRs, owns gates), QA (acceptance scenarios, bug reports, no routine manual testing). Agents turn tickets into PRs.

## Decisions
- Node.js and TypeScript everywhere. Monorepo: `apps/web` (Next.js dashboard + API), `apps/workers` (ingestion), `packages/db` (Drizzle schema, migrations, `forTenant()`), `packages/connectors/*` (each exposes `auth`, `fetch`, `normalize`), `infra/`, `e2e/`, `docs/`, `tools/factory/`, `.github/`, `.circleci/`, `CLAUDE.md`.
- Tickets in Linear, code in GitHub (Linear GitHub integration, GitHub Issues sync OFF). Branch names and PR titles must contain the Linear ID.
- AWS, production only (no staging). Infra with Pulumi using https://github.com/ExtensionEngine/infra-code-blocks (Vpc, Database, WebServer, EcsService). Check Vpc NAT gateway defaults for cost before the first deploy.
- Postgres, with pg-boss as the job queue (no Redis initially). S3 landing zone for raw ingested payloads. Secrets Manager for tenant credentials. OTel to Grafana.
- Customer-facing, about 10 users per tenant, mostly US, not mission-critical, no payments. Tenant isolation via a single data-access helper that injects tenant ID. Customer auth provider (Clerk or WorkOS) is TBD.
- Prototype test policy: NO unit tests by default. Playwright happy-path E2E per user journey, plus a permanent two-tenant isolation test. Edge and regression tests only when QA prompts them. Journeys listed in `docs/journeys.md`, one spec file per journey.
- Test harness design: Playwright (Chromium) against `next build` + `next start` with real Postgres; a fixture HTTP server for source APIs (connectors read `SOURCE_API_URL`); one seeded tenant per test; `runSync()` helper to trigger syncs directly; assert on data, not pixels; sign-in via an `E2E_MODE` seam that refuses to boot in production. One command: `pnpm e2e`. Plain CLI/npm scripts, no MCP server.
- Security: the internal CircleCI security orb (https://github.com/ExtensionEngine/pipeline-security-orb) runs on every PR, and security findings BLOCK the merge (required status checks). GitHub Actions run the other gates.
- Auto-merge for small tickets (label `agent-ok`) that pass all gates, enabled only after a baseline (about 10 human-reviewed agent PRs). Kill switch, daily cap, and a weekly digest listing auto-merged PRs.
- Protected paths (agents must not change on the small path; use CODEOWNERS): `.github/**`, `.circleci/**`, `tools/factory/**`, `infra/**`, auth and tenant-isolation code, the data-access helper, DB migrations, `CLAUDE.md`, e2e sign-in seam.
- Agent runs in GitHub Actions via `anthropics/claude-code-action@v1` (verify inputs against its current README). Ticket text is untrusted input. Credentials are split across jobs: prepare (Linear key), agent (Anthropic key, read-only repo token), publish (GitHub App token). The agent never talks to Linear directly; scripts do.
- Small tickets use a cheaper model, large tickets the strongest model. Per-run max turns, daily run cap, 2 fix attempts then `needs-human`.

## Status (2026-11-16)

### Done
- **Repo foundation** (on `main`): `CLAUDE.md`, `.nvmrc` (24), `.gitignore`, `.env.example`, CODEOWNERS, PR template, Linear ticket and bug templates (`docs/templates/`), `docs/journeys.md`.
- **`tools/factory/`** (on `main`): `lib.mjs`, `linear-poll.mjs`, `linear-claim.mjs`, `linear-report.mjs`, `size-guard.mjs` + `guard.config.json` (small path: 5 files, 200 lines, allow/deny globs), `docs-check.mjs`, `run-cost.mjs`. Unit tests for the guard and docs check: `pnpm factory:test`.
- **Agent prompts** (on `main`): `.github/agent/prompts/{rules,small,plan,build,fix}.md`. Agents stop by writing `.agent-run/blocked.md` with a clean tree.
- **Workflows hardened** (on `main`): every action pinned to a commit SHA; `claude-code-action` inputs verified against v1.0.276 and run with `--permission-mode default`; the App token comes from `create-github-app-token` with `client-id`; no `${{ }}` inside shell; a hand-off to `needs-human` also disables auto-merge.
- **GitHub setup:**
  - repo is public (rulesets need it on the free plan);
  - labels created;
  - GitHub App `slop-fest-agent` installed;
  - secrets `ANTHROPIC_API_KEY`, `LINEAR_API_KEY` and `AGENT_APP_PRIVATE_KEY` set;
  - variables: `AGENTS_ENABLED=false`, `AUTOMERGE_ENABLED=false`, `LINEAR_TEAM_KEY=STU`, `AGENT_APP_CLIENT_ID`, `AGENT_APP_SLUG`. The other vars (`AGENT_DAILY_CAP`, `AGENT_MAX_PER_POLL`, `AGENT_MAX_TURNS_*`, `AGENT_MODEL_*`, `AUTOMERGE_DAILY_CAP`) fall back to defaults in the workflows.
- **Ruleset "main protection":**
  - required check `checks` (GitHub Actions), squash merges only, code-owner review required, stale approvals dismissed, 0 required approvals;
  - no deletion or force-push;
  - repo admins can bypass through a PR.
- **Linear:**
  - team key `STU`;
  - labels `agent-ok` and `needs-human`;
  - GitHub integration on.
- **STU-6 app skeleton** (PR #1):
  - pnpm workspaces, TypeScript 6, ESLint 10 flat config;
  - `apps/web`: Next.js 16 App Router, `/api/health` checks the DB;
  - `apps/workers`: pg-boss, queue `sync`;
  - `packages/db` (`@slop/db`): Drizzle schema (`tenants`, `connections`), migrations, `forTenant()`;
  - Playwright `health` journey;
  - CI runs policy, static (typecheck, lint, factory tests) and e2e against Postgres 16, all green.

### Decided since planning
- Database layer: Drizzle ORM on `pg`. Lint: ESLint with typescript-eslint and the Next plugin.
- Node runs TypeScript directly (type stripping): relative imports use `.ts`, no enums or other non-erasable syntax.
- Keep Next.js for now. Express 5 + Vue 3 was considered: a small swap, best done before much UI exists, and NestJS was ruled out because its decorators need a build step.
- Customer auth stays out of the skeleton; the E2E sign-in seam ships with the test harness.
- Deploy is on hold until there is something to show.

### Next
1. **Test harness** (new Linear ticket; touches protected paths, so a human-steered session merged with the admin bypass):
   - `E2E_MODE` sign-in seam in `e2e/support/sign-in.ts` that refuses to boot in production; with no customer auth yet, it signs in to a minimal session stub that real auth replaces later;
   - per-test seeding of one tenant through `forTenant`;
   - fixture HTTP server for connectors (`SOURCE_API_URL`) and a `runSync()` helper;
   - the permanent two-tenant isolation journey (row already in `docs/journeys.md`).
2. **Walking skeleton** built by agents under human review, starting with plan/build mode, then small tickets with `AGENTS_ENABLED=true`.
3. **CircleCI security orb**: add `.circleci/config.yml`, then add its checks to the ruleset as required.
4. **Deploy PR** (on hold): needs a Linear ticket, AWS account and region, a GitHub OIDC IAM role, a Pulumi org and `PULUMI_ACCESS_TOKEN`, a domain, and where deploys run.
5. After about 10 human-reviewed agent PRs: set `AUTOMERGE_ENABLED=true`. Weekly digest still to write.
6. Optional: actionlint in CI.

## Open questions
- Integration auth model: tenant OAuth or API keys. Design connectors to support both.
- Auth provider: Clerk or WorkOS.
- Pulumi state backend: Pulumi Cloud by default.
- CircleCI:
  - whether the orb's build can run without pushing;
  - whether each job reports as its own GitHub check;
  - whether agents get a CircleCI token;
  - CircleCI failures don't trigger `agent-fix.yml`.
- PR pipeline time budget.
- First integrations and reports.
