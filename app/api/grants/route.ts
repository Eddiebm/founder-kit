export const runtime = "edge";

import { GRANT_PROGRAMS } from "@/lib/grants";
import type { CompanyProfile, ScoredGrant } from "@/lib/types";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "anthropic/claude-sonnet-4-6";

export async function POST(request: Request) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not set");

  const profile: CompanyProfile = await request.json();

  const grantsJson = JSON.stringify(
    GRANT_PROGRAMS.map((g) => ({
      id: g.id,
      name: g.name,
      funder: g.funder,
      awardRange: g.awardRange,
      eligibilitySummary: g.eligibilitySummary,
      focusAreas: g.focusAreas,
      geographies: g.geographies,
      stages: g.stages,
      requiresNonprofit: g.requiresNonprofit,
    })),
    null,
    2
  );

  const profileSummary = `Company: ${profile.companyName}
One-liner: ${profile.oneLiner}
Stage: ${profile.stage}
Focus area: ${profile.focusArea}
Geography: ${profile.geography}
Revenue model: ${profile.revenueModel}
Annual budget: ${profile.annualBudget}
Registered nonprofit: ${profile.isNonprofit}
Impact description: ${profile.impactDescription}`.trim();

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `You are a grant matching expert for social enterprises. Score each grant program for this organization.

COMPANY PROFILE:
${profileSummary}

GRANT PROGRAMS (JSON):
${grantsJson}

For each grant, respond with a JSON array. Each element must have exactly these fields:
- "id": the grant id string
- "fitScore": exactly one of "High", "Medium", or "Low"
- "fitRationale": a single specific sentence (15-25 words) explaining why this grant is or isn't a fit

Scoring guidance:
- High: 3+ alignment factors (focus area, geography, stage, nonprofit status all match)
- Medium: 1-2 alignment factors match but some gaps exist
- Low: significant eligibility or focus mismatches

Be specific in rationales — reference the company's actual focus area and geography.

Respond with ONLY the JSON array, no other text.`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("OpenRouter error:", res.status, text);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }

  let scores: { id: string; fitScore: "High" | "Medium" | "Low"; fitRationale: string }[];
  try {
    const raw = content.trim();
    const jsonStr = raw.startsWith("```")
      ? raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "")
      : raw;
    scores = JSON.parse(jsonStr);
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }

  const scoreMap = new Map(scores.map((s) => [s.id, s]));
  const scoredGrants: ScoredGrant[] = GRANT_PROGRAMS.map((grant) => {
    const score = scoreMap.get(grant.id);
    return {
      ...grant,
      fitScore: score?.fitScore ?? "Low",
      fitRationale: score?.fitRationale ?? "No specific rationale available.",
    };
  });

  const order = { High: 0, Medium: 1, Low: 2 };
  scoredGrants.sort((a, b) => order[a.fitScore] - order[b.fitScore]);

  return Response.json(scoredGrants);
}
