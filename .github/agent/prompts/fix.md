# Mode: fix (repair a failing agent PR)

Read and follow `.github/agent/prompts/rules.md` first.

You're on the head branch of an open agent PR whose checks failed. The failing
checks' log is in `.agent-run/failure.log` (the last few hundred lines). This is
fix attempt 1 or 2. After 2 attempts, a human takes over.

1. Read the log and find the first real error, not the noise after it.
2. See what the PR changed with `git diff origin/<default>...HEAD`. The default
   branch is listed in `.agent-run/ticket.md`. Then reproduce the error locally
   with the matching command (`pnpm typecheck`, `pnpm lint` or
   `pnpm e2e <spec>`).
3. Fix the cause in the PR's own code. Keep the fix small and within the
   ticket's scope.
4. Don't delete, skip or loosen tests, lint rules or type checks to get green.
   Change a test's expectation only when the ticket clearly changed that
   behaviour.
5. Re-run the failing command until it passes, then commit with the message
   `<TICKET-ID>: fix <what>`.

If the ticket is labelled `agent-ok`, the whole PR, including your fix, must
still fit the small-ticket limits in `.github/agent/prompts/small.md`.

Stop and write `.agent-run/blocked.md` instead of changing code when:
- the failure isn't caused by this PR (flaky test, infrastructure, a failure
  that's also on the default branch);
- the log names a check you can't run here (for example a security scan);
  describe the finding;
- the only fix would touch a protected path or add a dependency.
