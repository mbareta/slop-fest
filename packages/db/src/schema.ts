import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

// Tenants are the only table without a tenant_id. Every other table that holds
// customer data has a `tenantId` column and is read and written only through
// `forTenant()` in tenant.ts.

export const tenants = pgTable('tenants', {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

/** A data source a tenant has connected (one row per integration). */
export const connections = pgTable(
  'connections',
  {
    id: uuid().primaryKey().defaultRandom(),
    tenantId: uuid()
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    provider: text().notNull(),
    displayName: text().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index().on(t.tenantId)],
);
