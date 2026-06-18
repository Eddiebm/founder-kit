import { getDb } from "@/lib/db";
import crypto from "crypto";

export const runtime = "nodejs";

function verifyToken(userId: string, token: string): boolean {
  const secret = process.env.UNSUBSCRIBE_SECRET ?? process.env.JWT_SECRET;
  if (!secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(userId).digest("hex").slice(0, 32);
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const userId = url.searchParams.get("uid");
  const token = url.searchParams.get("token");

  if (!userId || !token || token.length !== 32 || !verifyToken(userId, token)) {
    return new Response("Invalid unsubscribe link.", { status: 400, headers: { "Content-Type": "text/plain" } });
  }

  const db = getDb();
  await db(`
    CREATE TABLE IF NOT EXISTS email_unsubscribes (
      user_id UUID PRIMARY KEY,
      unsubscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await db(
    `INSERT INTO email_unsubscribes (user_id) VALUES ($1::uuid) ON CONFLICT DO NOTHING`,
    [userId]
  );

  return new Response(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Unsubscribed</title></head>
<body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f9fafb;">
  <div style="text-align:center;max-width:400px;padding:32px;">
    <p style="font-size:32px;margin:0 0 12px;">✓</p>
    <h1 style="font-size:20px;color:#111827;margin:0 0 8px;">You're unsubscribed</h1>
    <p style="color:#6b7280;font-size:14px;margin:0 0 24px;">You won't receive weekly digest emails from Founder Kit.</p>
    <a href="https://myfounderkit.com" style="color:#1a5c3a;font-size:14px;">Back to Founder Kit</a>
  </div>
</body></html>`,
    { status: 200, headers: { "Content-Type": "text/html" } }
  );
}
