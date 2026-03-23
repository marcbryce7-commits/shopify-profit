import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

function createDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not set. Please configure your database connection."
    );
  }
  const client = postgres(process.env.DATABASE_URL, { prepare: false });
  return drizzle(client, { schema });
}

// Lazy singleton — only created when first accessed at runtime
let _db: ReturnType<typeof createDb> | null = null;

export function getDb() {
  if (!_db) {
    _db = createDb();
  }
  return _db;
}

// For convenience — throws at runtime if DATABASE_URL missing, not at import time
export const db = new Proxy({} as ReturnType<typeof createDb>, {
  get(_, prop) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export type DB = ReturnType<typeof createDb>;
