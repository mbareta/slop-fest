# Software Factory: handoff to Claude Code

Context: this repo is a new prototype that aggregates data from multiple sources and shows charts and reports to external customers. It is built with a "software factory" process: Linear tickets, AI agents that open PRs, CI gates, auto-merge for small tickets. This file summarizes decisions made in a planning chat. The full plan is the "Software Factory: Implementation Plan" doc (shared by the user).

## Roles
CEO (reads Linear and a weekly digest only), product owner (writes tickets, sets size, approves plans), engineer (prompts for large tickets, reviews PRs, owns gates), QA (acceptance scenarios, bug reports, no routine manual testing). Agents turn tickets into PRs.

## Decisions
- Node.js and TypeScript everywhere. Monorepo: `apps/web` (Next.js dashboard + API), `apps/workers` (ingestion), `packages/connectors/*` (each exposes `auth`, `fetch`, `normalize`), `infra/`, `e2e/`, `docs/`, `tools/factory/`, `.github/`, `.circleci/`, `CLAUDE.md`.
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

## Already written (drafts, never run)
Five workflows in `.github/workflows/`: `ci.yml`, `agent-poll.yml`, `agent-run.yml`, `agent-fix.yml`, `automerge.yml`.

## To write next
1. Guardrails: branch protection (required checks: `checks` + CircleCI jobs), CODEOWNERS, labels (`agent-ok`, `agent-authored`, `needs-human`, `agent-fix-1`, `agent-fix-2`), GitHub App for the agent, repo variables/secrets (see workflow headers: `AGENTS_ENABLED`, `AUTOMERGE_ENABLED`, `LINEAR_TEAM_KEY`, `AGENT_APP_CLIENT_ID`, `AGENT_APP_SLUG`; secrets `ANTHROPIC_API_KEY`, `LINEAR_API_KEY`, `AGENT_APP_PRIVATE_KEY`).
2. `tools/factory/` (plain Node ESM, zero dependencies, built-in fetch):
   - `linear-poll.mjs`: print JSON array of eligible ticket IDs (label `agent-ok`, state Todo).
   - `linear-claim.mjs`: claim ticket (Todo to In Progress, comment run link), write `.agent-run/ticket.md`; step outputs `skipped`, `branch`, `base_ref`, `title`, `url`; in fix mode fetch the failed run's log instead.
   - `linear-report.mjs`: post plan / PR link / failed / needs-human comments to Linear.
   - `size-guard.mjs` + `guard.config.json`: path allowlist and diff cap (about 200 lines, 5 files), exit non-zero on violation; supports `--files-json` and `--base`.
   - `docs-check.mjs`: touching an integration requires touching its doc.
   - `run-cost.mjs`: summarize cost from the execution log.
3. Agent prompts: `.github/agent/prompts/{small,plan,build,fix}.md`.
4. `CLAUDE.md` v1 (short: layout, commands, tenant rule, doc rule, protected paths), Linear ticket and bug templates, PR template, `.nvmrc`.
5. App skeleton and deploy path (hello world through the full pipeline), then the test harness, then a walking skeleton built by agents under human review.

## Open questions
Integration auth model (tenant OAuth vs API keys; design connectors to support both), auth provider, Pulumi state backend (default Pulumi Cloud), whether the orb's build can run without pushing, whether each CircleCI job reports as its own GitHub check, PR pipeline time budget, whether agents get a CircleCI token, Linear team key, first integrations and reports.

## Things to verify in the workflow drafts
`claude-code-action` input/output names, `--allowedTools` pattern syntax, pin actions to SHAs, approving-review requirement vs auto-merge, CircleCI failures not visible to `agent-fix.yml`.
