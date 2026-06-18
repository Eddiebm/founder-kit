import { getDb } from "@/lib/db";
import { hashPassword, sessionCookie, signToken } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rateLimit";

async function sendWelcomeEmail(email: string, name?: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;
  const firstName = name?.split(" ")[0] ?? "there";
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "Founder Kit <noreply@bannermanmenson.com>",
      to: [email],
      subject: "Welcome to Founder Kit",
      html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;margin:0;padding:32px 16px;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
    <div style="background:#1B3F7B;padding:24px 32px;">
      <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">Welcome to Founder Kit</h1>
    </div>
    <div style="padding:32px;">
      <p style="margin:0 0 16px;color:#374151;font-size:15px;">Hi ${firstName},</p>
      <p style="margin:0 0 24px;color:#374151;font-size:15px;">Your free account is ready. Here's what you can do:</p>
      <ul style="margin:0 0 24px;padding-left:20px;color:#374151;font-size:14px;line-height:2;">
        <li>Search 100+ grants matched to your business</li>
        <li>Generate AI pitch drafts and auto-apply</li>
        <li>Form your entity in any US state</li>
        <li>Get your federal registration roadmap</li>
      </ul>
      <a href="https://myfounderkit.com/grants" style="display:inline-block;background:#1a5c3a;color:#fff;font-weight:600;font-size:14px;padding:12px 24px;border-radius:8px;text-decoration:none;">Find Your First Grant</a>
      <p style="margin:24px 0 0;color:#9ca3af;font-size:12px;">Free plan includes 5 searches and 10 pitch drafts per month. <a href="https://myfounderkit.com/billing" style="color:#1a5c3a;">Upgrade to Pro</a> for unlimited access at $19/month.</p>
    </div>
  </div>
</body></html>`,
    }),
  }).catch((err) => console.error("WELCOME_EMAIL_ERROR:", err));
}

export async function POST(request: Request) {
  const { allowed, retryAfter } = await checkRateLimit(request, "signup", 5, 3600); // 5/hour
  if (!allowed) {
    return Response.json({ error: "Too many attempts. Try again later." }, {
      status: 429,
      headers: { "Retry-After": String(retryAfter) },
    });
  }

  try {
    const { email, password, name } = await request.json();

    if (!email || !password) {
      return Response.json({ error: "Email and password required" }, { status: 400 });
    }
    if (password.length < 8) {
      return Response.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const db = getDb();
    const existing = await db("SELECT id FROM users WHERE email = $1", [email.toLowerCase()]);
    if (existing.length > 0) {
      return Response.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const rows = await db(
      "INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, plan, name",
      [email.toLowerCase(), passwordHash, name ?? null]
    );
    const user = rows[0] as { id: string; email: string; plan: string; name?: string };

    const token = await signToken({ sub: user.id, email: user.email, plan: user.plan, name: user.name });

    sendWelcomeEmail(user.email, user.name);

    return Response.json({ ok: true }, {
      headers: { "Set-Cookie": sessionCookie(token) },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : "";
    console.error("SIGNUP_ERROR:", msg, stack);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
