import { neon } from "@neondatabase/serverless";

export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const sql = neon(url);

  // Convert (query, params) → tagged template literal call so neon uses HTTP transport
  return (query: string, params?: unknown[]): Promise<Record<string, unknown>[]> => {
    const values = params ?? [];
    if (values.length === 0) {
      return sql([query] as unknown as TemplateStringsArray) as Promise<Record<string, unknown>[]>;
    }
    // Split on $1, $2, … to rebuild the template strings array
    const parts = query.split(/\$\d+/);
    return sql(parts as unknown as TemplateStringsArray, ...values) as Promise<Record<string, unknown>[]>;
  };
}
