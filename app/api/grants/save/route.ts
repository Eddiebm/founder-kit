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
      status TEXT NOT NULL DEFAULT 'saved',
      deadline TEXT,
      notes TEXT,
      status_updated_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, grant_id)
    )
  `);
  await db(`ALTER TABLE saved_grants ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'saved'`);
  await db(`ALTER TABLE saved_grants ADD COLUMN IF NOT EXISTS deadline TEXT`);
  await db(`ALTER TABLE saved_grants ADD COLUMN IF NOT EXISTS notes TEXT`);
  await db(`ALTER TABLE saved_grants ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMPTZ`);
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

export async function PATCH(request: Request) {
  const token = getTokenFromRequest(request);
  const session = token ? await verifyToken(token) : null;
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as {
    grant_id: string;
    status?: "saved" | "applied" | "awarded" | "rejected";
    deadline?: string | null;
    notes?: string | null;
  };

  if (!body.grant_id) return Response.json({ error: "Missing grant_id" }, { status: 400 });

  const db = getDb();
  await ensureTable(db);

  const setClauses: string[] = ["status_updated_at = NOW()"];
  const values: unknown[] = [];
  let idx = 1;

  if (body.status !== undefined) { setClauses.push(`status = $${idx++}`); values.push(body.status); }
  if (body.deadline !== undefined) { setClauses.push(`deadline = $${idx++}`); values.push(body.deadline); }
  if (body.notes !== undefined) { setClauses.push(`notes = $${idx++}`); values.push(body.notes); }

  values.push(session.sub, body.grant_id);

  await db(
    `UPDATE saved_grants SET ${setClauses.join(", ")} WHERE user_id = $${idx++} AND grant_id = $${idx}`,
    values
  );

  return Response.json({ ok: true });
}

export async function GET(request: Request) {
  const token = getTokenFromRequest(request);
  const session = token ? await verifyToken(token) : null;
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  await ensureTable(db);

  const rows = await db(
    `SELECT grant_id, grant_data, profile_data, status, deadline, notes, created_at
     FROM saved_grants WHERE user_id = $1 ORDER BY created_at DESC`,
    [session.sub]
  );

  return Response.json(rows);
}
