import { GRANT_PROGRAMS } from "@/lib/grants";
import type { CompanyProfile, ScoredGrant } from "@/lib/types";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { getMonthlyCount, getLimit, recordUsage } from "@/lib/usage";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "anthropic/claude-sonnet-4-6";
const EXA_URL = "https://api.exa.ai/search";

interface ExaResult {
  url: string;
  title: string;
  text?: string;
}

async function searchExa(profile: CompanyProfile, apiKey: string): Promise<ExaResult[]> {
  const fundingKeyword = profile.fundingType?.toLowerCase().includes("fellowship") ? "fellowship"
    : profile.fundingType?.toLowerCase().includes("loan") ? "loan grant financing"
    : profile.fundingType?.toLowerCase().includes("contract") ? "government contract RFP funding"
    : profile.fundingType?.toLowerCase().includes("equity") ? "venture investment grant funding"
    : profile.fundingType?.toLowerCase().includes("prize") ? "prize competition funding"
    : "grant funding opportunity";
  const query = `${fundingKeyword} ${profile.focusArea} ${profile.geography} ${profile.stage} 2024 2025`;

  const res = await fetch(EXA_URL, {
    method: "POST",
    headers: { "x-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      num_results: 10,
      use_autoprompt: true,
      type: "neural",
      contents: { text: { maxCharacters: 800 } },
    }),
  });

  if (!res.ok) return [];
  const data: { results?: ExaResult[] } = await res.json();
  return data.results ?? [];
}

async function scoreDatabase(
  profile: CompanyProfile,
  apiKey: string
): Promise<{ id: string; fitScore: "High" | "Medium" | "Low"; fitRationale: string }[]> {
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

  const profileSummary = buildProfileSummary(profile);

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: `You are a funding matching expert. Score each program for this applicant based on their stated funding type and profile.

APPLICANT PROFILE:
${profileSummary}

FUNDING PROGRAMS (JSON):
${grantsJson}

For each program, respond with a JSON array. Each element must have exactly these fields:
- "id": the program id string
- "fitScore": exactly one of "High", "Medium", or "Low"
- "fitRationale": a single specific sentence (15-25 words) explaining the fit

Scoring guidance:
- Prioritize programs that match the stated funding type (${profile.fundingType || "grant"})
- High: strong alignment on funding type, industry/focus, geography, and stage
- Medium: partial alignment — some factors match, others don't
- Low: significant mismatch in funding type, eligibility, or focus

Be specific in rationales — reference the applicant's actual industry and geography.

Respond with ONLY the JSON array, no other text.`,
        },
      ],
    }),
  });

  if (!res.ok) return [];
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content ?? "";

  try {
    const raw = content.trim();
    const jsonStr = raw.startsWith("```")
      ? raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "")
      : raw;
    return JSON.parse(jsonStr);
  } catch {
    return [];
  }
}

async function extractWebGrants(
  webResults: ExaResult[],
  profile: CompanyProfile,
  apiKey: string,
  existingNames: Set<string>
): Promise<ScoredGrant[]> {
  const webSummary = webResults
    .map((r, i) => `[${i + 1}] ${r.title}\nURL: ${r.url}\n${r.text ?? ""}`)
    .join("\n\n---\n\n");

  const profileSummary = buildProfileSummary(profile);

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `You are a grant research expert. Extract real grant programs from these web search results for this organization.

COMPANY PROFILE:
${profileSummary}

ALREADY KNOWN GRANTS (skip these):
${Array.from(existingNames).join(", ")}

WEB SEARCH RESULTS:
${webSummary}

Extract any REAL, ACTIVE grant programs or funding opportunities from the results that are NOT in the already-known list and are genuinely relevant to the company profile. For each one found, return a JSON array where each element has:
- "id": slug like "funder-program-name" (lowercase, hyphens)
- "name": official program name
- "funder": organization offering the grant
- "awardRange": funding amount (e.g. "$50K–$200K" or "Up to $500K")
- "eligibilitySummary": 1-2 sentence eligibility description
- "focusAreas": array from ["Healthcare","Education","Climate","Agriculture","Financial Inclusion","Other"]
- "geographies": array from ["Sub-Saharan Africa","South Asia","Southeast Asia","Latin America","Global","United States"]
- "stages": array from ["Pre-seed","Seed","Series A","Nonprofit"]
- "requiresNonprofit": boolean
- "url": the grant's actual URL from search results
- "submissionType": "portal" (use "email" only if results explicitly say email submission, "invitation" if invite-only)
- "fitScore": "High", "Medium", or "Low" for this specific company
- "fitRationale": 1 specific sentence (15-25 words) explaining the fit
- "source": "web"

Only include real programs with verifiable URLs. If no new relevant grants are found, return an empty array [].
Respond with ONLY the JSON array, no other text.`,
        },
      ],
    }),
  });

  if (!res.ok) return [];
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content ?? "";

  try {
    const raw = content.trim();
    const jsonStr = raw.startsWith("```")
      ? raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "")
      : raw;
    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed)) return [];
    return parsed as ScoredGrant[];
  } catch {
    return [];
  }
}

function buildProfileSummary(profile: CompanyProfile): string {
  return `Name: ${profile.companyName}
One-liner: ${profile.oneLiner}
Funding type sought: ${profile.fundingType}
Stage: ${profile.stage}
Industry / Focus area: ${profile.focusArea}
Geography: ${profile.geography}
Revenue / Business model: ${profile.revenueModel}
Annual budget: ${profile.annualBudget}
Nonprofit status: ${profile.isNonprofit}
Description: ${profile.impactDescription}`.trim();
}

export async function POST(request: Request) {
  const openrouterKey = process.env.OPENROUTER_API_KEY;
  if (!openrouterKey) throw new Error("OPENROUTER_API_KEY is not set");

  const token = getTokenFromRequest(request);
  const session = token ? await verifyToken(token) : null;
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const count = await getMonthlyCount(session.sub, "score");
  const limit = getLimit(session.plan, "score");
  if (count >= limit) {
    return Response.json(
      { error: "Monthly search limit reached. Upgrade to Pro for unlimited searches." },
      { status: 429 }
    );
  }

  const profile: CompanyProfile = await request.json();
  const exaKey = process.env.EXA_API_KEY;

  // Run database scoring and Exa search in parallel
  const [dbScores, webResults] = await Promise.all([
    scoreDatabase(profile, openrouterKey),
    exaKey ? searchExa(profile, exaKey) : Promise.resolve([] as ExaResult[]),
  ]);

  // Build scored database grants
  const scoreMap = new Map(dbScores.map((s) => [s.id, s]));
  const order = { High: 0, Medium: 1, Low: 2 };

  const dbGrants: ScoredGrant[] = GRANT_PROGRAMS.map((grant) => {
    const score = scoreMap.get(grant.id);
    return {
      ...grant,
      fitScore: score?.fitScore ?? "Low",
      fitRationale: score?.fitRationale ?? "No specific rationale available.",
      source: "database" as const,
    };
  }).sort((a, b) => order[a.fitScore] - order[b.fitScore]);

  // If Exa found results, extract web grants in parallel-ish (already have web results)
  let webGrants: ScoredGrant[] = [];
  if (webResults.length > 0) {
    const existingNames = new Set(GRANT_PROGRAMS.map((g) => g.name));
    webGrants = await extractWebGrants(webResults, profile, openrouterKey, existingNames);
  }

  await recordUsage(session.sub, "score");

  // Merge: web High-fit grants first, then database sorted, then web Medium/Low
  const webHigh = webGrants.filter((g) => g.fitScore === "High");
  const webOther = webGrants.filter((g) => g.fitScore !== "High");
  const combined = [...webHigh, ...dbGrants, ...webOther];

  return Response.json(combined);
}
