import { getDb } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { email, source } = await request.json().catch(() => ({})) as { email?: string; source?: string };

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Invalid email" }, { status: 400 });
  }

  const db = getDb();

  await db(`
    CREATE TABLE IF NOT EXISTS email_subscribers (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      source TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await db(
    `INSERT INTO email_subscribers (email, source) VALUES ($1, $2)
     ON CONFLICT (email) DO NOTHING`,
    [email.toLowerCase().trim(), source ?? "unknown"]
  );

  return Response.json({ ok: true });
}
