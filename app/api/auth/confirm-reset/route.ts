import { getDb } from "@/lib/db";
import { hashPassword, signToken, sessionCookie } from "@/lib/auth";
import { createHash } from "crypto";

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();
    if (!token || !password) {
      return Response.json({ error: "Token and password required" }, { status: 400 });
    }
    if (password.length < 8) {
      return Response.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const tokenHash = createHash("sha256").update(token).digest("hex");
    const db = getDb();

    const rows = await db(
      `SELECT t.user_id, t.expires_at, u.email, u.plan, u.name
       FROM password_reset_tokens t
       JOIN users u ON u.id = t.user_id
       WHERE t.token_hash = $1`,
      [tokenHash]
    );

    if (rows.length === 0) {
      return Response.json({ error: "Invalid or expired reset link" }, { status: 400 });
    }

    const row = rows[0] as { user_id: string; expires_at: string; email: string; plan: string; name?: string };
    if (new Date(row.expires_at) < new Date()) {
      return Response.json({ error: "This reset link has expired — request a new one" }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    await db("UPDATE users SET password_hash = $1 WHERE id = $2", [passwordHash, row.user_id]);
    await db("DELETE FROM password_reset_tokens WHERE user_id = $1", [row.user_id]);

    const jwtToken = await signToken({ sub: row.user_id, email: row.email, plan: row.plan, name: row.name });
    return Response.json({ ok: true }, {
      headers: { "Set-Cookie": sessionCookie(jwtToken) },
    });
  } catch (err) {
    console.error("CONFIRM_RESET_ERROR:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
