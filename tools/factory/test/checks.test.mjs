// The guards decide what may auto-merge, so they get tests even on a prototype.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { globToRegExp, loadConfig } from '../lib.mjs';
import { docsCheck, parseNumstat, sizeGuard } from '../checks.mjs';

const config = loadConfig();
const small = config.small;
const f = (path, additions = 10, deletions = 0, extra = {}) => ({ path, additions, deletions, ...extra });

test('globToRegExp', () => {
  assert.ok(globToRegExp('.github/**').test('.github/workflows/ci.yml'));
  assert.ok(!globToRegExp('.github/**').test('x.github/a'));
  assert.ok(globToRegExp('**/package.json').test('package.json'));
  assert.ok(globToRegExp('**/package.json').test('apps/web/package.json'));
  assert.ok(globToRegExp('apps/*/x.ts').test('apps/web/x.ts'));
  assert.ok(!globToRegExp('apps/*/x.ts').test('apps/web/src/x.ts'));
});

test('small change on allowed paths passes', () => {
  const r = sizeGuard([f('apps/web/src/app/page.tsx'), f('docs/journeys.md')], small);
  assert.deepEqual(r.violations, []);
});

test('protected paths are blocked even inside allowed trees', () => {
  for (const p of [
    '.github/workflows/ci.yml',
    'tools/factory/size-guard.mjs',
    'CLAUDE.md',
    'apps/web/src/auth/session.ts',
    'apps/web/package.json',
    'pnpm-lock.yaml',
    'apps/web/.env.local',
    'packages/db/migrations/001.sql',
    'e2e/support/sign-in.ts',
  ]) {
    assert.match(sizeGuard([f(p)], small).violations.join(), /protected path/, p);
  }
});

test('paths outside the allowlist are blocked', () => {
  assert.match(sizeGuard([f('README.md')], small).violations.join(), /allowlist/);
});

test('renames are checked at both ends', () => {
  const r = sizeGuard([f('apps/web/src/x.ts', 0, 0, { previous_path: 'tools/factory/lib.mjs' })], small);
  assert.match(r.violations.join(), /protected path: tools\/factory\/lib.mjs/);
});

test('caps on files and lines', () => {
  const many = Array.from({ length: 6 }, (_, i) => f(`apps/web/src/f${i}.ts`, 1));
  assert.match(sizeGuard(many, small).violations.join(), /too many files/);
  assert.match(sizeGuard([f('apps/web/a.ts', 150, 51)], small).violations.join(), /too many changed lines: 201/);
  assert.deepEqual(sizeGuard([f('apps/web/a.ts', 150, 50)], small).violations, []);
});

test('binary files are blocked', () => {
  assert.match(sizeGuard([f('apps/web/public/x.png', null, null)], small).violations.join(), /binary/);
});

test('parseNumstat', () => {
  assert.deepEqual(parseNumstat('3\t1\tapps/a.ts\0-\t-\tlogo.png\0'), [
    { path: 'apps/a.ts', additions: 3, deletions: 1 },
    { path: 'logo.png', additions: null, deletions: null },
  ]);
});

test('docs check', () => {
  const rules = config.docs;
  assert.deepEqual(docsCheck([f('apps/web/a.ts')], rules), []);
  assert.match(
    docsCheck([f('packages/connectors/stripe/src/fetch.ts')], rules).join(),
    /docs\/integrations\/stripe.md/,
  );
  assert.deepEqual(
    docsCheck([f('packages/connectors/stripe/src/fetch.ts'), f('docs/integrations/stripe.md')], rules),
    [],
  );
  // Removing the doc does not count as touching it.
  assert.equal(
    docsCheck(
      [f('packages/connectors/stripe/a.ts'), f('docs/integrations/stripe.md', 0, 5, { status: 'removed' })],
      rules,
    ).length,
    1,
  );
  // Deleting a whole integration does not require its doc.
  assert.deepEqual(docsCheck([f('packages/connectors/old/a.ts', 0, 9, { status: 'removed' })], rules), []);
});
