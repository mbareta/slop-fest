// E2E sign-in seam: POST { tenantId, userId? } signs the browser in to that
// tenant without real auth. Answers 404 unless E2E_MODE=1 (see e2e-mode.ts).
// Mounted at /api/e2e/sign-in; used by e2e/support/sign-in.ts.
//
// Protected path: changes need code-owner review.
import 'server-only';
import { eq } from 'drizzle-orm';
import { schema } from '@slop/db';
import { getDb } from '@/lib/db';
import { e2eModeEnabled } from './e2e-mode';
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, encodeSession } from './session';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request): Promise<Response> {
  if (!e2eModeEnabled()) return new Response('Not found', { status: 404 });

  const body = await request.json().catch(() => null);
  const tenantId = body?.tenantId;
  const userId = typeof body?.userId === 'string' && body.userId ? body.userId : 'e2e-user';
  if (typeof tenantId !== 'string' || !UUID.test(tenantId)) {
    return Response.json({ error: 'tenantId must be a UUID' }, { status: 400 });
  }

  const [tenant] = await getDb()
    .select({ id: schema.tenants.id })
    .from(schema.tenants)
    .where(eq(schema.tenants.id, tenantId));
  if (!tenant) return Response.json({ error: 'Unknown tenant' }, { status: 404 });

  const res = Response.json({ tenantId, userId });
  res.headers.append(
    'Set-Cookie',
    `${SESSION_COOKIE}=${encodeSession({ tenantId, userId })}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE_SECONDS}`,
  );
  return res;
}
