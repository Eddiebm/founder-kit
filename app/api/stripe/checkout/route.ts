import { getTokenFromRequest, verifyToken } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await verifyToken(getTokenFromRequest(request) ?? "");
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PRO_PRICE_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://formation-wizard.vercel.app";

  if (!stripeKey || !priceId) throw new Error("Stripe env vars not set");

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      mode: "subscription",
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": "1",
      customer_email: session.email,
      success_url: `${appUrl}/billing?success=1`,
      cancel_url: `${appUrl}/billing`,
      "metadata[user_id]": session.sub,
    }),
  });

  if (!res.ok) {
    console.error("Stripe checkout error:", await res.text());
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }

  const data: { url: string } = await res.json();
  return Response.json({ url: data.url });
}
