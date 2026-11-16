import { sql } from 'drizzle-orm';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

/** Liveness and database reachability, for the load balancer and the e2e smoke journey. */
export async function GET() {
  try {
    await getDb().execute(sql`select 1`);
    return Response.json({ status: 'ok', db: 'ok' });
  } catch (err) {
    console.error('health: database check failed', err);
    return Response.json({ status: 'error', db: 'unreachable' }, { status: 503 });
  }
}
