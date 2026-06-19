export const runtime = "nodejs";

import { getDb } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId");
  if (!orderId) return Response.json({ error: "Missing orderId" }, { status: 400 });

  const db = getDb();
  const rows = await db(
    "SELECT id, company_name, state, entity_type, status, doola_company_id, created_at FROM formation_orders WHERE id = $1",
    [orderId]
  ) as { id: string; company_name: string; state: string; entity_type: string; status: string; doola_company_id: string | null; created_at: string }[];

  if (!rows.length) return Response.json({ error: "Order not found" }, { status: 404 });
  return Response.json(rows[0]);
}
