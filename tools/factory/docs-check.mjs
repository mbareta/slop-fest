#!/usr/bin/env node
// Touching an integration requires touching its doc (rules in guard.config.json "docs").
//
//   node docs-check.mjs --files-json files.json
import { parseArgs } from 'node:util';
import { fail, loadConfig, readJson } from './lib.mjs';
import { docsCheck } from './checks.mjs';

const { values } = parseArgs({ options: { 'files-json': { type: 'string' } } });
if (!values['files-json']) fail('Pass --files-json <path>', 2);

const violations = docsCheck(readJson(values['files-json']), loadConfig().docs ?? []);
if (violations.length) {
  for (const v of violations) console.log(`::error::Docs check: ${v}`);
  process.exit(1);
}
console.log('docs-check: OK');
