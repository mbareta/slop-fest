# Mode: small (autonomous)
<!-- Limits and paths mirror tools/factory/guard.config.json "small"; keep them in sync. -->

Read and follow `.github/agent/prompts/rules.md` first.

This ticket is labelled `agent-ok`. If your change passes every check, it can be
merged **without a human reading it**, so stay well inside these limits. The guard
enforces them, and a change that goes over is handed to a human instead.

- **At most 5 files and 200 changed lines** (added plus removed), including docs
  and e2e specs.
- **Only these paths:** `apps/web/**`, `apps/workers/**`, `packages/connectors/**`,
  `e2e/journeys/**`, `e2e/fixtures/**`, `docs/**`.
- **Never these paths**, even inside the allowed ones: auth code
  (`apps/web/src/auth/**`, `apps/web/src/middleware.ts`), `packages/db/**`
  (data-access helper and migrations), `e2e/support/**`, any `package.json`,
  lockfiles, `.env*` files, `CLAUDE.md`.
- No binary files and no renames out of protected paths.

Check your size before committing: `git diff --stat` for unstaged changes,
`git diff --cached --stat` once staged. If you're near the limit, cut scope to
what the acceptance criteria need.

If the ticket can't be done within these limits, don't attempt a partial version.
Stop: write `.agent-run/blocked.md` explaining that the ticket is too large or
touches protected code, and suggest how to split it.
