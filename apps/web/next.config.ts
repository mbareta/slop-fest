import type { NextConfig } from 'next';

const config: NextConfig = {
  // Self-contained server bundle for the container image (deploy PR).
  output: 'standalone',
  // Workspace packages ship TypeScript source.
  transpilePackages: ['@slop/db'],
  poweredByHeader: false,
};

export default config;
