export const runtime = "edge";

import { getDb } from "@/lib/db";

async function verifyStripeSignature(body: string, signature: string, secret: string): Promise<boolean> {
  const parts = signature.split(",").reduce<Record<string, string>>((acc, p) => {
    const [k, v] = p.split("=");
    acc[k] = v;
    return acc;
  }, {});

  const timestamp = parts["t"];
  const sig = parts["v1"];
  if (!timestamp || !sig) return false;

  const payload = `${timestamp}.${body}`;
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  const expected = Array.from(new Uint8Array(mac)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return expected === sig;
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET is not set");

  const body = await request.text();
  const signature = request.headers.get("stripe-signature") ?? "";

  const valid = await verifyStripeSignature(body, signature, webhookSecret);
  if (!valid) return Response.json({ error: "Invalid signature" }, { status: 400 });

  const event = JSON.parse(body);
  const db = getDb();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.metadata?.user_id;
    const customerId = session.customer;
    const subscriptionId = session.subscription;
    if (userId) {
      await db(
        "UPDATE users SET plan = 'pro', stripe_customer_id = $1, stripe_subscription_id = $2 WHERE id = $3",
        [customerId, subscriptionId, userId]
      );
    }
  }

  if (event.type === "customer.subscription.deleted" || event.type === "customer.subscription.paused") {
    const sub = event.data.object;
    await db(
      "UPDATE users SET plan = 'free' WHERE stripe_subscription_id = $1",
      [sub.id]
    );
  }

  return Response.json({ ok: true });
}
