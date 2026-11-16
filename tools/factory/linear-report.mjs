#!/usr/bin/env node
// Posts an agent-run update to the Linear ticket.
//
//   node linear-report.mjs --ticket STU-123 --kind plan|pr|failed|needs-human|blocked \
//     [--file path] [--url <pr url>] --run-url <url>
//
// plan        : posts the plan (--file) for the product owner to approve
// pr          : posts the PR link (--url)
// failed      : the agent run failed
// blocked     : the agent stopped itself (--file is its blocked.md)
// needs-human : the guard blocked the change (--file has the reasons)
//               Both also add the `needs-human` label to the ticket if the
//               workspace has one
//
// Env: LINEAR_API_KEY, TEAM_KEY.
import { readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { addComment, assertTicketId, fail, linear } from './lib.mjs';

const { values: args } = parseArgs({
  options: {
    ticket: { type: 'string' },
    kind: { type: 'string' },
    file: { type: 'string' },
    url: { type: 'string' },
    'run-url': { type: 'string', default: '' },
  },
});

const ticket = assertTicketId(args.ticket);
const MAX = 50_000;
const readFile = () => {
  if (!args.file) fail(`--kind ${args.kind} needs --file`, 2);
  const text = readFileSync(args.file, 'utf8');
  return text.length > MAX ? `${text.slice(0, MAX)}\n\n[truncated]` : text;
};
const run = args['run-url'] ? `\n\nAgent run: ${args['run-url']}` : '';

let body;
switch (args.kind) {
  case 'plan':
    body = `## Agent plan\n\n${readFile()}\n\n---\nApprove by commenting here, then an engineer starts \`build\` mode.${run}`;
    break;
  case 'pr':
    if (!args.url) fail('--kind pr needs --url', 2);
    body = `Agent opened a PR: ${args.url}${run}`;
    break;
  case 'failed':
    body = `Agent run failed. An engineer should take a look.${run}`;
    break;
  case 'needs-human':
    body = `Agent change was blocked by the small-ticket guard and needs a human:\n\n\`\`\`\n${readFile()}\n\`\`\`${run}`;
    break;
  case 'blocked':
    body = `Agent stopped and needs a human:\n\n${readFile()}${run}`;
    break;
  default:
    fail(`Invalid --kind: ${args.kind}`, 2);
}

const { issue } = await linear(`query($id: String!) { issue(id: $id) { id } }`, { id: ticket });
if (!issue) fail(`Ticket not found: ${ticket}`);
await addComment(issue.id, body);

if (args.kind === 'needs-human' || args.kind === 'blocked') {
  try {
    const { issueLabels } = await linear(
      `query { issueLabels(first: 1, filter: { name: { eq: "needs-human" } }) { nodes { id } } }`,
    );
    const labelId = issueLabels.nodes[0]?.id;
    if (labelId) {
      await linear(
        `mutation($id: String!, $labelId: String!) {
          issueUpdate(id: $id, input: { addedLabelIds: [$labelId] }) { success }
        }`,
        { id: issue.id, labelId },
      );
    } else {
      console.log('No needs-human label in Linear; skipped labelling.');
    }
  } catch (err) {
    console.log(`::warning::Could not add needs-human label: ${err.message}`);
  }
}
console.log(`Reported ${args.kind} on ${ticket}`);
