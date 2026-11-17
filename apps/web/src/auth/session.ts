// Session stub: a signed cookie that names the signed-in user's tenant.
// There is no customer auth yet; the real provider (Clerk or WorkOS) replaces
// how sessions are created, and getSession() keeps its shape.
//
// Protected path: changes need code-owner review.
import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

export type Session = { tenantId: string; userId: string };

export const SESSION_COOKIE = 'slop_session';
export const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;

function secret(): string {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error('SESSION_SECRET must be set (32 characters or more)');
  return value;
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('base64url');
}

/** Cookie value for a session: base64url(JSON) + "." + HMAC. */
export function encodeSession(session: Session): string {
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS;
  const payload = Buffer.from(JSON.stringify({ ...session, exp })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

export function decodeSession(value: string | undefined): Session | null {
  if (!value || !process.env.SESSION_SECRET) return null;
  const [payload, mac] = value.split('.');
  if (!payload || !mac) return null;
  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(mac);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (typeof data.tenantId !== 'string' || typeof data.userId !== 'string') return null;
    if (typeof data.exp !== 'number' || data.exp < Date.now() / 1000) return null;
    return { tenantId: data.tenantId, userId: data.userId };
  } catch {
    return null;
  }
}

/** The current request's session, or null when nobody is signed in. */
export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  return decodeSession(jar.get(SESSION_COOKIE)?.value);
}
