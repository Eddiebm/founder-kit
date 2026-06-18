import { getDb } from "@/lib/db";
import { clearCookie, sessionCookie, signToken, verifyPassword } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(request: Request) {
  const { allowed, retryAfter } = await checkRateLimit(request, "login", 10, 900); // 10/15min
  if (!allowed) {
    return Response.json({ error: "Too many attempts. Try again later." }, {
      status: 429,
      headers: { "Retry-After": String(retryAfter) },
    });
  }

  const { email, password } = await request.json();

  if (!email || !password) {
    return Response.json({ error: "Email and password required" }, { status: 400 });
  }

  const db = getDb();
  const rows = await db(
    "SELECT id, email, password_hash, plan, name FROM users WHERE email = $1",
    [email.toLowerCase()]
  );
  if (rows.length === 0) {
    return Response.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const user = rows[0] as { id: string; email: string; password_hash: string; plan: string; name?: string };
  const valid = await verifyPassword(password as string, user.password_hash);
  if (!valid) {
    return Response.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const token = await signToken({ sub: user.id, email: user.email, plan: user.plan, name: user.name });
  return Response.json({ ok: true }, {
    headers: { "Set-Cookie": sessionCookie(token) },
  });
}

export async function DELETE() {
  return Response.json({ ok: true }, {
    headers: { "Set-Cookie": clearCookie() },
  });
}
