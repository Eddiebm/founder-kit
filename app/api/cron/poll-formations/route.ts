export const runtime = "nodejs";

import { getDb } from "@/lib/db";
import { getFilingStatus } from "@/lib/delaware";
import { getEinStatus } from "@/lib/ein";

/**
 * GET /api/cron/poll-formations
 *
 * Polls DE SOS and EIN provider for status updates on in-flight formation orders.
 * Runs every 30 minutes via Vercel cron.
 *
 * Orders polled:
 *   - filing_submitted  → poll DE SOS for approval/rejection
 *   - ein_pending       → poll EIN provider for EIN issuance
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://myfounderkit.com";
  const adminSecret = process.env.AUDIT_SECRET;

  const results = { polled: 0, updated: 0, errors: 0 };

  // ── Poll DE SOS for pending filings ─────────────────────────────────────────
  const filingRows = await db(
    `SELECT id, de_sos_filing_id
     FROM formation_orders
     WHERE status = 'filing_submitted'
       AND de_sos_filing_id IS NOT NULL
       AND de_sos_submitted_at > NOW() - INTERVAL '30 days'`
  ) as { id: string; de_sos_filing_id: string }[];

  for (const row of filingRows) {
    results.polled++;
    try {
      const status = await getFilingStatus(row.de_sos_filing_id);

      if (status.status === "approved") {
        await db(
          `UPDATE formation_orders
           SET status = 'filing_approved',
               de_sos_entity_number = $1,
               de_sos_approved_at = NOW(),
               updated_at = NOW()
           WHERE id = $2`,
          [status.entityNumber ?? null, row.id]
        );
        results.updated++;

        // Trigger EIN step via the file route
        if (adminSecret) {
          await fetch(`${appUrl}/api/delaware/file`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-admin-secret": adminSecret },
            body: JSON.stringify({ orderId: row.id }),
          }).catch((err) => console.error("EIN trigger error for", row.id, err));
        }
      } else if (status.status === "rejected") {
        await db(
          `UPDATE formation_orders
           SET status = 'failed',
               last_error = $1,
               updated_at = NOW()
           WHERE id = $2`,
          [`DE SOS rejected: ${status.rejectionReason ?? "unknown"}`, row.id]
        );
        results.updated++;
      }
    } catch (err) {
      console.error("DE SOS poll error for", row.de_sos_filing_id, err);
      results.errors++;
    }
  }

  // ── Poll EIN provider for pending applications ───────────────────────────────
  const einRows = await db(
    `SELECT id, ein_application_id
     FROM formation_orders
     WHERE status = 'ein_pending'
       AND ein_application_id IS NOT NULL
       AND ein_applied_at > NOW() - INTERVAL '30 days'`
  ) as { id: string; ein_application_id: string }[];

  for (const row of einRows) {
    results.polled++;
    try {
      const status = await getEinStatus(row.ein_application_id);

      if (status.status === "approved") {
        await db(
          `UPDATE formation_orders
           SET status = 'ein_received',
               ein_number = $1,
               ein_received_at = NOW(),
               updated_at = NOW()
           WHERE id = $2`,
          [status.ein ?? null, row.id]
        );
        results.updated++;

        // Trigger document generation step
        if (adminSecret) {
          await fetch(`${appUrl}/api/delaware/file`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-admin-secret": adminSecret },
            body: JSON.stringify({ orderId: row.id }),
          }).catch((err) => console.error("Doc gen trigger error for", row.id, err));
        }
      } else if (status.status === "rejected") {
        await db(
          `UPDATE formation_orders
           SET status = 'failed',
               last_error = $1,
               updated_at = NOW()
           WHERE id = $2`,
          [`EIN rejected: ${status.rejectionReason ?? "unknown"}`, row.id]
        );
        results.updated++;
      }
    } catch (err) {
      console.error("EIN poll error for", row.ein_application_id, err);
      results.errors++;
    }
  }

  console.log("poll-formations:", results);
  return Response.json(results);
}
