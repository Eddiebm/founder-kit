import { getDb } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { email, source } = await request.json().catch(() => ({})) as { email?: string; source?: string };

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Invalid email" }, { status: 400 });
  }

  const clean = email.toLowerCase().trim();
  const db = getDb();

  await db(`
    CREATE TABLE IF NOT EXISTS email_subscribers (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      source TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  const result = await db(
    `INSERT INTO email_subscribers (email, source) VALUES ($1, $2)
     ON CONFLICT (email) DO NOTHING
     RETURNING id`,
    [clean, source ?? "unknown"]
  );

  // Only send welcome email for new subscribers (not duplicates)
  if (result.length > 0) {
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "Founder Kit <noreply@bannermanmenson.com>",
          to: [clean],
          subject: "Your free grant match report is on the way",
          html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;margin:0;padding:32px 16px;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
    <div style="background:#1B3F7B;padding:24px 32px;">
      <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">Founder Kit</h1>
    </div>
    <div style="padding:32px;">
      <p style="margin:0 0 16px;color:#374151;font-size:15px;">Thanks for signing up.</p>
      <p style="margin:0 0 24px;color:#374151;font-size:15px;">
        To send you your personalized grant matches, we need to know a little about your business.
        It takes about 2 minutes — then we score 100+ federal and private grant programs for fit
        and show you the ones worth your time.
      </p>
      <a href="https://myfounderkit.com/grants"
         style="display:inline-block;background:#f59e0b;color:#fff;font-weight:700;font-size:15px;padding:14px 28px;border-radius:10px;text-decoration:none;">
        Find my grant matches →
      </a>
      <div style="margin-top:32px;padding-top:24px;border-top:1px solid #f3f4f6;">
        <p style="margin:0 0 8px;color:#6b7280;font-size:13px;font-weight:600;">What you'll find:</p>
        <ul style="margin:0;padding-left:20px;color:#6b7280;font-size:13px;line-height:2;">
          <li>SBIR/STTR grants — up to $275K Phase I, no equity required</li>
          <li>Federal agency grants matched to your industry</li>
          <li>State-level small business programs you'd never find manually</li>
          <li>Private foundation grants relevant to your focus area</li>
        </ul>
      </div>
      <p style="margin:24px 0 0;color:#9ca3af;font-size:12px;">
        You're receiving this because you signed up at myfounderkit.com.
        <a href="https://myfounderkit.com" style="color:#9ca3af;">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>`,
        }),
      }).catch(() => null); // email failure doesn't break the subscription
    }
  }

  return Response.json({ ok: true });
}
