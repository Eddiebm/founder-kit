export const runtime = "nodejs";

import { getDb } from "@/lib/db";

export async function POST(request: Request) {
  const body = await request.json() as { email?: string; companyName?: string };
  const email = body.email?.trim();
  const companyName = body.companyName?.trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Valid email required" }, { status: 400 });
  }

  const db = getDb();
  await db(
    `INSERT INTO formation_waitlist (email, company_name, created_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (email) DO UPDATE SET
       company_name = EXCLUDED.company_name,
       updated_at = NOW()`,
    [email, companyName ?? null]
  );

  return Response.json({ ok: true });
}
