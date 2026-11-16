// Pure check logic for size-guard and docs-check (unit-tested in test/).
import { globToRegExp, matchesAny } from './lib.mjs';

/**
 * A changed file:
 *   { path, additions, deletions, status?, previous_path? }
 * additions/deletions are null for binary files.
 */

/** Parses `git diff --numstat -z --no-renames` output. */
export function parseNumstat(out) {
  return out
    .split('\0')
    .filter(Boolean)
    .map((rec) => {
      const [add, del, ...rest] = rec.split('\t');
      return {
        path: rest.join('\t'),
        additions: add === '-' ? null : Number(add),
        deletions: del === '-' ? null : Number(del),
      };
    });
}

/** Returns a list of human-readable violations (empty = OK). */
export function sizeGuard(files, rules) {
  const violations = [];
  let lines = 0;

  for (const f of files) {
    // A rename must be allowed at both ends, or protected files could be moved out.
    const paths = [f.path, f.previous_path].filter(Boolean);
    for (const p of paths) {
      if (matchesAny(p, rules.deny)) violations.push(`protected path: ${p}`);
      else if (!matchesAny(p, rules.allow)) violations.push(`path not on the small-ticket allowlist: ${p}`);
    }
    if (f.additions == null || f.deletions == null) {
      violations.push(`binary file not allowed on small tickets: ${f.path}`);
    } else {
      lines += f.additions + f.deletions;
    }
  }

  if (files.length > rules.maxFiles) {
    violations.push(`too many files: ${files.length} (max ${rules.maxFiles})`);
  }
  if (lines > rules.maxLines) {
    violations.push(`too many changed lines: ${lines} (max ${rules.maxLines})`);
  }
  return { violations, files: files.length, lines };
}

/** Touching an integration requires touching its doc. Returns violations. */
export function docsCheck(files, docRules) {
  const touched = new Set(files.filter((f) => f.status !== 'removed').map((f) => f.path));
  const violations = [];

  for (const rule of docRules) {
    const [prefix, suffix] = rule.source.split('{name}');
    const re = new RegExp(
      `^${globToRegExp(prefix).source.slice(1, -1)}([^/]+)${globToRegExp(suffix).source.slice(1, -1)}$`,
    );
    const names = new Map(); // name -> all changes are removals?
    for (const f of files) {
      const m = re.exec(f.path);
      if (!m) continue;
      const removedOnly = (names.get(m[1]) ?? true) && f.status === 'removed';
      names.set(m[1], removedOnly);
    }
    for (const [name, removedOnly] of names) {
      if (removedOnly) continue; // whole integration deleted: doc not required
      const doc = rule.doc.replace('{name}', name);
      if (!touched.has(doc)) violations.push(`changed ${rule.source.replace('{name}', name)} but not ${doc}`);
    }
  }
  return violations;
}
