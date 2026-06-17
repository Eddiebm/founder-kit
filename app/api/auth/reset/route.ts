import { getDb } from "@/lib/db";
import { randomBytes, createHash } from "crypto";

async function hashToken(token: string): Promise<string> {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email) return Response.json({ ok: true }); // always succeed

    const db = getDb();
    const rows = await db("SELECT id, name FROM users WHERE email = $1", [email.toLowerCase()]);
    if (rows.length === 0) return Response.json({ ok: true }); // don't leak existence

    const user = rows[0] as { id: string; name?: string };
    const token = randomBytes(32).toString("hex");
    const tokenHash = await hashToken(token);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db("DELETE FROM password_reset_tokens WHERE user_id = $1", [user.id]);
    await db(
      "INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)",
      [user.id, tokenHash, expiresAt.toISOString()]
    );

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY is not set");

    const resetUrl = `https://myfounderkit.com/auth?reset=${token}`;
    const firstName = user.name?.split(" ")[0] ?? "there";

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Founder Kit <noreply@bannermanmenson.com>",
        to: [email.toLowerCase()],
        subject: "Reset your Founder Kit password",
        html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;margin:0;padding:32px 16px;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
    <div style="background:#1B3F7B;padding:24px 32px;">
      <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">Founder Kit</h1>
    </div>
    <div style="padding:32px;">
      <p style="margin:0 0 16px;color:#374151;font-size:15px;">Hi ${firstName},</p>
      <p style="margin:0 0 24px;color:#374151;font-size:15px;">Click the button below to reset your password. This link expires in 1 hour.</p>
      <a href="${resetUrl}" style="display:inline-block;background:#1a5c3a;color:#fff;font-weight:600;font-size:14px;padding:12px 24px;border-radius:8px;text-decoration:none;">Reset Password</a>
      <p style="margin:24px 0 0;color:#9ca3af;font-size:12px;">If you didn't request this, you can safely ignore this email.</p>
    </div>
  </div>
</body></html>`,
      }),
    });

    return Response.json({ ok: true });
  } catch (err) {
    console.error("RESET_ERROR:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
