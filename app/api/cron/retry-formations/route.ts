export const runtime = "nodejs";

import { getDb } from "@/lib/db";

/**
 * GET /api/cron/retry-formations
 *
 * Retries failed formation orders that have not exceeded the retry cap (3 attempts).
 * Runs every hour via Vercel cron.
 *
 * Also alerts on orders stuck at payment_complete / paid with no filing activity
 * for more than 15 minutes — these indicate a webhook delivery failure.
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://myfounderkit.com";
  const adminSecret = process.env.AUDIT_SECRET;
  if (!adminSecret) {
    console.error("AUDIT_SECRET not set — cannot retry formations");
    return Response.json({ error: "AUDIT_SECRET not set" }, { status: 500 });
  }

  const results = { retried: 0, stuck: 0, errors: 0 };

  // ── Retry failed orders (up to 3 total attempts) ─────────────────────────────
  const failedRows = await db(
    `SELECT id, company_name, email, retry_count
     FROM formation_orders
     WHERE status = 'failed'
       AND retry_count < 3
       AND updated_at > NOW() - INTERVAL '7 days'`
  ) as { id: string; company_name: string; email: string; retry_count: number }[];

  for (const row of failedRows) {
    try {
      // Reset to paid so the file route will reprocess
      await db(
        "UPDATE formation_orders SET status = 'paid', updated_at = NOW() WHERE id = $1",
        [row.id]
      );

      const res = await fetch(`${appUrl}/api/delaware/file`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-secret": adminSecret },
        body: JSON.stringify({ orderId: row.id }),
      });

      if (!res.ok) {
        console.error(`Retry failed for order ${row.id}:`, await res.text());
        results.errors++;
      } else {
        results.retried++;
      }
    } catch (err) {
      console.error("Retry error for order", row.id, err);
      results.errors++;
    }
  }

  // ── Detect stuck paid orders (webhook never fired) ───────────────────────────
  const stuckRows = await db(
    `SELECT id, company_name, email
     FROM formation_orders
     WHERE status IN ('paid', 'payment_complete')
       AND updated_at < NOW() - INTERVAL '15 minutes'`
  ) as { id: string; company_name: string; email: string }[];

  for (const row of stuckRows) {
    results.stuck++;
    console.error(`Stuck order detected: ${row.id} (${row.company_name}, ${row.email})`);

    // Trigger filing directly — idempotent, safe to re-call
    try {
      await fetch(`${appUrl}/api/delaware/file`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-secret": adminSecret },
        body: JSON.stringify({ orderId: row.id }),
      });
    } catch (err) {
      console.error("Stuck order trigger error for", row.id, err);
      results.errors++;
    }
  }

  console.log("retry-formations:", results);
  return Response.json(results);
}
