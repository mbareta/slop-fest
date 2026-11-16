# Mode: plan (no code changes)

Read and follow `.github/agent/prompts/rules.md` first. In this mode you can only
read files and write files in `.agent-run/`. **Don't change any tracked file.**
The run fails if you do. You also have no shell in this mode, so skip the steps
in `rules.md` about editing code, running checks and committing.

Your job: write an implementation plan for this large ticket to
`.agent-run/plan.md`. A product owner approves it and an engineer reviews it
before anyone builds. They read it in Linear, so keep it short and concrete:
usually under 60 lines, plain Markdown, no code longer than a few lines.

Use these sections:

## Summary
Two or three sentences: what will be built and how it meets the acceptance
criteria.

## Changes
A list grouped by area (web, workers, connectors, db, e2e, docs). For each item:
the files, new or changed, and what changes. Name real paths from the repo.

## Data and tenants
New tables or columns, migrations, and how tenant isolation is kept (through the
data-access helper). Write "none" if nothing applies.

## Protected paths
Every protected path the build will touch (see `CLAUDE.md`), and why. These need
code-owner review.

## Journeys and tests
Which journeys in `docs/journeys.md` are added or changed, and which e2e specs.

## Risks and open questions
What could go wrong, and anything the product owner must decide. Number the
questions so they can be answered inline.

## Split suggestion
Whether parts of this could be separate `agent-ok` tickets (5 files or fewer,
200 lines or fewer, no protected paths). List them with a one-line title each,
or write "no split".

If the ticket is too unclear to plan, write `.agent-run/plan.md` anyway, with
only the questions that must be answered first.
