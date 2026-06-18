import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

async function ensureTable(db: ReturnType<typeof getDb>) {
  await db(`
    CREATE TABLE IF NOT EXISTS saved_grants (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      grant_id TEXT NOT NULL,
      grant_data JSONB NOT NULL,
      profile_data JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, grant_id)
    )
  `);
}

export async function POST(request: Request) {
  const token = getTokenFromRequest(request);
  const session = token ? await verifyToken(token) : null;
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { grant, profile, action } = await request.json() as {
    grant: { id: string; [key: string]: unknown };
    profile?: unknown;
    action: "save" | "unsave";
  };

  if (!grant?.id) return Response.json({ error: "Missing grant id" }, { status: 400 });

  const db = getDb();
  await ensureTable(db);

  if (action === "unsave") {
    await db(
      "DELETE FROM saved_grants WHERE user_id = $1 AND grant_id = $2",
      [session.sub, grant.id]
    );
  } else {
    await db(
      `INSERT INTO saved_grants (user_id, grant_id, grant_data, profile_data)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, grant_id) DO NOTHING`,
      [session.sub, grant.id, JSON.stringify(grant), JSON.stringify(profile ?? null)]
    );
  }

  return Response.json({ ok: true });
}

export async function GET(request: Request) {
  const token = getTokenFromRequest(request);
  const session = token ? await verifyToken(token) : null;
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  await ensureTable(db);

  const rows = await db(
    "SELECT grant_id, grant_data, profile_data, created_at FROM saved_grants WHERE user_id = $1 ORDER BY created_at DESC",
    [session.sub]
  );

  return Response.json(rows);
}
