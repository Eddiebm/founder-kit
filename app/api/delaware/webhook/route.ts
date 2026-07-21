export const runtime = "nodejs";

import { getDb } from "@/lib/db";
import { createHmac, timingSafeEqual } from "crypto";

/**
 * POST /api/delaware/webhook
 *
 * Receives status callbacks from:
 *   - Delaware SOS DECIS API  (source: "de_sos")
 *   - Northwest Registered Agent partner API  (source: "northwest")
 *   - EIN provider API  (source: "ein")
 *
 * All three sign their payloads with HMAC-SHA256 using their respective secrets.
 *
 * Env vars required:
 *   DE_SOS_WEBHOOK_SECRET      — HMAC secret from DE SOS DECIS portal
 *   NORTHWEST_WEBHOOK_SECRET   — HMAC secret from Northwest partner portal
 *   EIN_PROVIDER_WEBHOOK_SECRET — HMAC secret from EIN provider
 *   RESEND_API_KEY             — for status email notifications
 */

// ─── Event type maps ──────────────────────────────────────────────────────────

const DE_SOS_STATUS_MAP: Record<string, string> = {
  filing_submitted:   "filing_submitted",
  filing_processing:  "filing_submitted",
  filing_approved:    "filing_approved",
  filing_rejected:    "failed",
};

const NORTHWEST_STATUS_MAP: Record<string, string> = {
  order_confirmed:    "ra_ordered",
  agent_active:       "ra_ordered",
};

const EIN_STATUS_MAP: Record<string, string> = {
  ein_approved:       "ein_received",
  ein_rejected:       "failed",
};

// ─── Email copy ───────────────────────────────────────────────────────────────

const EMAIL_COPY: Record<string, { subject: string; headline: string; body: string }> = {
  filing_submitted: {
    subject: "Your company formation has been submitted to Delaware",
    headline: "Filing submitted to the state",
    body: "Your formation documents have been submitted to the Delaware Division of Corporations. Processing typically takes 3–7 business days. We'll email you as soon as it's approved.",
  },
  filing_approved: {
    subject: "Your Delaware company is officially formed",
    headline: "Formation approved",
    body: "Great news — the Delaware Division of Corporations has approved your formation. Your stamped Articles will be available in your dashboard shortly.",
  },
  ein_received: {
    subject: "Your EIN has been issued by the IRS",
    headline: "EIN received from the IRS",
    body: "Your Employer Identification Number (EIN) has been issued. With this in hand you can open a business bank account, hire employees, and apply for grants.",
  },
};

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const rawBody = await request.arrayBuffer();
  const bodyText = new TextDecoder().decode(rawBody);

  const source = request.headers.get("x-webhook-source") ?? "";

  // Verify HMAC signature for the detected source
  const verified = verifySignature(source, request.headers, rawBody);
  if (!verified) {
    console.error(`Webhook HMAC verification failed for source: ${source}`);
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let event: { type: string; data: Record<string, unknown> };
  try {
    event = JSON.parse(bodyText);
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const db = getDb();

  if (source === "de_sos") {
    return handleDeSosEvent(event, db);
  } else if (source === "northwest") {
    return handleNorthwestEvent(event, db);
  } else if (source === "ein") {
    return handleEinEvent(event, db);
  }

  // Unknown source — ack and log
  console.warn("Unknown webhook source:", source, event.type);
  return Response.json({ ok: true });
}

// ─── Source-specific handlers ─────────────────────────────────────────────────

async function handleDeSosEvent(
  event: { type: string; data: Record<string, unknown> },
  db: ReturnType<typeof import("@/lib/db").getDb>
) {
  const newStatus = DE_SOS_STATUS_MAP[event.type];
  if (!newStatus) return Response.json({ ok: true });

  const filingId = event.data.filingId as string | undefined;
  if (!filingId) {
    console.error("DE SOS webhook missing filingId:", event);
    return Response.json({ ok: true });
  }

  const rows = await db(
    "SELECT id, email, company_name, entity_type FROM formation_orders WHERE de_sos_filing_id = $1",
    [filingId]
  ) as { id: string; email: string; company_name: string; entity_type: string }[];

  if (!rows.length) {
    console.error("DE SOS webhook: no order for filing", filingId);
    return Response.json({ ok: true });
  }

  const order = rows[0];
  const entityNumber = event.data.entityNumber as string | undefined;

  if (newStatus === "filing_approved") {
    await db(
      `UPDATE formation_orders
       SET status = $1,
           de_sos_entity_number = $2,
           de_sos_approved_at = NOW(),
           updated_at = NOW()
       WHERE id = $3`,
      [newStatus, entityNumber ?? null, order.id]
    );
  } else if (newStatus === "failed") {
    const reason = event.data.rejectionReason as string | undefined;
    await db(
      "UPDATE formation_orders SET status = 'failed', last_error = $1, updated_at = NOW() WHERE id = $2",
      [`DE SOS rejection: ${reason ?? "unknown"}`, order.id]
    );
  } else {
    await db(
      "UPDATE formation_orders SET status = $1, updated_at = NOW() WHERE id = $2",
      [newStatus, order.id]
    );
  }

  await sendStatusEmail(order.email, order.company_name, event.type);
  return Response.json({ ok: true });
}

async function handleNorthwestEvent(
  event: { type: string; data: Record<string, unknown> },
  db: ReturnType<typeof import("@/lib/db").getDb>
) {
  const newStatus = NORTHWEST_STATUS_MAP[event.type];
  if (!newStatus) return Response.json({ ok: true });

  const orderId = event.data.orderId as string | undefined;
  if (!orderId) return Response.json({ ok: true });

  await db(
    "UPDATE formation_orders SET status = $1, updated_at = NOW() WHERE northwest_order_id = $2",
    [newStatus, orderId]
  );

  return Response.json({ ok: true });
}

async function handleEinEvent(
  event: { type: string; data: Record<string, unknown> },
  db: ReturnType<typeof import("@/lib/db").getDb>
) {
  const newStatus = EIN_STATUS_MAP[event.type];
  if (!newStatus) return Response.json({ ok: true });

  const applicationId = event.data.applicationId as string | undefined;
  if (!applicationId) return Response.json({ ok: true });

  const rows = await db(
    "SELECT id, email, company_name FROM formation_orders WHERE ein_application_id = $1",
    [applicationId]
  ) as { id: string; email: string; company_name: string }[];

  if (!rows.length) {
    console.error("EIN webhook: no order for application", applicationId);
    return Response.json({ ok: true });
  }

  const order = rows[0];
  const einNumber = event.data.ein as string | undefined;
  const letterUrl = event.data.confirmationLetterUrl as string | undefined;

  if (newStatus === "ein_received") {
    await db(
      `UPDATE formation_orders
       SET status          = 'ein_received',
           ein_number      = $1,
           ein_received_at = NOW(),
           doc_ein_letter_url = $2,
           updated_at      = NOW()
       WHERE id = $3`,
      [einNumber ?? null, letterUrl ?? null, order.id]
    );
  } else {
    const reason = event.data.rejectionReason as string | undefined;
    await db(
      "UPDATE formation_orders SET status = 'failed', last_error = $1, updated_at = NOW() WHERE id = $2",
      [`EIN rejection: ${reason ?? "unknown"}`, order.id]
    );
  }

  await sendStatusEmail(order.email, order.company_name, event.type);
  return Response.json({ ok: true });
}

// ─── HMAC verification ────────────────────────────────────────────────────────

function verifySignature(
  source: string,
  headers: Headers,
  rawBody: ArrayBuffer
): boolean {
  const secretEnvMap: Record<string, string> = {
    de_sos: "DE_SOS_WEBHOOK_SECRET",
    northwest: "NORTHWEST_WEBHOOK_SECRET",
    ein: "EIN_PROVIDER_WEBHOOK_SECRET",
  };

  const envVar = secretEnvMap[source];
  if (!envVar) return false;

  const secret = process.env[envVar];
  if (!secret) {
    console.error(`${envVar} is not set — cannot verify webhook`);
    return false;
  }

  // All three providers send HMAC-SHA256 in X-Signature header as "sha256=<hex>"
  const sigHeader = headers.get("x-signature") ?? "";
  if (!sigHeader.startsWith("sha256=")) return false;
  const receivedSig = sigHeader.slice(7);

  const expectedHex = createHmac("sha256", secret)
    .update(new Uint8Array(rawBody))
    .digest("hex");

  try {
    return timingSafeEqual(
      Buffer.from(receivedSig, "hex"),
      Buffer.from(expectedHex, "hex")
    );
  } catch {
    return false;
  }
}

// ─── Email helper ─────────────────────────────────────────────────────────────

async function sendStatusEmail(
  email: string,
  companyName: string,
  eventType: string
): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;

  const copy = EMAIL_COPY[eventType];
  if (!copy) return;

  function esc(s: string): string {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "Founder Kit <noreply@bannermanmenson.com>",
      to: [email],
      subject: `${esc(companyName)} — ${copy.subject}`,
      html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;margin:0;padding:32px 16px;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
    <div style="background:#1B3F7B;padding:24px 32px;">
      <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">${copy.headline}</h1>
    </div>
    <div style="padding:32px;">
      <p style="margin:0 0 16px;color:#374151;font-size:15px;">${copy.body}</p>
      <p style="margin:0 0 24px;color:#374151;font-size:15px;">Company: <strong>${esc(companyName)}</strong></p>
      <a href="https://myfounderkit.com/wizard" style="display:inline-block;background:#1B3F7B;color:#fff;font-weight:600;font-size:14px;padding:12px 24px;border-radius:8px;text-decoration:none;">View Formation Status →</a>
    </div>
  </div>
</body></html>`,
    }),
  }).catch((err) => console.error("Status email error:", err));
}
