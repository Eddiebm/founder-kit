export const runtime = "nodejs";

import { getDb } from "@/lib/db";

const STATUS_MAP: Record<string, string> = {
  company_formation_submitted: "filing_submitted",
  company_formation_completed: "filing_complete",
  document_aoo_uploaded: "articles_ready",
  document_einletter_uploaded: "ein_received",
};

const EMAIL_COPY: Record<string, { subject: string; headline: string; body: string }> = {
  company_formation_submitted: {
    subject: "Your company formation has been submitted",
    headline: "Filing submitted to the state",
    body: "Your company formation has been submitted to the state for review. Processing typically takes 5–10 business days. We'll email you as soon as it's approved.",
  },
  company_formation_completed: {
    subject: "Your company is officially formed",
    headline: "Formation approved",
    body: "Great news — the state has approved your company formation. Your Articles of Incorporation will be available in your dashboard shortly.",
  },
  document_aoo_uploaded: {
    subject: "Your Articles of Incorporation are ready",
    headline: "Articles of Incorporation uploaded",
    body: "Your Articles of Incorporation are now available. Download and store them safely — you'll need them to open a business bank account and for future fundraising.",
  },
  document_einletter_uploaded: {
    subject: "Your EIN letter is ready",
    headline: "EIN received from the IRS",
    body: "Your Employer Identification Number (EIN) letter from the IRS is ready. With this in hand you can open a business bank account and start hiring.",
  },
};

async function sendStatusEmail(
  email: string,
  companyName: string,
  eventType: string,
  apiKey: string
) {
  const copy = EMAIL_COPY[eventType];
  if (!copy) return;
  const firstName = email.split("@")[0];
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "Founder Kit <noreply@bannermanmenson.com>",
      to: [email],
      subject: `${companyName} — ${copy.subject}`,
      html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;margin:0;padding:32px 16px;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
    <div style="background:#1B3F7B;padding:24px 32px;">
      <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">${copy.headline}</h1>
    </div>
    <div style="padding:32px;">
      <p style="margin:0 0 16px;color:#374151;font-size:15px;">Hi ${firstName},</p>
      <p style="margin:0 0 16px;color:#374151;font-size:15px;">${copy.body}</p>
      <p style="margin:0 0 24px;color:#374151;font-size:15px;">Company: <strong>${companyName}</strong></p>
      <a href="https://myfounderkit.com/wizard" style="display:inline-block;background:#1B3F7B;color:#fff;font-weight:600;font-size:14px;padding:12px 24px;border-radius:8px;text-decoration:none;">View Formation Status</a>
      <p style="margin:24px 0 0;color:#9ca3af;font-size:12px;">Questions? Reply to this email and we'll help.</p>
    </div>
  </div>
</body></html>`,
    }),
  }).catch((err) => console.error("DOOLA_STATUS_EMAIL_ERROR:", err));
}

export async function POST(request: Request) {
  const webhookSecret = process.env.DOOLA_WEBHOOK_SECRET;
  if (!webhookSecret) throw new Error("DOOLA_WEBHOOK_SECRET is not set");

  // Doola sends the secret as a bearer token — update if they switch to HMAC
  const auth = request.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${webhookSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const event = await request.json() as {
    type: string;
    data: { companyId?: string; company_id?: string; [key: string]: unknown };
  };

  const newStatus = STATUS_MAP[event.type];
  if (!newStatus) {
    return Response.json({ ok: true }); // unknown event — ack and ignore
  }

  const companyId = event.data.companyId ?? event.data.company_id;
  if (!companyId) {
    console.error("Doola webhook missing companyId:", JSON.stringify(event));
    return Response.json({ ok: true });
  }

  const db = getDb();
  const rows = await db(
    "SELECT id, email, company_name FROM formation_orders WHERE doola_company_id = $1",
    [companyId]
  ) as { id: string; email: string; company_name: string }[];

  if (!rows.length) {
    console.error("Doola webhook: no order found for company", companyId);
    return Response.json({ ok: true });
  }

  const order = rows[0];
  await db(
    "UPDATE formation_orders SET status = $1, updated_at = NOW() WHERE id = $2",
    [newStatus, order.id]
  );

  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    await sendStatusEmail(order.email, order.company_name, event.type, resendKey);
  }

  return Response.json({ ok: true });
}
