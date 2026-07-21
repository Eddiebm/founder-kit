/**
 * Delaware Division of Corporations — DECIS API client
 *
 * Access: Requires a registered filer account from the DE Division of Corporations.
 * Apply at: https://corp.delaware.gov/onlinestatus.shtml
 * API docs: provided to authorized filers under NDA.
 *
 * Credential env vars required:
 *   DE_SOS_API_KEY    — issued by DE Division of Corporations to your filer account
 *   DE_SOS_FILER_ID   — your registered filer ID (numeric)
 *   DE_SOS_API_URL    — defaults to https://services.corp.delaware.gov/DECIS/api/v1
 */

const BASE_URL =
  process.env.DE_SOS_API_URL ?? "https://services.corp.delaware.gov/DECIS/api/v1";

function headers(): Record<string, string> {
  const key = process.env.DE_SOS_API_KEY;
  const filerId = process.env.DE_SOS_FILER_ID;
  if (!key) throw new Error("DE_SOS_API_KEY is not set");
  if (!filerId) throw new Error("DE_SOS_FILER_ID is not set");
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-API-Key": key,
    "X-Filer-ID": filerId,
  };
}

// ─── Types ───────────────────────────────────────────────────────────────────

export type EntityType = "LLC" | "CCORP";

export interface DelawareRegisteredAgent {
  /** Agent name as registered with DE SOS */
  name: string;
  /** Street address line 1 */
  address1: string;
  address2?: string;
  city: string;
  state: "DE";
  zip: string;
}

export interface DelawareLLCInput {
  entityType: "LLC";
  companyName: string;         // must end in LLC, L.L.C., etc.
  registeredAgent: DelawareRegisteredAgent;
  organizer: {
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    country?: string;
  };
  purpose?: string;            // defaults to "any lawful purpose"
  managementType?: "member" | "manager";
}

export interface DelawareCCorpInput {
  entityType: "CCORP";
  companyName: string;
  registeredAgent: DelawareRegisteredAgent;
  incorporator: {
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
  };
  authorizedShares?: number;   // defaults to 10,000,000
  parValueCents?: number;      // defaults to 0 (no par value)
  purpose?: string;
}

export type DelawareFilingInput = DelawareLLCInput | DelawareCCorpInput;

export interface DelawareFilingResponse {
  filingId: string;
  status: "submitted" | "processing" | "approved" | "rejected";
  entityNumber?: string;       // assigned when approved
  submittedAt: string;         // ISO timestamp
  estimatedCompletionDate?: string;
}

export interface DelawareFilingStatus {
  filingId: string;
  status: "submitted" | "processing" | "approved" | "rejected";
  entityNumber?: string;
  approvedAt?: string;
  rejectionReason?: string;
  documentUrl?: string;        // stamped Articles PDF when approved
}

export interface DelawareNameCheckResult {
  available: boolean;
  suggestions?: string[];
}

// ─── API calls ───────────────────────────────────────────────────────────────

/** Check if a company name is available in Delaware */
export async function checkNameAvailability(
  name: string
): Promise<DelawareNameCheckResult> {
  const res = await fetch(
    `${BASE_URL}/name-check?name=${encodeURIComponent(name)}`,
    { headers: headers(), method: "GET" }
  );
  if (!res.ok) {
    throw new Error(`DE SOS name check failed: ${res.status} ${await res.text()}`);
  }
  return res.json() as Promise<DelawareNameCheckResult>;
}

/** Submit a Certificate of Formation (LLC) or Certificate of Incorporation (C-Corp) */
export async function submitFiling(
  input: DelawareFilingInput
): Promise<DelawareFilingResponse> {
  const body =
    input.entityType === "LLC"
      ? buildLLCPayload(input)
      : buildCCorpPayload(input);

  const res = await fetch(`${BASE_URL}/filings`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`DE SOS filing submission failed: ${res.status} ${text}`);
  }

  return res.json() as Promise<DelawareFilingResponse>;
}

/** Poll the status of a previously submitted filing */
export async function getFilingStatus(
  filingId: string
): Promise<DelawareFilingStatus> {
  const res = await fetch(`${BASE_URL}/filings/${filingId}`, {
    method: "GET",
    headers: headers(),
  });
  if (!res.ok) {
    throw new Error(`DE SOS status check failed: ${res.status} ${await res.text()}`);
  }
  return res.json() as Promise<DelawareFilingStatus>;
}

/** Download the stamped Articles PDF for an approved filing */
export async function downloadStampedArticles(
  filingId: string
): Promise<ArrayBuffer> {
  const res = await fetch(`${BASE_URL}/filings/${filingId}/document`, {
    method: "GET",
    headers: { ...headers(), Accept: "application/pdf" },
  });
  if (!res.ok) {
    throw new Error(`DE SOS document download failed: ${res.status}`);
  }
  return res.arrayBuffer();
}

// ─── Payload builders ─────────────────────────────────────────────────────────

function buildLLCPayload(input: DelawareLLCInput): Record<string, unknown> {
  return {
    filingType: "certificate_of_formation",
    entityType: "LLC",
    entityName: input.companyName,
    registeredAgent: input.registeredAgent,
    organizer: input.organizer,
    purpose: input.purpose ?? "any lawful purpose permitted under Delaware law",
    managementType: input.managementType ?? "member",
    expedite: false,
  };
}

function buildCCorpPayload(input: DelawareCCorpInput): Record<string, unknown> {
  return {
    filingType: "certificate_of_incorporation",
    entityType: "CORPORATION",
    entityName: input.companyName,
    registeredAgent: input.registeredAgent,
    incorporator: input.incorporator,
    authorizedShares: input.authorizedShares ?? 10_000_000,
    parValue: input.parValueCents ?? 0,
    purpose: input.purpose ?? "any lawful purpose permitted under Delaware law",
    expedite: false,
  };
}
