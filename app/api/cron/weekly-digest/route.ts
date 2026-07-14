import { getDb } from "@/lib/db";
import { GRANT_PROGRAMS } from "@/lib/grants";
import type { CompanyProfile, GrantProgram } from "@/lib/types";
import crypto from "crypto";

export const runtime = "nodejs";

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function unsubToken(userId: string): string {
  const secret = process.env.UNSUBSCRIBE_SECRET ?? process.env.JWT_SECRET;
  if (!secret) throw new Error("UNSUBSCRIBE_SECRET or JWT_SECRET is not set");
  return crypto.createHmac("sha256", secret).update(userId).digest("hex").slice(0, 32);
}

function scoreGrant(grant: GrantProgram, profile: CompanyProfile): number {
  let score = 0;
  const isNonprofit = profile.isNonprofit === "Yes";
  if (grant.requiresNonprofit && !isNonprofit) return -1;
  if (grant.stages.includes(profile.stage)) score += 2;
  if (grant.focusAreas.some((f) => f === profile.focusArea || f === "Other")) score += 2;
  if (grant.geographies.some((g) => g === "Global" || g === profile.geography)) score += 1;
  return score;
}

function buildEmail(
  userName: string | null,
  grants: GrantProgram[],
  userId: string,
  unsubscribeToken: string
): string {
  const firstName = escapeHtml(userName?.split(" ")[0] ?? "there");
  const grantHtml = grants
    .map(
      (g) => `
    <div style="border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin-bottom:16px;">
      <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#6b7280;">${g.funder}</p>
      <h3 style="margin:0 0 6px;font-size:17px;font-weight:700;color:#111827;">${g.name}</h3>
      <p style="margin:0 0 12px;font-size:13px;color:#6b7280;">Award: <strong style="color:#1a5c3a;">${g.awardRange}</strong></p>
      <p style="margin:0 0 14px;font-size:13px;color:#374151;line-height:1.5;">${g.eligibilitySummary}</p>
      <a href="https://myfounderkit.com/grants?ref=digest" style="display:inline-block;background:#1a5c3a;color:#ffffff;font-size:13px;font-weight:600;padding:10px 20px;border-radius:8px;text-decoration:none;">Generate pitch →</a>
    </div>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;margin:0;padding:0;">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px;">
    <div style="background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
      <div style="background:#1a5c3a;padding:24px 32px;">
        <p style="margin:0 0 4px;color:#a7f3d0;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">Founder Kit · Weekly Digest</p>
        <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">Your top grant matches this week</h1>
      </div>
      <div style="padding:32px;">
        <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
          Hi ${firstName} — here are the grants that best fit your profile this week. Click any to generate an AI pitch tailored to your company.
        </p>
        ${grantHtml}
        <div style="text-align:center;margin-top:24px;">
          <a href="https://myfounderkit.com/grants?ref=digest" style="display:inline-block;border:1px solid #1a5c3a;color:#1a5c3a;font-size:13px;font-weight:600;padding:10px 24px;border-radius:8px;text-decoration:none;">See all grants →</a>
        </div>
        <div style="border-top:1px solid #f3f4f6;margin-top:28px;padding-top:16px;text-align:center;">
          <p style="margin:0;font-size:11px;color:#9ca3af;">
            <a href="https://myfounderkit.com" style="color:#1a5c3a;text-decoration:none;">Founder Kit</a>
            &nbsp;·&nbsp;
            <a href="https://myfounderkit.com/api/email/unsubscribe?uid=${userId}&token=${unsubscribeToken}" style="color:#9ca3af;">Unsubscribe</a>
          </p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not set");

  const db = getDb();

  await db(`
    CREATE TABLE IF NOT EXISTS email_unsubscribes (
      user_id UUID PRIMARY KEY,
      unsubscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await db(`
    CREATE TABLE IF NOT EXISTS cron_runs (
      id SERIAL PRIMARY KEY,
      cron_name TEXT NOT NULL,
      run_date DATE NOT NULL,
      UNIQUE(cron_name, run_date)
    )
  `);

  const inserted = await db(
    `INSERT INTO cron_runs (cron_name, run_date) VALUES ('weekly-digest', CURRENT_DATE)
     ON CONFLICT (cron_name, run_date) DO NOTHING
     RETURNING id`
  );
  if (!inserted.length) {
    return Response.json({ ok: true, skipped: "already ran today" });
  }

  // Get all users with at least one saved profile, excluding unsubscribed
  const rows = await db(`
    SELECT DISTINCT ON (u.id)
      u.id, u.email, u.name,
      sg.profile_data
    FROM users u
    JOIN saved_grants sg ON sg.user_id = u.id::text AND sg.profile_data IS NOT NULL
    LEFT JOIN email_unsubscribes eu ON eu.user_id = u.id
    WHERE eu.user_id IS NULL
    ORDER BY u.id, sg.created_at DESC
  `) as { id: string; email: string; name: string | null; profile_data: CompanyProfile }[];

  if (!rows.length) return Response.json({ ok: true, sent: 0 });

  let sent = 0;
  const errors: string[] = [];

  for (const row of rows) {
    try {
      const profile = row.profile_data;
      const scored = GRANT_PROGRAMS
        .map((g) => ({ grant: g, score: scoreGrant(g, profile) }))
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map((x) => x.grant);

      if (!scored.length) continue;

      const token = unsubToken(row.id);
      const html = buildEmail(row.name, scored, row.id, token);

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "Founder Kit <grants@bannermanmenson.com>",
          to: [row.email],
          subject: "Your top grant matches this week — Founder Kit",
          html,
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        errors.push(`${row.email}: ${res.status} ${text.slice(0, 100)}`);
      } else {
        sent++;
      }
    } catch (err) {
      errors.push(`${row.email}: ${String(err)}`);
    }
  }

  return Response.json({ ok: true, sent, errors: errors.length ? errors : undefined });
}
