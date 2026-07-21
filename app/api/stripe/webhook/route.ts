import { getDb } from "@/lib/db";

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
}

async function verifyStripeSignature(body: string, signature: string, secret: string): Promise<boolean> {
  const parts = signature.split(",").reduce<Record<string, string>>((acc, p) => {
    const [k, v] = p.split("=");
    acc[k] = v;
    return acc;
  }, {});

  const timestamp = parts["t"];
  const sig = parts["v1"];
  if (!timestamp || !sig) return false;

  // Reject webhooks older than 5 minutes (replay attack prevention)
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;

  const payload = `${timestamp}.${body}`;
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  const expected = new Uint8Array(mac);
  const received = new Uint8Array(sig.match(/.{2}/g)!.map((b) => parseInt(b, 16)));
  if (expected.length !== received.length) return false;
  return expected.every((b, i) => b === received[i]);
}

async function sendPaymentFailedEmail(email: string, name: string | null, portalUrl: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;
  const firstName = escapeHtml(name?.split(" ")[0] ?? "there");
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "Founder Kit <noreply@bannermanmenson.com>",
      to: [email],
      subject: "Action required: your Founder Kit payment failed",
      html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;margin:0;padding:32px 16px;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
    <div style="background:#dc2626;padding:24px 32px;">
      <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">Payment failed</h1>
    </div>
    <div style="padding:32px;">
      <p style="margin:0 0 16px;color:#374151;font-size:15px;">Hi ${firstName},</p>
      <p style="margin:0 0 16px;color:#374151;font-size:15px;">We couldn't process your Founder Kit Pro payment. Your account is still active, but we'll need a valid payment method to keep it that way.</p>
      <p style="margin:0 0 24px;color:#374151;font-size:15px;">Please update your payment details before your next billing attempt to avoid losing Pro access.</p>
      <a href="${portalUrl}" style="display:inline-block;background:#1a5c3a;color:#fff;font-weight:600;font-size:14px;padding:12px 24px;border-radius:8px;text-decoration:none;">Update Payment Method</a>
      <p style="margin:24px 0 0;color:#9ca3af;font-size:12px;">If you believe this is an error, reply to this email and we'll sort it out.</p>
    </div>
  </div>
</body></html>`,
    }),
  }).catch((err) => console.error("PAYMENT_FAILED_EMAIL_ERROR:", err));
}



async function handleFormationPayment(
  session: { metadata?: Record<string, string>; payment_intent?: string },
  db: (q: string, p?: unknown[]) => Promise<Record<string, unknown>[]>
) {
  const orderId = session.metadata?.order_id;
  if (!orderId) return;

  const rows = await db("SELECT id FROM formation_orders WHERE id = $1", [orderId]) as { id: string }[];
  if (!rows.length) return;

  await db(
    "UPDATE formation_orders SET status = 'paid', stripe_payment_intent = $1, updated_at = NOW() WHERE id = $2",
    [session.payment_intent ?? null, orderId]
  );

  // Hand off to Delaware formation pipeline
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://myfounderkit.com";
  const adminSecret = process.env.AUDIT_SECRET;
  if (!adminSecret) {
    console.error("AUDIT_SECRET not set — cannot trigger Delaware filing for order", orderId);
    return;
  }

  const fileRes = await fetch(`${appUrl}/api/delaware/file`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-secret": adminSecret,
    },
    body: JSON.stringify({ orderId }),
  });

  if (!fileRes.ok) {
    console.error("Delaware file trigger failed for order", orderId, await fileRes.text());
  }
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

    if (session.metadata?.type === "formation") {
      const stripeSessionId = session.id as string;
      if (stripeSessionId) {
        const existing = await db(
          "SELECT status FROM formation_orders WHERE stripe_session_id = $1",
          [stripeSessionId]
        ) as { status: string }[];
        if (existing.length && existing[0].status !== "pending_payment") {
          return Response.json({ ok: true });
        }
      }
      await handleFormationPayment(session, db);
      return Response.json({ ok: true });
    }

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

  if (event.type === "invoice.payment_failed") {
    const invoice = event.data.object;
    const customerId = invoice.customer;
    if (!customerId) return Response.json({ ok: true });

    const rows = await db(
      "SELECT email, name FROM users WHERE stripe_customer_id = $1",
      [customerId]
    ) as { email: string; name: string | null }[];

    if (!rows.length) return Response.json({ ok: true });

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://myfounderkit.com";

    let portalUrl = `${appUrl}/billing`;
    if (stripeKey) {
      const portalRes = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${stripeKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ customer: customerId, return_url: `${appUrl}/billing` }),
      });
      if (portalRes.ok) {
        const portalData: { url: string } = await portalRes.json();
        portalUrl = portalData.url;
      }
    }

    await sendPaymentFailedEmail(rows[0].email, rows[0].name, portalUrl);
  }

  return Response.json({ ok: true });
}
