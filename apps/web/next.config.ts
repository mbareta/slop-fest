import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { NextConfig } from 'next';

// One .env at the repo root serves every app and script. Next runs with
// apps/web as its working directory. Variables already set in the environment
// (CI, Playwright, production) win over the file.
const rootEnv = resolve(process.cwd(), '../../.env');
if (existsSync(rootEnv)) process.loadEnvFile(rootEnv);

const config: NextConfig = {
  // Self-contained server bundle for the container image (deploy PR).
  output: 'standalone',
  // Workspace packages ship TypeScript source.
  transpilePackages: ['@slop/db'],
  poweredByHeader: false,
};

export default config;
