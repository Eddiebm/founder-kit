import { Pool } from "pg";

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    const connectionString = url.replace("sslmode=require", "sslmode=verify-full");
    pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
  }
  return pool;
}

export function getDb() {
  return async (query: string, params?: unknown[]): Promise<Record<string, unknown>[]> => {
    const { rows } = await getPool().query(query, params);
    return rows;
  };
}
