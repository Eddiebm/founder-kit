import { neon } from "@neondatabase/serverless";

export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const sql = neon(url);
  // Use { query, params } object form to force HTTP transport (required for edge runtime)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (query: string, params?: unknown[]) => (sql as any)({ query, params: params ?? [] }) as Promise<Record<string, unknown>[]>;
}
