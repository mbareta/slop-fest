// The single data-access path for tenant data. Every query built here is
// scoped to one tenant: reads, updates and deletes always filter on
// tenant_id, and inserts always set it. Don't query tenant tables any other way.
//
// Protected path: changes need code-owner review.
import { and, eq, type SQL } from 'drizzle-orm';
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core';
import type { Db } from './client.ts';

/** A table whose rows belong to one tenant. */
export type TenantTable = PgTable & { tenantId: PgColumn };

type Values<T extends TenantTable> = Omit<T['$inferInsert'], 'tenantId'>;

export function forTenant(db: Db, tenantId: string) {
  if (!tenantId) throw new Error('forTenant: tenantId is required');
  const scoped = (table: TenantTable, where?: SQL) => and(eq(table.tenantId, tenantId), where);

  return {
    tenantId,

    select<T extends TenantTable>(table: T, where?: SQL) {
      return db.select().from(table as PgTable).where(scoped(table, where)) as Promise<T['$inferSelect'][]>;
    },

    insert<T extends TenantTable>(table: T, values: Values<T> | Values<T>[]) {
      const rows = (Array.isArray(values) ? values : [values]).map((v) => ({ ...v, tenantId }));
      return db.insert(table).values(rows as T['$inferInsert'][]).returning() as Promise<T['$inferSelect'][]>;
    },

    update<T extends TenantTable>(table: T, set: Partial<Values<T>>, where?: SQL) {
      // Never let a caller move a row to another tenant.
      const { tenantId: _ignored, ...safe } = set as Partial<T['$inferInsert']> & { tenantId?: unknown };
      return db
        .update(table)
        .set(safe as Partial<T['$inferInsert']>)
        .where(scoped(table, where))
        .returning() as Promise<T['$inferSelect'][]>;
    },

    delete<T extends TenantTable>(table: T, where?: SQL) {
      return db.delete(table).where(scoped(table, where)).returning() as Promise<T['$inferSelect'][]>;
    },
  };
}

export type TenantDb = ReturnType<typeof forTenant>;
