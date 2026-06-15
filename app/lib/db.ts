import { neon } from "@neondatabase/serverless";

export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const sql = neon(url);
  // neon supports (query, params) at runtime; cast to match parameterized-query callers
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (query: string, params?: unknown[]) => (sql as any)(query, params) as Promise<Record<string, unknown>[]>;
}
