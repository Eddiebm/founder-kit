export const runtime = "nodejs";

import { getDb } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId");
  if (!orderId) return Response.json({ error: "Missing orderId" }, { status: 400 });

  const db = getDb();
  const rows = await db(
    `SELECT
       id, company_name, state, entity_type, status, last_error,
       de_sos_filing_id, de_sos_entity_number, de_sos_submitted_at, de_sos_approved_at,
       northwest_order_id, northwest_agent_name, northwest_agent_address,
       ein_number, ein_applied_at, ein_received_at,
       doc_articles_url, doc_operating_url, doc_ein_letter_url,
       created_at, updated_at
     FROM formation_orders WHERE id = $1`,
    [orderId]
  ) as Record<string, unknown>[];

  if (!rows.length) return Response.json({ error: "Order not found" }, { status: 404 });
  return Response.json(rows[0]);
}
