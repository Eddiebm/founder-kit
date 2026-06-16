import { getDb } from "@/lib/db";
import { hashPassword, sessionCookie, signToken } from "@/lib/auth";

export async function POST(request: Request) {
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
