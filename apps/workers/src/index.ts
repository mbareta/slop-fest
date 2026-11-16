// Ingestion worker. Runs pg-boss on the app's Postgres (no Redis).
// Start with `pnpm --filter @slop/workers start` (Node runs the TypeScript directly).
import { PgBoss } from 'pg-boss';

export const QUEUES = {
  /** Pull one connection's data from its source. Data: { tenantId, connectionId }. */
  sync: 'sync',
} as const;

type SyncJob = { tenantId: string; connectionId: string };

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');

const boss = new PgBoss(url);
boss.on('error', (err) => console.error('pg-boss error', err));

await boss.start();
await boss.createQueue(QUEUES.sync);

await boss.work<SyncJob>(QUEUES.sync, async (jobs) => {
  for (const job of jobs) {
    // Placeholder until the first connector lands: fetch -> S3 landing zone -> normalize.
    console.log(`sync job ${job.id}: tenant ${job.data.tenantId}, connection ${job.data.connectionId}`);
  }
});

console.log('worker started');

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, async () => {
    console.log(`${signal}: stopping worker`);
    await boss.stop({ graceful: true });
    process.exit(0);
  });
}
