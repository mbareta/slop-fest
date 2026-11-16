#!/usr/bin/env node
// Prints a JSON array of ticket IDs that are ready for an autonomous run:
// team TEAM_KEY, label `agent-ok`, state Todo. Highest priority first, then oldest.
//
//   node linear-poll.mjs --limit 2      ->  ["STU-12","STU-15"]
import { parseArgs } from 'node:util';
import { STATES, fail, linear, teamKey } from './lib.mjs';

const { values } = parseArgs({ options: { limit: { type: 'string', default: '2' } } });
const limit = Number(values.limit);
if (!Number.isInteger(limit) || limit < 0) fail(`Invalid --limit: ${values.limit}`, 2);
if (limit === 0) {
  console.log('[]');
  process.exit(0);
}

const data = await linear(
  `query($team: String!, $state: String!) {
    issues(
      first: 50
      filter: {
        team: { key: { eq: $team } }
        state: { name: { eq: $state } }
        labels: { some: { name: { eq: "agent-ok" } } }
      }
    ) {
      nodes { identifier priority createdAt }
    }
  }`,
  { team: teamKey(), state: STATES.todo },
);

// Linear priority: 1 urgent ... 4 low, 0 = none (sort last).
const rank = (p) => (p === 0 ? 5 : p);
const ids = data.issues.nodes
  .sort((a, b) => rank(a.priority) - rank(b.priority) || a.createdAt.localeCompare(b.createdAt))
  .slice(0, limit)
  .map((i) => i.identifier);

console.log(JSON.stringify(ids));
