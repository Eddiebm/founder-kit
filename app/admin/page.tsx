export const runtime = "nodejs";

import { getDb } from "@/lib/db";

const STATUS_COLOR: Record<string, string> = {
  pending_payment: "#6b7280",
  payment_complete: "#d97706",
  formation_submitted: "#2563eb",
  filing_submitted: "#2563eb",
  filing_complete: "#059669",
  articles_ready: "#7c3aed",
  ein_received: "#059669",
  failed: "#dc2626",
};

interface FormationOrder {
  id: string;
  email: string;
  company_name: string;
  state: string;
  entity_type: string;
  status: string;
  doola_customer_id: string | null;
  doola_company_id: string | null;
  stripe_payment_intent: string | null;
  created_at: string;
  updated_at: string;
}

import { headers } from "next/headers";

export default async function AdminPage() {
  const hdrs = await headers();
  const secret = process.env.AUDIT_SECRET;
  const auth = hdrs.get("authorization") ?? "";

  if (!secret || auth !== `Bearer ${secret}`) {
    return (
      <div style={{ padding: 40, fontFamily: "monospace" }}>
        <p style={{ color: "#dc2626" }}>401 Unauthorized</p>
        <p style={{ color: "#6b7280", fontSize: 13 }}>Pass Authorization: Bearer &lt;AUDIT_SECRET&gt;</p>
      </div>
    );
  }

  const db = getDb();
  const orders = await db(
    `SELECT id, email, company_name, state, entity_type, status,
            doola_customer_id, doola_company_id, stripe_payment_intent,
            created_at, updated_at
     FROM formation_orders
     ORDER BY created_at DESC
     LIMIT 200`
  ) as unknown as FormationOrder[];

  const counts = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div style={{ fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", background: "#0f172a", minHeight: "100vh", padding: 32, color: "#e2e8f0" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Formation Orders</h1>
        <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 24 }}>{orders.length} total</p>

        {/* Status summary */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 32 }}>
          {Object.entries(counts).map(([status, count]) => (
            <div key={status} style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, padding: "8px 14px", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: STATUS_COLOR[status] ?? "#6b7280", display: "inline-block" }} />
              <span style={{ fontSize: 13 }}>{status}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>{count}</span>
            </div>
          ))}
        </div>

        {/* Orders table */}
        <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12, overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #334155" }}>
                {["Company", "Email", "State", "Type", "Status", "Doola ID", "Stripe PI", "Created"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "12px 16px", color: "#94a3b8", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((o, i) => (
                <tr key={o.id} style={{ borderBottom: i < orders.length - 1 ? "1px solid #1e293b" : "none", background: i % 2 === 0 ? "transparent" : "#0f172a" }}>
                  <td style={{ padding: "12px 16px", fontWeight: 600, whiteSpace: "nowrap" }}>{o.company_name}</td>
                  <td style={{ padding: "12px 16px", color: "#94a3b8" }}>{o.email}</td>
                  <td style={{ padding: "12px 16px", color: "#94a3b8" }}>{o.state}</td>
                  <td style={{ padding: "12px 16px", color: "#94a3b8", textTransform: "uppercase", fontSize: 11 }}>{o.entity_type}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ background: `${STATUS_COLOR[o.status] ?? "#6b7280"}22`, color: STATUS_COLOR[o.status] ?? "#6b7280", border: `1px solid ${STATUS_COLOR[o.status] ?? "#6b7280"}44`, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>
                      {o.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", color: "#94a3b8", fontFamily: "monospace", fontSize: 11 }}>
                    {o.doola_company_id ? o.doola_company_id.slice(0, 12) + "…" : "—"}
                  </td>
                  <td style={{ padding: "12px 16px", color: "#94a3b8", fontFamily: "monospace", fontSize: 11 }}>
                    {o.stripe_payment_intent ? o.stripe_payment_intent.slice(0, 12) + "…" : "—"}
                  </td>
                  <td style={{ padding: "12px 16px", color: "#94a3b8", whiteSpace: "nowrap" }}>
                    {new Date(o.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: 32, textAlign: "center", color: "#94a3b8" }}>No formation orders yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Manual processing note */}
        {orders.some((o) => o.status === "payment_complete" && !o.doola_company_id) && (
          <div style={{ marginTop: 24, background: "#422006", border: "1px solid #92400e", borderRadius: 12, padding: "16px 20px" }}>
            <p style={{ margin: 0, color: "#fbbf24", fontWeight: 600, fontSize: 13 }}>
              ⚠ Orders stuck at payment_complete with no Doola ID need manual filing — DOOLA_API_KEY is not set.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
