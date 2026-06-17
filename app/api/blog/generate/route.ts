import { getDb } from "@/lib/db";

// Four-pass article generation:
// 1. RESEARCH  — Gemini Flash: competitor gap analysis via Exa
// 2. DRAFT     — Claude Opus 4.8: deep, opinionated first draft
// 3. EDITORIAL — Claude Opus 4.8: scores depth/specificity, rewrites weak sections
// 4. HUMANIZE  — Claude Opus 4.8: strips AI-isms, adds voice, varies rhythm
// POST { topic, slug, keyword, tags }

const WRITER = "anthropic/claude-sonnet-4-6";
const FLASH = "google/gemini-2.5-flash";

async function ai(
  model: string,
  prompt: string,
  aiKey: string,
  maxTokens = 4000
): Promise<string> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${aiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: maxTokens,
    }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`AI call failed (${model}): ${res.status} ${t}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "{}";
}

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

  // ── PASS 1: RESEARCH ──────────────────────────────────────────────────────
  const [competitorRes, authorityRes] = await Promise.all([
    fetch("https://api.exa.ai/search", {
      method: "POST",
      headers: { "x-api-key": exaKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        query: keyword,
        num_results: 5,
        use_autoprompt: true,
        contents: { text: { max_characters: 2500 } },
      }),
    }),
    fetch("https://api.exa.ai/search", {
      method: "POST",
      headers: { "x-api-key": exaKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `site:gov OR site:sba.gov OR site:irs.gov OR site:grants.gov ${keyword}`,
        num_results: 3,
        use_autoprompt: true,
        contents: { text: { max_characters: 2000 } },
      }),
    }),
  ]);

  const competitorData = competitorRes.ok ? await competitorRes.json() : { results: [] };
  const authorityData = authorityRes.ok ? await authorityRes.json() : { results: [] };

  const competitorSummary = (competitorData.results ?? [])
    .map((r: { title?: string; url?: string; text?: string }) =>
      `URL: ${r.url}\nTitle: ${r.title}\nContent: ${(r.text ?? "").slice(0, 1000)}`
    ).join("\n\n---\n\n");

  const authoritySummary = (authorityData.results ?? [])
    .map((r: { title?: string; url?: string; text?: string }) =>
      `URL: ${r.url}\nTitle: ${r.title}\nContent: ${(r.text ?? "").slice(0, 800)}`
    ).join("\n\n---\n\n");

  let gaps = { topicsCovered: [] as string[], gapsAndWeaknesses: [] as string[], valuableStats: [] as string[], faqQuestions: [] as string[] };
  try {
    const raw = await ai(FLASH, `You are an SEO strategist. Analyze competing articles for "${keyword}" and identify gaps.

TOP COMPETING ARTICLES:
${competitorSummary || "(no results)"}

AUTHORITATIVE SOURCES:
${authoritySummary || "(no results)"}

Output JSON:
{
  "topicsCovered": ["topics competitors cover"],
  "gapsAndWeaknesses": ["topics, questions, or angles competitors miss or handle poorly — be specific"],
  "valuableStats": ["specific facts, dollar amounts, dates, URLs from authoritative sources"],
  "faqQuestions": ["8 specific, real-world questions founders ask about this topic"]
}`, aiKey, 1500);
    gaps = JSON.parse(raw);
  } catch { /* use defaults */ }

  // ── PASS 2: DRAFT (Claude Opus 4.8) ───────────────────────────────────────
  const draftRaw = await ai(WRITER, `You are writing the definitive, most useful guide on the internet about "${topic}" for US founders, nonprofit leaders, and small business owners.

RESEARCH BRIEF:
- Target keyword: "${keyword}"
- What competitors already cover (don't just repeat this): ${JSON.stringify(gaps.topicsCovered)}
- Gaps you MUST fill — this is your competitive advantage: ${JSON.stringify(gaps.gapsAndWeaknesses)}
- Authoritative facts to weave in: ${JSON.stringify(gaps.valuableStats)}
- FAQ questions to answer (from real founder research): ${JSON.stringify(gaps.faqQuestions)}

WRITING STANDARDS:
- 1,400–2,000 words — longer and deeper than competing articles
- Paragraph 1: 2–3 sentences that directly answer the main question — AI engines cite this as the featured snippet
- Mix short punchy sentences with longer explanatory ones — vary the rhythm deliberately
- Write like an expert talking to a smart friend, not a textbook talking to a student
- Use "you" throughout — never "founders" or "businesses" or "one should"
- Use contractions everywhere: you're, don't, it's, you'll, can't
- Include a "Common Mistakes" or "What Nobody Tells You" section — this gap exists in almost all competing articles
- Be specific: exact form names, exact URLs, exact dollar amounts, exact timelines
- Have a point of view — if something is confusing or broken, say so ("SAM.gov's interface hasn't been updated since 2014 — here's how to navigate it anyway")
- End with a FAQ section answering all 8 questions from the brief, directly and specifically
- Link to authoritative sources (sam.gov, sba.gov, irs.gov, grants.gov) inline
- Do NOT mention Founder Kit

Output JSON:
{
  "title": "Exact H1 title — keyword-rich but sounds like something a human would write",
  "description": "Meta description 120–155 chars — answer the question directly",
  "content": "Full MDX markdown",
  "verifiableClaims": ["5–8 specific factual claims that could go stale: exact dollar amounts, specific URLs, policy details, deadlines, form names"]
}`, aiKey, 5000);

  let draft: { title: string; description: string; content: string; verifiableClaims: string[] };
  try {
    draft = JSON.parse(draftRaw);
  } catch {
    return Response.json({ error: "Failed to parse draft" }, { status: 500 });
  }

  // ── PASS 3: EDITORIAL (Claude Opus 4.8) ────────────────────────────────────
  let editedContent = draft.content;
  let editSummary = "";
  let scores: Record<string, number> = {};

  try {
    const editRaw = await ai(WRITER, `You are a senior editor doing a quality pass on a draft article. Be ruthless.

DRAFT:
Title: ${draft.title}
---
${draft.content}
---

SCORE each dimension 1–5 and rewrite any section scoring below 4:
1. Depth — does it go deeper than a Wikipedia summary?
2. Specificity — concrete steps, exact numbers, real examples?
3. FAQ quality — direct useful answers, or vague non-answers?
4. Competitive differentiation — does it say anything competitors don't?
5. Opening strength — does paragraph 1 directly answer the question in 2–3 sentences?

For any section scoring below 4: rewrite it completely, don't just touch it up.

Output JSON:
{
  "scores": { "depth": 1-5, "specificity": 1-5, "faqQuality": 1-5, "differentiation": 1-5, "openingStrength": 1-5 },
  "overallScore": 1-5,
  "editedContent": "Full rewritten MDX — include the entire article, not just changed sections",
  "editSummary": "2–3 sentences: what you changed and why"
}`, aiKey, 5000);

    const edited = JSON.parse(editRaw);
    scores = edited.scores ?? {};
    editSummary = edited.editSummary ?? "";
    if (edited.editedContent && (edited.overallScore ?? 0) >= 2) {
      editedContent = edited.editedContent;
    }
  } catch { /* keep draft */ }

  // ── PASS 4: HUMANIZE (Claude Opus 4.8) ─────────────────────────────────────
  let finalContent = editedContent;

  try {
    const humanRaw = await ai(WRITER, `You are a professional editor specializing in making AI-generated content read like it was written by a sharp, experienced human practitioner.

ARTICLE TO HUMANIZE:
---
${editedContent}
---

YOUR JOB:
Strip every AI-ism and replace it with natural human writing. Specifically:

FIND AND ELIMINATE:
- Filler openers: "In today's world", "In the realm of", "It's worth noting", "It's important to understand", "As we navigate"
- Corporate buzzwords: "leverage", "utilize", "robust", "seamlessly", "streamline", "paramount", "facilitate", "delve into"
- Hedge phrases: "may potentially", "it could be argued", "one might consider"
- Passive voice constructions — rewrite as active
- Overly even sentence lengths — break them up, add short punchy sentences
- Any section that sounds like a checklist read by a robot

WHAT TO ADD:
- Contractions everywhere: don't, you'll, it's, you're, can't, won't
- Occasional rhetorical questions: "Why does this matter? Because..."
- Specific frustrations that real people have: "SAM.gov is genuinely confusing — the form labels are inconsistent and the help docs are outdated"
- Strong declarative sentences with no hedging: "Don't wait until your grant deadline. SAM.gov takes 3 business days to activate."
- Natural transitions: "Here's the thing:", "What nobody tells you:", "The short answer:", "Bottom line:"
- Second-person directness: "you" not "applicants" or "organizations"

Keep all factual content and structure intact. Only change the voice and rhythm.

Output JSON:
{
  "humanizedContent": "Full MDX with humanized prose — complete article",
  "changesSummary": "2 sentences describing the key voice changes made"
}`, aiKey, 5000);

    const humanized = JSON.parse(humanRaw);
    if (humanized.humanizedContent) {
      finalContent = humanized.humanizedContent;
    }
  } catch { /* keep editorial version */ }

  // ── FACT-CHECK verifiable claims ──────────────────────────────────────────
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

    try {
      const checkRaw = await ai(FLASH, `CLAIM: "${claim}"
WEB EVIDENCE: ${snippets || "(none)"}
JSON: {"accurate": true|false, "reason": "string"}`, aiKey, 200);
      const parsed = JSON.parse(checkRaw);
      if (!parsed.accurate) flaggedClaims.push(`"${claim}" — ${parsed.reason}`);
    } catch { /* skip claim */ }
  }

  const verified = flaggedClaims.length === 0;
  const today = new Date().toISOString().split("T")[0];

  const mdx = `---
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

  return Response.json({ ok: true, slug, title: draft.title, verified, flaggedClaims, editSummary, scores, mdx });
}
