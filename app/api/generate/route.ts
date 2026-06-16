import type { CompanyProfile, ScoredGrant } from "@/lib/types";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { getMonthlyCount, getLimit, recordUsage } from "@/lib/usage";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "anthropic/claude-sonnet-4-6";

interface GenerateRequest {
  profile: CompanyProfile;
  grant: ScoredGrant;
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not set");

  const token = getTokenFromRequest(request);
  const session = token ? await verifyToken(token) : null;
  if (!session) return new Response("Unauthorized", { status: 401 });

  const count = await getMonthlyCount(session.sub, "generate");
  const limit = getLimit(session.plan, "generate");
  if (count >= limit) {
    return new Response("Monthly generation limit reached. Upgrade to Pro for unlimited pitch generation.", { status: 429 });
  }

  const { profile, grant }: GenerateRequest = await request.json();
  await recordUsage(session.sub, "generate");

  const fundingType = profile.fundingType || "grant";
  const isFellowship = fundingType.toLowerCase().includes("fellowship");
  const isLoan = fundingType.toLowerCase().includes("loan");
  const isContract = fundingType.toLowerCase().includes("contract");

  const profileSummary = `Name: ${profile.companyName}
Description: ${profile.oneLiner}
Funding type sought: ${fundingType}
Stage: ${profile.stage}
Industry / Focus area: ${profile.focusArea}
Geography: ${profile.geography}
Revenue / Business model: ${profile.revenueModel}
Annual budget: ${profile.annualBudget}
Nonprofit status: ${profile.isNonprofit}
Description: ${profile.impactDescription}`.trim();

  const programLabel = isFellowship ? "Fellowship program" : isLoan ? "Financing program" : isContract ? "Contract opportunity" : "Grant program";
  const grantSummary = `${programLabel}: ${grant.name}
Funder / Issuer: ${grant.funder}
Award range: ${grant.awardRange}
Eligibility: ${grant.eligibilitySummary}
Why we're a fit: ${grant.fitRationale}`.trim();

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1500,
      stream: true,
      messages: [
        {
          role: "user",
          content: `You are a professional writer helping an applicant write a compelling pitch for a specific funding opportunity.

APPLICANT PROFILE:
${profileSummary}

TARGET OPPORTUNITY:
${grantSummary}

Write a tailored pitch for this specific ${isFellowship ? "fellowship" : isLoan ? "financing" : isContract ? "contract" : "grant"}. Requirements:
- Exactly 3-4 paragraphs
- Open with a compelling hook that speaks directly to the funder's/issuer's mission and priorities
- Paragraph 2: describe the problem or opportunity and the applicant's specific solution or qualifications
- Paragraph 3: highlight evidence, milestones, credentials, or a credible plan with specific targets
- Final paragraph: clear, specific ask — mention the award amount or funding size, how funds will be used (2-3 line items), and expected outcomes

Style guidelines:
- Use the applicant's real name/org name and actual focus area throughout — never generic placeholders
- Reference the ${programLabel.toLowerCase()} and funder/issuer by name at least once
- ${isFellowship ? "Write in first person singular (I/my) — this is an individual applicant" : "Write in first person plural (we/our)"}
- Be specific about geography, audience served, and mechanisms of change
- Professional but human tone — not corporate jargon
- Do NOT include a subject line or greeting — start directly with the pitch prose

After the pitch, add a section starting exactly with the text:
---FACT_CHECK---
Then list 4-6 specific claims or statistics that the founder should verify before submitting, as a bulleted list starting each line with "• ".`,
        },
      ],
    }),
  });

  if (!res.ok || !res.body) {
    console.error("OpenRouter error:", res.status);
    return new Response("Internal server error", { status: 500 });
  }

  // Pass the SSE stream through, extracting text deltas
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]") continue;
            try {
              const chunk = JSON.parse(data);
              const text = chunk.choices?.[0]?.delta?.content;
              if (typeof text === "string") {
                controller.enqueue(encoder.encode(text));
              }
            } catch {
              // skip malformed SSE lines
            }
          }
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
