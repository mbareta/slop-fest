#!/usr/bin/env node
// Small-ticket guard: path allowlist/denylist and a diff cap.
//
//   node size-guard.mjs --mode small --files-json files.json   # files from the GitHub API
//   node size-guard.mjs --mode small --base origin/main         # files from git (base...HEAD)
//
// files.json: [{ path, additions, deletions, status, previous_path? }]
// Exit 0 = OK, 1 = violation, 2 = usage error.
import { parseArgs } from 'node:util';
import { fail, git, loadConfig, readJson } from './lib.mjs';
import { parseNumstat, sizeGuard } from './checks.mjs';

const { values } = parseArgs({
  options: {
    mode: { type: 'string', default: 'small' },
    'files-json': { type: 'string' },
    base: { type: 'string' },
  },
});

const rules = loadConfig()[values.mode];
if (!rules?.allow) fail(`Unknown guard mode: ${values.mode}`, 2);

let files;
if (values['files-json']) {
  files = readJson(values['files-json']);
} else if (values.base) {
  files = parseNumstat(git(['diff', '--numstat', '-z', '--no-renames', `${values.base}...HEAD`]));
} else {
  fail('Pass --files-json <path> or --base <ref>', 2);
}

const result = sizeGuard(files, rules);
console.log(`size-guard (${values.mode}): ${result.files} files, ${result.lines} changed lines`);
if (result.violations.length) {
  console.log('Blocked:');
  for (const v of result.violations) console.log(`- ${v}`);
  process.exit(1);
}
console.log('OK');
