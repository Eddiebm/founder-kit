import { getDb } from "@/lib/db";

// Admin-only endpoint to generate a new blog article.
// POST { topic: string, slug: string }
// → drafts article with Gemini → fact-checks claims with Exa → returns MDX + initial verification

export async function POST(req: Request) {
  const secret = process.env.AUDIT_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { topic, slug, tags = [] } = await req.json();
  if (!topic || !slug) return Response.json({ error: "topic and slug required" }, { status: 400 });

  const aiKey = process.env.OPENROUTER_API_KEY;
  const exaKey = process.env.EXA_API_KEY;
  if (!aiKey || !exaKey) throw new Error("OPENROUTER_API_KEY or EXA_API_KEY is not set");

  // Step 1: Draft the article
  const draftRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${aiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "user",
          content: `Write a comprehensive, accurate SEO article for founders about: "${topic}"

Requirements:
- 800–1200 words
- Target founders, nonprofit leaders, and small business owners in the US
- Include a clear step-by-step section with numbered steps where applicable
- Include an FAQ section at the end with 5–6 questions and direct answers
- Link to authoritative sources (SAM.gov, SBA.gov, IRS.gov, grants.gov) where relevant
- Tone: practical, clear, not salesy
- Do NOT mention Founder Kit directly

Output JSON only:
{
  "title": "string",
  "description": "string (120–155 chars for SEO)",
  "content": "string (MDX markdown)",
  "verifiableClaims": ["array of 3–6 specific factual claims that could go stale, e.g. dollar amounts, URLs, deadlines, form names"]
}`,
        },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!draftRes.ok) {
    const t = await draftRes.text().catch(() => "");
    console.error("DRAFT_ERROR:", draftRes.status, t);
    return Response.json({ error: "AI draft failed" }, { status: 500 });
  }

  const draftData = await draftRes.json();
  let draft: { title: string; description: string; content: string; verifiableClaims: string[] };
  try {
    draft = JSON.parse(draftData.choices[0].message.content);
  } catch {
    return Response.json({ error: "Failed to parse AI response" }, { status: 500 });
  }

  // Step 2: Fact-check verifiable claims with Exa before publishing
  const flaggedClaims: string[] = [];
  for (const claim of draft.verifiableClaims ?? []) {
    const exaRes = await fetch("https://api.exa.ai/search", {
      method: "POST",
      headers: { "x-api-key": exaKey, "Content-Type": "application/json" },
      body: JSON.stringify({ query: claim, num_results: 3, use_autoprompt: true }),
    });
    const exaData = exaRes.ok ? await exaRes.json() : null;
    const snippets = (exaData?.results ?? []).map((r: { title?: string; text?: string }) =>
      `${r.title ?? ""}: ${(r.text ?? "").slice(0, 300)}`
    ).join("\n\n");

    const checkRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${aiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: `CLAIM: "${claim}"\n\nWEB RESULTS:\n${snippets || "(none)"}\n\nIs this accurate? Reply JSON: {"accurate": true|false, "reason": "string"}`,
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (checkRes.ok) {
      const checkData = await checkRes.json();
      try {
        const r = JSON.parse(checkData.choices?.[0]?.message?.content ?? "{}");
        if (!r.accurate) flaggedClaims.push(`"${claim}" — ${r.reason}`);
      } catch { /* skip */ }
    }
  }

  const verified = flaggedClaims.length === 0;
  const today = new Date().toISOString().split("T")[0];

  // Build MDX frontmatter
  const frontmatter = `---
title: "${draft.title.replace(/"/g, '\\"')}"
description: "${draft.description.replace(/"/g, '\\"')}"
date: "${today}"
tags: [${tags.map((t: string) => `"${t}"`).join(", ")}]
verifiableClaims:
${(draft.verifiableClaims ?? []).map((c) => `  - "${c.replace(/"/g, '\\"')}"`).join("\n")}
---

${draft.content}`;

  // Record initial verification state
  const db = getDb();
  await db(
    `INSERT INTO blog_verifications (slug, verified, flagged_claims, last_verified_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (slug) DO UPDATE SET verified = $2, flagged_claims = $3, last_verified_at = NOW()`,
    [slug, verified, JSON.stringify(flaggedClaims)]
  );

  return Response.json({
    ok: true,
    slug,
    title: draft.title,
    verified,
    flaggedClaims,
    mdx: frontmatter,
  });
}
