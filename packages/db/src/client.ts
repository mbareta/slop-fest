import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.ts';

export function createDb(url = process.env.DATABASE_URL) {
  if (!url) throw new Error('DATABASE_URL is not set');
  const pool = new pg.Pool({ connectionString: url, max: 10 });
  return drizzle({ client: pool, schema, casing: 'snake_case' });
}

export type Db = ReturnType<typeof createDb>;
