import { GRANT_PROGRAMS } from "@/lib/grants";
import type { CompanyProfile, ScoredGrant } from "@/lib/types";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { getMonthlyCount, getLimit, recordUsage } from "@/lib/usage";
import { checkRateLimit } from "@/lib/rateLimit";
import { getDb } from "@/lib/db";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const SCORING_MODEL = "anthropic/claude-haiku-4-5-20251001";
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

function normalizeFocusArea(focusArea: string): string {
  const map: Record<string, string> = {
    "Climate & Environment": "Climate",
    "Agriculture & Food": "Agriculture",
  };
  return map[focusArea] ?? focusArea;
}

async function loadInactiveGrantIds(): Promise<Set<string>> {
  try {
    const db = getDb();
    const rows = await db("SELECT grant_id FROM grant_overrides WHERE is_active = false") as { grant_id: string }[];
    return new Set(rows.map((r) => r.grant_id));
  } catch {
    return new Set();
  }
}

function preFilterGrants(profile: CompanyProfile, inactiveIds: Set<string> = new Set()) {
  const stage = profile.stage?.toLowerCase() ?? "";
  const geo = profile.geography?.toLowerCase() ?? "";
  const isNonprofit = profile.isNonprofit?.toLowerCase() === "yes";

  const geoIsUS = /united states|u\.s\.|^us$/.test(geo);
  const geoIsAfrica = /africa|ghana|nigeria|kenya|ethiopia|sub-saharan/.test(geo);
  const geoIsEurope = /europe/.test(geo);
  const geoIsMENA = /middle east|north africa|mena/.test(geo);
  const geoIsGlobal = !geoIsUS && !geoIsAfrica && !geoIsEurope && !geoIsMENA;

  // Growth/Series B+ companies skip the stage filter — grants rarely cap by upper stage
  const isGrowthStage = /growth|series b|series c/.test(stage);

  return GRANT_PROGRAMS.filter((g) => {
    if (inactiveIds.has(g.id)) return false;
    if (g.requiresNonprofit && !isNonprofit) return false;

    const grantGeos = g.geographies.map((x) => x.toLowerCase());
    const grantHasGlobal = grantGeos.includes("global");
    const grantHasUS = grantGeos.includes("united states");
    const grantHasAfrica = grantGeos.some((x) => x.includes("africa") || x.includes("sub-saharan"));
    const grantHasEurope = grantGeos.some((x) => x.includes("europe"));
    const grantHasMENA = grantGeos.some((x) => x.includes("middle east") || x.includes("north africa") || x.includes("mena"));

    if (geoIsUS && !grantHasUS && !grantHasGlobal) return false;
    if (geoIsAfrica && !grantHasAfrica && !grantHasGlobal) return false;
    if (geoIsEurope && !grantHasEurope && !grantHasGlobal) return false;
    if (geoIsMENA && !grantHasMENA && !grantHasGlobal) return false;
    if (geoIsGlobal && !grantHasGlobal && !grantHasUS && !grantHasAfrica) return false;

    if (!isGrowthStage && stage) {
      const grantStages = g.stages.map((s) => s.toLowerCase());
      if (!grantStages.some((s) => s.includes(stage) || stage.includes(s.replace(/-/g, "")))) {
        return false;
      }
    }

    return true;
  });
}

async function scoreDatabase(
  profile: CompanyProfile,
  apiKey: string,
  inactiveIds: Set<string> = new Set()
): Promise<{ id: string; fitScore: "High" | "Medium" | "Low"; fitRationale: string }[]> {
  const candidates = preFilterGrants(profile, inactiveIds);
  if (candidates.length === 0) return [];

  const grantsJson = JSON.stringify(
    candidates.map((g) => ({
      id: g.id,
      name: g.name,
      funder: g.funder,
      eligibilitySummary: g.eligibilitySummary,
      focusAreas: g.focusAreas,
      geographies: g.geographies,
      stages: g.stages,
    }))
  );

  const profileSummary = buildProfileSummary(profile);

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: SCORING_MODEL,
      max_tokens: 8192,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: `You are a funding matching expert. Score each grant program for this applicant.

APPLICANT PROFILE:
${profileSummary}

GRANT PROGRAMS (JSON):
${grantsJson}

Return a JSON object with a "scores" array. Each element must have:
- "id": the program id string (copy exactly)
- "fitScore": "High", "Medium", or "Low"
- "fitRationale": one specific sentence (15-25 words) referencing the applicant's actual sector and geography

Scoring:
- High: strong match on funding type, sector, geography, and stage
- Medium: partial match — some factors align, others don't
- Low: significant mismatch in eligibility or focus

Prioritize programs matching funding type: ${profile.fundingType || "grant"}.
Reference the applicant's actual sector (${normalizeFocusArea(profile.focusArea ?? "")}) and geography (${profile.geography}) in each rationale.`,
        },
      ],
    }),
  });

  if (!res.ok) return [];
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content ?? "";

  try {
    const parsed = JSON.parse(content);
    return Array.isArray(parsed.scores) ? parsed.scores : [];
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
      model: SCORING_MODEL,
      max_tokens: 2048,
      response_format: { type: "json_object" },
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

Extract any REAL, ACTIVE grant programs or funding opportunities from the results that are NOT in the already-known list and are genuinely relevant to the company profile. Return a JSON object with a "grants" array. Each element must have:
- "id": slug like "funder-program-name" (lowercase, hyphens)
- "name": official program name
- "funder": organization offering the grant
- "awardRange": funding amount (e.g. "$50K–$200K" or "Up to $500K")
- "eligibilitySummary": 1-2 sentence eligibility description
- "focusAreas": array from ["Healthcare","Education","Climate","Agriculture","Financial Inclusion","Technology & AI","Media & Journalism","Arts & Culture","Research & Science","Other"]
- "geographies": array from ["Sub-Saharan Africa","South Asia","Southeast Asia","Latin America","Europe","Middle East & North Africa","Global","United States"]
- "stages": array from ["Pre-seed","Seed","Series A","Growth / Series B+","Nonprofit","Established Business"]
- "requiresNonprofit": boolean
- "url": the grant's actual URL from search results
- "submissionType": "portal" (use "email" only if results explicitly say email submission, "invitation" if invite-only)
- "fitScore": "High", "Medium", or "Low" for this specific company
- "fitRationale": 1 specific sentence (15-25 words) explaining the fit
- "source": "web"

Only include real programs with verifiable URLs. If no new relevant grants are found, return { "grants": [] }.`,
        },
      ],
    }),
  });

  if (!res.ok) return [];
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content ?? "";

  try {
    const parsed = JSON.parse(content);
    return Array.isArray(parsed.grants) ? parsed.grants as ScoredGrant[] : [];
  } catch {
    return [];
  }
}

function buildProfileSummary(profile: CompanyProfile): string {
  return `Name: ${profile.companyName}
One-liner: ${profile.oneLiner}
Funding type sought: ${profile.fundingType}
Stage: ${profile.stage}
Industry / Focus area: ${normalizeFocusArea(profile.focusArea ?? "")}
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

  if (session) {
    const count = await getMonthlyCount(session.sub, "score");
    const limit = getLimit(session.plan, "score");
    if (count >= limit) {
      return Response.json(
        { error: "Monthly search limit reached. Upgrade to Pro for unlimited searches." },
        { status: 429 }
      );
    }
  } else {
    const { allowed, retryAfter } = await checkRateLimit(request, "grants-anon", 3, 86400); // 3/day for anonymous
    if (!allowed) {
      return Response.json(
        { error: "You've used your 3 free searches today. Sign up free for more.", anon: true },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }
  }

  const profile: CompanyProfile = await request.json();
  const exaKey = process.env.EXA_API_KEY;
  const inactiveIds = await loadInactiveGrantIds();
  const candidates = preFilterGrants(profile, inactiveIds);
  const key = openrouterKey;
  const encoder = new TextEncoder();

  const body = new ReadableStream({
    async start(controller) {
      const emit = (event: object) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));

      // Phase 1: emit all candidate grants immediately — UI renders in <200ms
      for (const grant of candidates) {
        emit({
          type: "grant",
          grant: { ...grant, fitScore: "Low" as const, fitRationale: "Analyzing…", source: "database" as const },
        });
      }

      // Phase 2: score + Exa in parallel
      const [dbScores, webResults] = await Promise.all([
        scoreDatabase(profile, key, inactiveIds),
        exaKey ? searchExa(profile, exaKey) : Promise.resolve([] as ExaResult[]),
      ]);

      // Phase 3: stream score updates so badges resolve one-by-one
      for (const s of dbScores) {
        emit({ type: "score", id: s.id, fitScore: s.fitScore, fitRationale: s.fitRationale });
      }

      // Phase 4: web grants (High-fit only)
      if (webResults.length > 0) {
        const existingNames = new Set(GRANT_PROGRAMS.map((g) => g.name));
        const webGrants = await extractWebGrants(webResults, profile, key, existingNames);
        for (const g of webGrants.filter((g) => g.fitScore === "High")) {
          emit({ type: "grant", grant: g });
        }
      }

      if (session) await recordUsage(session.sub, "score");
      emit({ type: "done" });
      controller.close();
    },
  });

  return new Response(body, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
  });
}
