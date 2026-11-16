# Mode: build (large ticket, plan approved)

Read and follow `.github/agent/prompts/rules.md` first.

A product owner approved a plan for this ticket. Find it in the ticket comments
in `.agent-run/ticket.md`: it is the latest comment starting with `## Agent plan`.
Comments after it may answer its open questions or change it. Where they
conflict, the later comments win.

- Build what the plan says. If you find the plan is wrong (a file doesn't exist,
  an approach won't work), make the smallest change that keeps the plan's intent,
  and explain it in your final commit message.
- If the plan can't be followed without a decision a human hasn't made, stop and
  write `.agent-run/blocked.md`.
- If there is no approved plan in the comments, stop and write
  `.agent-run/blocked.md` saying so.
- You may change protected paths that **the plan names**. A code owner reviews
  them. Never change `.github/**`, `.circleci/**`, `tools/factory/**`, `infra/**`
  or `CLAUDE.md`, even if the plan says to. Leave those for a human, and list them
  in your final commit message under "Left for a human".
- Every journey the plan names needs a passing e2e spec before you commit.
- No size limit, but a human has to review this. Keep unrelated cleanup out.
