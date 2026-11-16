// Shared helpers for the factory scripts. Plain Node ESM, no dependencies.
import { appendFileSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const FACTORY_DIR = dirname(fileURLToPath(import.meta.url));

export function fail(message, code = 1) {
  console.error(`::error::${message}`);
  process.exit(code);
}

/** Writes a GitHub Actions step output (multiline-safe). Prints it when run locally. */
export function setOutput(name, value) {
  const str = String(value ?? '');
  const file = process.env.GITHUB_OUTPUT;
  if (!file) {
    console.log(`[output] ${name}=${str}`);
    return;
  }
  const delim = `EOF_${randomBytes(8).toString('hex')}`;
  appendFileSync(file, `${name}<<${delim}\n${str}\n${delim}\n`);
}

export function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

export function loadConfig() {
  return readJson(join(FACTORY_DIR, 'guard.config.json'));
}

// ---------------------------------------------------------------- globs

/** Minimal glob -> RegExp: supports `**`, `*`, `?`. Paths use forward slashes. */
export function globToRegExp(glob) {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*') {
      if (glob[i + 1] === '*') {
        if (glob[i + 2] === '/') {
          re += '(?:.*/)?';
          i += 2;
        } else {
          re += '.*';
          i += 1;
        }
      } else {
        re += '[^/]*';
      }
    } else if (c === '?') {
      re += '[^/]';
    } else {
      re += c.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    }
  }
  return new RegExp(`^${re}$`);
}

export function matchesAny(path, globs) {
  return globs.some((g) => globToRegExp(g).test(path));
}

// ---------------------------------------------------------------- Linear

const LINEAR_URL = process.env.LINEAR_API_URL || 'https://api.linear.app/graphql';

export async function linear(query, variables = {}) {
  const key = process.env.LINEAR_API_KEY;
  if (!key) fail('LINEAR_API_KEY is not set');
  const res = await fetch(LINEAR_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: key },
    body: JSON.stringify({ query, variables }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.errors) {
    const detail = body.errors ? JSON.stringify(body.errors) : `HTTP ${res.status}`;
    throw new Error(`Linear API error: ${detail}`);
  }
  return body.data;
}

export function teamKey() {
  return process.env.TEAM_KEY || 'STU';
}

export function assertTicketId(id) {
  if (!new RegExp(`^${teamKey()}-[0-9]+$`).test(id ?? '')) fail(`Invalid ticket id: ${id}`);
  return id;
}

export const STATES = {
  todo: process.env.LINEAR_TODO_STATE || 'Todo',
  inProgress: process.env.LINEAR_IN_PROGRESS_STATE || 'In Progress',
};

export async function addComment(issueId, body) {
  const data = await linear(
    `mutation($input: CommentCreateInput!) { commentCreate(input: $input) { success } }`,
    { input: { issueId, body } },
  );
  if (!data.commentCreate?.success) throw new Error('commentCreate failed');
}

// ---------------------------------------------------------------- GitHub (gh CLI)

export function gh(args, { json = false } = {}) {
  const out = execFileSync('gh', args, {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  return json ? JSON.parse(out) : out;
}

export function git(args) {
  return execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
}
