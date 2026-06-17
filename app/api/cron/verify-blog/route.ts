import { getDb } from "@/lib/db";
import { getAllArticles } from "@/lib/blog";

// Runs on a schedule — re-checks the 3 oldest-verified articles per invocation.
// Each article's verifiableClaims are searched via Exa and re-scored by AI.

const BATCH = 3;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const exaKey = process.env.EXA_API_KEY;
  const aiKey = process.env.OPENROUTER_API_KEY;
  if (!exaKey || !aiKey) throw new Error("EXA_API_KEY or OPENROUTER_API_KEY is not set");

  const db = getDb();
  const allArticles = getAllArticles();
  if (!allArticles.length) return Response.json({ ok: true, checked: 0 });

  // Get verification state sorted by oldest first (unverified articles first)
  const existing = await db(
    "SELECT slug, last_verified_at FROM blog_verifications ORDER BY last_verified_at ASC NULLS FIRST"
  ) as { slug: string; last_verified_at: string | null }[];

  const verifiedSlugs = new Set(existing.map((r) => r.slug));
  const unverified = allArticles.filter((a) => !verifiedSlugs.has(a.slug)).slice(0, BATCH);
  const stale = existing
    .filter((r) => !unverified.find((a) => a.slug === r.slug))
    .slice(0, BATCH - unverified.length)
    .map((r) => allArticles.find((a) => a.slug === r.slug))
    .filter(Boolean);

  const toCheck = [...unverified, ...stale].slice(0, BATCH);
  if (!toCheck.length) return Response.json({ ok: true, checked: 0 });

  const results: { slug: string; verified: boolean; flaggedClaims: string[] }[] = [];

  for (const article of toCheck) {
    if (!article || !article.verifiableClaims?.length) {
      await db(
        `INSERT INTO blog_verifications (slug, verified, flagged_claims, last_verified_at)
         VALUES ($1, true, '[]', NOW())
         ON CONFLICT (slug) DO UPDATE SET verified = true, flagged_claims = '[]', last_verified_at = NOW()`,
        [article!.slug]
      );
      results.push({ slug: article!.slug, verified: true, flaggedClaims: [] });
      continue;
    }

    const flaggedClaims: string[] = [];

    for (const claim of article.verifiableClaims) {
      // Search Exa for current information about this claim
      const exaRes = await fetch("https://api.exa.ai/search", {
        method: "POST",
        headers: { "x-api-key": exaKey, "Content-Type": "application/json" },
        body: JSON.stringify({ query: claim, num_results: 3, use_autoprompt: true }),
      });
      const exaData = exaRes.ok ? await exaRes.json() : null;
      const snippets = (exaData?.results ?? []).map((r: { title?: string; url?: string; text?: string }) =>
        `${r.title ?? ""}: ${(r.text ?? "").slice(0, 300)}`
      ).join("\n\n");

      // Ask AI if the claim is still accurate
      const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${aiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "user",
              content: `You are a fact-checker for an article about US grants, entity formation, and federal registration.

CLAIM TO VERIFY: "${claim}"

CURRENT WEB SEARCH RESULTS:
${snippets || "(no results found)"}

Is this claim still accurate as of today? Reply with JSON only:
{"accurate": true|false, "reason": "one sentence explanation if inaccurate, empty string if accurate"}`,
            },
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (aiRes.ok) {
        const aiData = await aiRes.json();
        try {
          const result = JSON.parse(aiData.choices?.[0]?.message?.content ?? "{}");
          if (!result.accurate) {
            flaggedClaims.push(`"${claim}" — ${result.reason}`);
          }
        } catch {
          // parse failure = skip claim
        }
      }
    }

    const verified = flaggedClaims.length === 0;
    await db(
      `INSERT INTO blog_verifications (slug, verified, flagged_claims, last_verified_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (slug) DO UPDATE SET verified = $2, flagged_claims = $3, last_verified_at = NOW()`,
      [article.slug, verified, JSON.stringify(flaggedClaims)]
    );
    results.push({ slug: article.slug, verified, flaggedClaims });
  }

  return Response.json({ ok: true, checked: results.length, results });
}
