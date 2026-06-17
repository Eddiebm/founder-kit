import { getDb } from "@/lib/db";

// Three-pass article generation:
// 1. RESEARCH — Exa searches top-ranking content for the keyword, extracts what's covered + what's missing
// 2. DRAFT — Claude Opus writes a comprehensive article informed by research gaps
// 3. EDITORIAL — Second AI pass scores the draft for depth, accuracy, and AIEO readiness; rewrites weak sections
// POST { topic, slug, keyword, tags }

export async function POST(req: Request) {
  const secret = process.env.AUDIT_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { topic, slug, keyword, tags = [] } = await req.json();
  if (!topic || !slug || !keyword) {
    return Response.json({ error: "topic, slug, and keyword required" }, { status: 400 });
  }

  const aiKey = process.env.OPENROUTER_API_KEY;
  const exaKey = process.env.EXA_API_KEY;
  if (!aiKey || !exaKey) throw new Error("OPENROUTER_API_KEY or EXA_API_KEY is not set");

  // ─── PASS 1: RESEARCH ─────────────────────────────────────────────────────
  // Search for top content on this keyword + authoritative sources
  const [competitorRes, authorityRes] = await Promise.all([
    fetch("https://api.exa.ai/search", {
      method: "POST",
      headers: { "x-api-key": exaKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        query: keyword,
        num_results: 5,
        use_autoprompt: true,
        contents: { text: { max_characters: 2000 } },
      }),
    }),
    fetch("https://api.exa.ai/search", {
      method: "POST",
      headers: { "x-api-key": exaKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `site:gov OR site:sba.gov OR site:irs.gov OR site:grants.gov ${keyword}`,
        num_results: 3,
        use_autoprompt: true,
        contents: { text: { max_characters: 1500 } },
      }),
    }),
  ]);

  const competitorData = competitorRes.ok ? await competitorRes.json() : { results: [] };
  const authorityData = authorityRes.ok ? await authorityRes.json() : { results: [] };

  const competitorSummary = (competitorData.results ?? [])
    .map((r: { title?: string; url?: string; text?: string }) =>
      `URL: ${r.url}\nTitle: ${r.title}\nContent: ${(r.text ?? "").slice(0, 800)}`
    ).join("\n\n---\n\n");

  const authoritySummary = (authorityData.results ?? [])
    .map((r: { title?: string; url?: string; text?: string }) =>
      `URL: ${r.url}\nTitle: ${r.title}\nContent: ${(r.text ?? "").slice(0, 600)}`
    ).join("\n\n---\n\n");

  // Analyze competitor gaps with a fast model
  const gapRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${aiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{
        role: "user",
        content: `You are an SEO content strategist. Analyze the top-ranking content for the keyword "${keyword}" and identify what's missing.

TOP COMPETING ARTICLES:
${competitorSummary || "(no results)"}

AUTHORITATIVE GOVERNMENT SOURCES:
${authoritySummary || "(no results)"}

Output JSON:
{
  "topicsCovered": ["list of topics the competitors cover"],
  "gapsAndWeaknesses": ["list of topics, questions, or angles competitors miss or handle poorly"],
  "valuableStats": ["any specific facts, numbers, dates, URLs from authoritative sources worth including"],
  "faqQuestions": ["8 specific questions real founders would ask about this topic"]
}`,
      }],
      response_format: { type: "json_object" },
    }),
  });

  let gaps = { topicsCovered: [], gapsAndWeaknesses: [], valuableStats: [], faqQuestions: [] };
  if (gapRes.ok) {
    const gapData = await gapRes.json();
    try { gaps = JSON.parse(gapData.choices[0].message.content); } catch { /* use defaults */ }
  }

  // ─── PASS 2: DRAFT with Claude Opus ────────────────────────────────────────
  const draftRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${aiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "anthropic/claude-opus-4-5",
      messages: [{
        role: "user",
        content: `You are an expert writer creating the definitive guide on "${topic}" for US founders, nonprofit leaders, and small business owners.

RESEARCH BRIEF:
- Primary keyword: "${keyword}"
- Topics competitors already cover: ${JSON.stringify(gaps.topicsCovered)}
- Gaps you MUST fill (what competitors miss): ${JSON.stringify(gaps.gapsAndWeaknesses)}
- Authoritative facts to include: ${JSON.stringify(gaps.valuableStats)}
- FAQ questions to answer: ${JSON.stringify(gaps.faqQuestions)}

WRITING STANDARDS:
- 1,200–1,800 words (longer than competitors to win on depth)
- Open with a direct 2-sentence answer to the main question (AI engines pull this as the featured snippet)
- Use H2 and H3 headers structured for skimming
- Include a numbered step-by-step section where applicable
- Include a "Common Mistakes to Avoid" section (competitors almost never have this — it's a gap)
- End with an FAQ section using the questions from the brief — give direct, specific answers
- Link to authoritative sources (sam.gov, sba.gov, irs.gov, grants.gov) with descriptive anchor text
- Tone: clear, practical, no fluff, no filler phrases like "In today's world" or "In conclusion"
- Do NOT mention Founder Kit

Output JSON:
{
  "title": "Exact H1 title optimized for the keyword",
  "description": "Meta description 120–155 chars",
  "content": "Full MDX markdown content",
  "verifiableClaims": ["4–7 specific factual claims that could go stale: dollar amounts, dates, URLs, policy details"]
}`,
      }],
      response_format: { type: "json_object" },
      max_tokens: 4000,
    }),
  });

  if (!draftRes.ok) {
    const t = await draftRes.text().catch(() => "");
    console.error("DRAFT_ERROR:", draftRes.status, t);
    return Response.json({ error: "Draft generation failed" }, { status: 500 });
  }

  const draftData = await draftRes.json();
  let draft: { title: string; description: string; content: string; verifiableClaims: string[] };
  try {
    draft = JSON.parse(draftData.choices[0].message.content);
  } catch {
    return Response.json({ error: "Failed to parse draft" }, { status: 500 });
  }

  // ─── PASS 3: EDITORIAL REVIEW ──────────────────────────────────────────────
  const editRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${aiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{
        role: "user",
        content: `You are a senior editor reviewing a draft article. Score it and rewrite any weak sections.

ARTICLE DRAFT:
Title: ${draft.title}
---
${draft.content}
---

EVALUATION CRITERIA (score each 1–5):
1. Depth — does it go deeper than a basic Wikipedia summary?
2. Specificity — does it include concrete steps, numbers, examples?
3. FAQ quality — are the FAQ answers direct and useful, not vague?
4. Gaps filled — does it cover angles competitors miss?
5. AIEO readiness — does the opening paragraph directly answer the main question in 2 sentences?

For any section scoring below 4, rewrite it inline.

Output JSON:
{
  "scores": { "depth": 1-5, "specificity": 1-5, "faqQuality": 1-5, "gapsFilled": 1-5, "aieoReadiness": 1-5 },
  "overallScore": 1-5,
  "editedContent": "The full article with weak sections rewritten. Return the full MDX, not just the changes.",
  "editSummary": "2-3 sentences describing what you changed and why"
}`,
      }],
      response_format: { type: "json_object" },
      max_tokens: 4000,
    }),
  });

  let finalContent = draft.content;
  let editSummary = "";
  let scores: Record<string, number> = {};

  if (editRes.ok) {
    const editData = await editRes.json();
    try {
      const edited = JSON.parse(editData.choices[0].message.content);
      scores = edited.scores ?? {};
      editSummary = edited.editSummary ?? "";
      if (edited.overallScore >= 3 && edited.editedContent) {
        finalContent = edited.editedContent;
      }
    } catch { /* use unedited draft */ }
  }

  // ─── FACT-CHECK verifiable claims with Exa ────────────────────────────────
  const flaggedClaims: string[] = [];
  for (const claim of draft.verifiableClaims ?? []) {
    const exaRes = await fetch("https://api.exa.ai/search", {
      method: "POST",
      headers: { "x-api-key": exaKey, "Content-Type": "application/json" },
      body: JSON.stringify({ query: claim, num_results: 3, use_autoprompt: true }),
    });
    const exaData = exaRes.ok ? await exaRes.json() : null;
    const snippets = (exaData?.results ?? [])
      .map((r: { title?: string; text?: string }) => `${r.title}: ${(r.text ?? "").slice(0, 300)}`)
      .join("\n\n");

    const checkRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${aiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{
          role: "user",
          content: `CLAIM: "${claim}"\n\nWEB EVIDENCE:\n${snippets || "(none)"}\n\nIs this accurate? JSON: {"accurate": true|false, "reason": "string"}`,
        }],
        response_format: { type: "json_object" },
      }),
    });
    if (checkRes.ok) {
      const r = await checkRes.json();
      try {
        const parsed = JSON.parse(r.choices?.[0]?.message?.content ?? "{}");
        if (!parsed.accurate) flaggedClaims.push(`"${claim}" — ${parsed.reason}`);
      } catch { /* skip */ }
    }
  }

  const verified = flaggedClaims.length === 0;
  const today = new Date().toISOString().split("T")[0];

  const frontmatter = `---
title: "${draft.title.replace(/"/g, '\\"')}"
description: "${draft.description.replace(/"/g, '\\"')}"
date: "${today}"
tags: [${tags.map((t: string) => `"${t}"`).join(", ")}]
verifiableClaims:
${(draft.verifiableClaims ?? []).map((c) => `  - "${c.replace(/"/g, '\\"')}"`).join("\n")}
---

${finalContent}`;

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
    editSummary,
    scores,
    mdx: frontmatter,
  });
}
