import { getDb } from "./db";
import { PLAN_LIMITS } from "./auth";

export type Action = "score" | "generate";

export async function getMonthlyCount(userId: string, action: Action): Promise<number> {
  const db = getDb();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const [row] = await db(
    "SELECT COUNT(*) AS cnt FROM usage_events WHERE user_id = $1 AND action = $2 AND created_at >= $3",
    [userId, action, monthStart]
  );
  return Number(row?.cnt ?? 0);
}

export async function recordUsage(userId: string, action: Action): Promise<void> {
  const db = getDb();
  await db("INSERT INTO usage_events (user_id, action) VALUES ($1, $2)", [userId, action]);
}

export function getLimit(plan: string, action: Action): number {
  const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] ?? PLAN_LIMITS.free;
  return limits[action];
}
