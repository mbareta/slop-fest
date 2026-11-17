import 'server-only';
import { eq } from 'drizzle-orm';
import { schema } from '@slop/db';
import { getSession } from '@/auth/session';
import { getDb } from '@/lib/db';

/** The signed-in user's tenant, or null when nobody is signed in. */
export async function getCurrentTenant(): Promise<{ id: string; name: string } | null> {
  const session = await getSession();
  if (!session) return null;
  const [tenant] = await getDb()
    .select({ id: schema.tenants.id, name: schema.tenants.name })
    .from(schema.tenants)
    .where(eq(schema.tenants.id, session.tenantId));
  return tenant ?? null;
}
