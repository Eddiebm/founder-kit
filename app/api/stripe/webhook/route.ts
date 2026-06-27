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
  const firstName = name?.split(" ")[0] ?? "there";
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

const NAICS_BY_INDUSTRY: Record<string, string> = {
  "Technology & Software": "511210",
  "Artificial Intelligence": "541715",
  "Healthcare & Biotech": "621999",
  "Education": "611710",
  "Financial Services & Fintech": "522390",
  "E-commerce & Retail": "454110",
  "Media & Entertainment": "512110",
  "Climate & Clean Energy": "221118",
  "Manufacturing": "332999",
  "Professional Services": "541990",
};

function parseAddress(raw: string, fallbackState: string) {
  const parts = raw.split(",").map((s) => s.trim());
  if (parts.length >= 3) {
    const stateZip = parts[parts.length - 1].trim().split(" ");
    return {
      street: parts[0],
      city: parts[parts.length - 2],
      state: stateZip[0] || fallbackState,
      zip: stateZip[1] || "",
      country: "US",
    };
  }
  return { street: raw || "Address on file", city: "", state: fallbackState, zip: "", country: "US" };
}

async function handleFormationPayment(
  session: { metadata?: Record<string, string>; payment_intent?: string },
  db: (q: string, p?: unknown[]) => Promise<Record<string, unknown>[]>
) {
  const orderId = session.metadata?.order_id;
  if (!orderId) return;

  const rows = await db("SELECT * FROM formation_orders WHERE id = $1", [orderId]) as Record<string, unknown>[];
  if (!rows.length) return;
  const order = rows[0] as {
    id: string; email: string; company_name: string; state: string;
    entity_type: string; wizard_data: Record<string, string>;
  };

  await db(
    "UPDATE formation_orders SET status = 'payment_complete', stripe_payment_intent = $1, updated_at = NOW() WHERE id = $2",
    [session.payment_intent ?? null, orderId]
  );

  const doolaKey = process.env.DOOLA_API_KEY;
  if (!doolaKey) {
    console.error("DOOLA_API_KEY not set — formation order", orderId, "needs manual processing");
    return;
  }

  const wd = order.wizard_data;
  const nameParts = ((wd.founderName as string) || "Founder Name").split(" ");
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(" ") || "Name";
  const addr = wd.addrStreet
    ? { street: wd.addrStreet as string, city: wd.addrCity as string, state: (wd.addrState as string) || order.state, zip: wd.addrZip as string, country: "US" }
    : parseAddress((wd.incorporatorAddress as string) || "", order.state);
  const naicsCode = NAICS_BY_INDUSTRY[wd.industry as string] ?? "541990";

  // Step 1: Create Doola customer
  const custRes = await fetch("https://api.doola.com/v1/partner/customers", {
    method: "POST",
    headers: {
      Authorization: doolaKey,
      "Content-Type": "application/json",
      "Idempotency-Key": `customer-${orderId}`,
    },
    body: JSON.stringify({
      email: order.email,
      firstName,
      lastName,
      countryOfResidence: "USA",
    }),
  });

  if (!custRes.ok) {
    console.error("Doola customer error:", await custRes.text());
    await db("UPDATE formation_orders SET status = 'failed', updated_at = NOW() WHERE id = $1", [orderId]);
    return;
  }

  const customer = await custRes.json() as { id: string };

  // Step 2: Create Doola company
  const isCCorp = order.entity_type === "ccorp";
  const execMember = { legalFirstName: firstName, legalLastName: lastName, isNaturalPerson: true, address: addr };
  const companyPayload: Record<string, unknown> = {
    doolaCustomerId: customer.id,
    entityType: isCCorp ? "CCorp" : "LLC",
    state: order.state,
    nameOptions: [{ name: order.company_name, preference: 1 }],
    naicsCode,
    description: (wd.oneLiner as string) || order.company_name,
    responsibleParty: { ...execMember },
  };

  if (isCCorp) {
    companyPayload.executiveMembers = ["President", "Secretary", "Treasurer", "Director"].map((role) => ({
      ...execMember, role,
    }));
    companyPayload.ccorpValuation = {
      authorizedShares: parseInt((wd.numShares as string) || "10000000"),
      parValue: 0.0001,
    };
  } else {
    companyPayload.members = [{ ...execMember, ownershipPercent: 100 }];
  }

  const compRes = await fetch("https://api.doola.com/v1/partner/companies", {
    method: "POST",
    headers: {
      Authorization: doolaKey,
      "Content-Type": "application/json",
      "Idempotency-Key": `company-${orderId}`,
    },
    body: JSON.stringify(companyPayload),
  });

  if (!compRes.ok) {
    console.error("Doola company error:", await compRes.text());
    await db(
      "UPDATE formation_orders SET status = 'failed', doola_customer_id = $1, updated_at = NOW() WHERE id = $2",
      [customer.id, orderId]
    );
    return;
  }

  const company = await compRes.json() as { id: string };
  await db(
    "UPDATE formation_orders SET status = 'formation_submitted', doola_customer_id = $1, doola_company_id = $2, updated_at = NOW() WHERE id = $3",
    [customer.id, company.id, orderId]
  );
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
