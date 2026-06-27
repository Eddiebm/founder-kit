export const runtime = "nodejs";

import { getDb } from "@/lib/db";
import { GRANT_PROGRAMS } from "@/lib/grants";

async function ensureTable(db: ReturnType<typeof getDb>) {
  await db(`
    CREATE TABLE IF NOT EXISTS grant_overrides (
      grant_id TEXT PRIMARY KEY,
      is_active BOOLEAN NOT NULL DEFAULT true,
      deadline TEXT,
      last_verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_status_code INT,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  await ensureTable(db);

  const results: { id: string; status: number; active: boolean }[] = [];

  for (const grant of GRANT_PROGRAMS) {
    try {
      const res = await fetch(grant.url, {
        method: "HEAD",
        redirect: "follow",
        signal: AbortSignal.timeout(8000),
      });
      const active = res.status < 400;
      await db(
        `INSERT INTO grant_overrides (grant_id, is_active, last_verified_at, last_status_code, updated_at)
         VALUES ($1, $2, NOW(), $3, NOW())
         ON CONFLICT (grant_id) DO UPDATE
         SET is_active = $2, last_verified_at = NOW(), last_status_code = $3, updated_at = NOW()`,
        [grant.id, active, res.status]
      );
      results.push({ id: grant.id, status: res.status, active });
    } catch {
      await db(
        `INSERT INTO grant_overrides (grant_id, is_active, last_verified_at, last_status_code, updated_at)
         VALUES ($1, true, NOW(), NULL, NOW())
         ON CONFLICT (grant_id) DO UPDATE
         SET last_verified_at = NOW(), updated_at = NOW()`,
        [grant.id]
      );
      results.push({ id: grant.id, status: 0, active: true });
    }
  }

  const inactive = results.filter((r) => !r.active);
  console.log(`GRANT_REFRESH: ${results.length} checked, ${inactive.length} inactive`);

  return Response.json({
    checked: results.length,
    inactive: inactive.length,
    inactiveIds: inactive.map((r) => r.id),
  });
}
