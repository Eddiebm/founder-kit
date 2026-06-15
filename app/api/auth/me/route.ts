export const runtime = "edge";

import { getDb } from "@/lib/db";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

export async function GET(request: Request) {
  const token = getTokenFromRequest(request);
  if (!token) return Response.json({ user: null });

  const session = await verifyToken(token);
  if (!session) return Response.json({ user: null });

  const db = getDb();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [usage] = await db(
    `SELECT
      COUNT(*) FILTER (WHERE action = 'score')    AS score_count,
      COUNT(*) FILTER (WHERE action = 'generate') AS generate_count
     FROM usage_events
     WHERE user_id = $1 AND created_at >= $2`,
    [session.sub, monthStart]
  );

  return Response.json({
    user: {
      id: session.sub,
      email: session.email,
      name: session.name,
      plan: session.plan,
      usage: {
        score: Number(usage.score_count),
        generate: Number(usage.generate_count),
      },
    },
  });
}
