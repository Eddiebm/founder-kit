import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function POST(request: Request) {
  const session = await verifyToken(getTokenFromRequest(request) ?? "");
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://myfounderkit.com";
  if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

  const db = getDb();
  const rows = await db("SELECT stripe_customer_id FROM users WHERE id = $1", [session.sub]) as {
    stripe_customer_id: string | null;
  }[];

  const customerId = rows[0]?.stripe_customer_id;
  if (!customerId) {
    return Response.json({ error: "No active subscription found" }, { status: 400 });
  }

  const res = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      customer: customerId,
      return_url: `${appUrl}/billing`,
    }),
  });

  if (!res.ok) {
    console.error("Stripe portal error:", await res.text());
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }

  const data: { url: string } = await res.json();
  return Response.json({ url: data.url });
}
