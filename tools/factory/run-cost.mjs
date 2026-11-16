#!/usr/bin/env node
// Summarizes an agent run's cost from claude-code-action's execution file
// (a JSON array, or JSON lines, of SDK messages; the final `result` message
// carries the totals). Prints Markdown for $GITHUB_STEP_SUMMARY.
//
//   node run-cost.mjs out/execution.json >> "$GITHUB_STEP_SUMMARY"
import { readFileSync } from 'node:fs';
import { fail } from './lib.mjs';

const path = process.argv[2];
if (!path) fail('Usage: run-cost.mjs <execution.json>', 2);

const raw = readFileSync(path, 'utf8').trim();
let messages;
try {
  const parsed = JSON.parse(raw);
  messages = Array.isArray(parsed) ? parsed : [parsed];
} catch {
  messages = raw.split('\n').filter(Boolean).map((l) => JSON.parse(l));
}

const result = messages.findLast((m) => m?.type === 'result');
if (!result) {
  console.log('### Agent run cost\n\nNo result message in the execution log.');
  process.exit(0);
}

const u = result.usage ?? {};
const num = (n) => (typeof n === 'number' ? n.toLocaleString('en-US') : 'n/a');
const model = messages.find((m) => m?.type === 'system' && m.model)?.model ?? 'n/a';

console.log(`### Agent run cost

| | |
|---|---|
| Model | ${model} |
| Outcome | ${result.subtype ?? 'n/a'}${result.is_error ? ' (error)' : ''} |
| Cost (USD) | ${typeof result.total_cost_usd === 'number' ? `$${result.total_cost_usd.toFixed(2)}` : 'n/a'} |
| Turns | ${num(result.num_turns)} |
| Duration | ${typeof result.duration_ms === 'number' ? `${Math.round(result.duration_ms / 1000)}s` : 'n/a'} |
| Input tokens | ${num(u.input_tokens)} |
| Cache read / write | ${num(u.cache_read_input_tokens)} / ${num(u.cache_creation_input_tokens)} |
| Output tokens | ${num(u.output_tokens)} |
`);
