// The e2e sign-in seam is on only when E2E_MODE=1, and never in production.
// APP_ENV, not NODE_ENV, marks production: e2e runs `next start`, which sets
// NODE_ENV=production too.
//
// Protected path: changes need code-owner review.

/** Throws if E2E_MODE is on in production. Called at server start and on every seam request. */
export function assertE2eModeAllowed(): void {
  if (process.env.E2E_MODE && process.env.APP_ENV === 'production') {
    throw new Error('E2E_MODE must not be set when APP_ENV=production. Refusing to start.');
  }
}

export function e2eModeEnabled(): boolean {
  assertE2eModeAllowed();
  return process.env.E2E_MODE === '1';
}
