export const runtime = "nodejs";

import { getDb } from "@/lib/db";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

export async function POST(request: Request) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://myfounderkit.com";
  if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

  const token = getTokenFromRequest(request);
  const session = token ? await verifyToken(token) : null;

  const body = await request.json() as {
    companyName: string;
    state: string;
    entityType: string;
    founderEmail: string;
    wizardData: Record<string, unknown>;
  };

  const { companyName, state, entityType, founderEmail, wizardData } = body;

  if (!companyName || !state || !founderEmail) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const db = getDb();

  await db(`
    CREATE TABLE IF NOT EXISTS formation_orders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT,
      email TEXT NOT NULL,
      company_name TEXT NOT NULL,
      state TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      stripe_session_id TEXT,
      stripe_payment_intent TEXT,
      doola_customer_id TEXT,
      doola_company_id TEXT,
      status TEXT NOT NULL DEFAULT 'pending_payment',
      wizard_data JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const [order] = await db(
    `INSERT INTO formation_orders (user_id, email, company_name, state, entity_type, status, wizard_data)
     VALUES ($1, $2, $3, $4, $5, 'pending_payment', $6)
     RETURNING id`,
    [session?.sub ?? null, founderEmail, companyName, state, entityType ?? "ccorp", JSON.stringify(wizardData)]
  ) as [{ id: string }];

  const entityLabel = entityType === "nonprofit" ? "Nonprofit" : entityType === "llc" ? "LLC" : "C-Corp";

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      mode: "payment",
      "line_items[0][price_data][currency]": "usd",
      "line_items[0][price_data][unit_amount]": "24900",
      "line_items[0][price_data][product_data][name]": `Company Formation — ${companyName}`,
      "line_items[0][price_data][product_data][description]": `${entityLabel} formation in ${state}. Includes state filing, EIN, and registered agent.`,
      "line_items[0][quantity]": "1",
      customer_email: founderEmail,
      success_url: `${appUrl}/wizard?formation=success&orderId=${order.id}`,
      cancel_url: `${appUrl}/wizard`,
      "metadata[type]": "formation",
      "metadata[order_id]": order.id,
    }),
  });

  if (!res.ok) {
    console.error("Stripe checkout error:", await res.text());
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }

  const data = await res.json() as { url: string; id: string };

  await db(
    "UPDATE formation_orders SET stripe_session_id = $1 WHERE id = $2",
    [data.id, order.id]
  );

  return Response.json({ url: data.url });
}
