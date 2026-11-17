import { assertE2eModeAllowed } from '@/auth/e2e-mode';

/**
 * Runs once when the server starts. Refuses to boot with the e2e seam on in
 * production: Next.js would otherwise keep running and fail every request.
 */
export function register() {
  try {
    assertE2eModeAllowed();
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    if (process.env.NEXT_RUNTIME === 'nodejs') process.exit(1);
    throw err;
  }
}
