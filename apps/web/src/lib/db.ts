import 'server-only';
import { createDb, type Db } from '@slop/db';

// Created on first use, not at import time, so `next build` works without a database.
let db: Db | undefined;

export function getDb(): Db {
  db ??= createDb();
  return db;
}
