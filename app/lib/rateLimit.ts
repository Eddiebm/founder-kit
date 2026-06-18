import { getDb } from "./db";

function getIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function checkRateLimit(
  request: Request,
  endpoint: string,
  limit: number,
  windowSecs: number
): Promise<{ allowed: boolean; retryAfter: number }> {
  const ip = getIp(request);
  const window = Math.floor(Date.now() / (windowSecs * 1000));
  const key = `${ip}:${endpoint}:${window}`;

  const db = getDb();
  await db(`
    CREATE TABLE IF NOT EXISTS rate_limit_buckets (
      key TEXT PRIMARY KEY,
      count INT NOT NULL DEFAULT 1,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const [row] = await db(
    `INSERT INTO rate_limit_buckets (key, count)
     VALUES ($1, 1)
     ON CONFLICT (key) DO UPDATE SET count = rate_limit_buckets.count + 1
     RETURNING count`,
    [key]
  ) as [{ count: number }];

  const windowEndsAt = (window + 1) * windowSecs;
  const retryAfter = Math.ceil(windowEndsAt - Date.now() / 1000);

  return { allowed: row.count <= limit, retryAfter };
}
