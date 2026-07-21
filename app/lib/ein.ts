/**
 * IRS EIN (Employer Identification Number) — SS-4 automation
 *
 * The IRS does not expose a public REST API for EIN issuance.
 * Options in production order of preference:
 *
 * 1. IRS e-Services / TDS (Tax Data Services) — requires an IRS e-Services account
 *    and a written agreement. Available to tax professionals and authorized third parties.
 *    Endpoint (once approved): https://la.www4.irs.gov/e-services/ (SOAP-based)
 *
 * 2. Third-party EIN services (IRS-authorized) — e.g. IRS.com, EIN-ITIN.com.
 *    These act as authorized agents and submit SS-4 on your behalf via their API.
 *
 * 3. Fax/mail fallback — generate a completed SS-4 PDF and fax to (855) 641-6935.
 *    EIN arrives within 4 business days.
 *
 * This client is wired for option 2 via a generic authorized-agent API shape.
 * Swap BASE_URL and payload structure to match whichever provider you contract with.
 *
 * Credential env vars required:
 *   EIN_PROVIDER_API_KEY  — API key from your authorized EIN provider
 *   EIN_PROVIDER_API_URL  — provider's base URL
 */

const BASE_URL = process.env.EIN_PROVIDER_API_URL ?? "https://api.ein-provider.example.com/v1";

function headers(): Record<string, string> {
  const key = process.env.EIN_PROVIDER_API_KEY;
  if (!key) throw new Error("EIN_PROVIDER_API_KEY is not set");
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${key}`,
  };
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type EntityClass =
  | "sole_proprietor"
  | "partnership"
  | "llc_single"
  | "llc_multi"
  | "corporation"
  | "nonprofit";

export interface SS4Input {
  /** Legal name of entity exactly as filed with the state */
  legalName: string;
  entityClass: EntityClass;
  /** State of formation */
  stateOfFormation: string;
  /** Date of formation or incorporation (ISO date string) */
  formationDate: string;
  /** Responsible party — the individual the IRS holds accountable */
  responsibleParty: {
    name: string;
    ssn?: string;   // required for individuals; omit for entities
    ein?: string;   // use if responsible party is itself an entity
    address: string;
    city: string;
    state: string;
    zip: string;
    country?: string;
  };
  /** Principal business address */
  businessAddress: {
    address: string;
    city: string;
    state: string;
    zip: string;
    country?: string;
  };
  /** Reason for applying */
  reasonForApplying?: string;
  /** Primary business activity (line 16 on SS-4) */
  primaryActivity?: string;
  /** Specific products or services */
  specificProducts?: string;
  /** Expected number of employees in 12 months */
  expectedEmployees?: number;
  /** Date first wages/annuities paid if any */
  firstWagesDate?: string;
}

export interface EINApplicationResponse {
  applicationId: string;
  status: "submitted" | "processing" | "approved" | "rejected" | "pending_fax";
  submittedAt: string;
  estimatedCompletionDate?: string;
}

export interface EINApplicationStatus {
  applicationId: string;
  status: "submitted" | "processing" | "approved" | "rejected" | "pending_fax";
  ein?: string;                  // assigned when approved
  approvedAt?: string;
  rejectionReason?: string;
  /** URL to the official IRS CP 575 / 147C confirmation letter PDF */
  confirmationLetterUrl?: string;
}

// ─── API calls ────────────────────────────────────────────────────────────────

/** Submit an SS-4 application for a new EIN */
export async function applyForEin(input: SS4Input): Promise<EINApplicationResponse> {
  const res = await fetch(`${BASE_URL}/applications`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(buildSS4Payload(input)),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`EIN application submission failed: ${res.status} ${text}`);
  }

  return res.json() as Promise<EINApplicationResponse>;
}

/** Poll EIN application status */
export async function getEinStatus(applicationId: string): Promise<EINApplicationStatus> {
  const res = await fetch(`${BASE_URL}/applications/${applicationId}`, {
    method: "GET",
    headers: headers(),
  });
  if (!res.ok) {
    throw new Error(`EIN status check failed: ${res.status} ${await res.text()}`);
  }
  return res.json() as Promise<EINApplicationStatus>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildSS4Payload(input: SS4Input): Record<string, unknown> {
  return {
    legalName: input.legalName,
    entityType: input.entityClass,
    stateOfFormation: input.stateOfFormation,
    formationDate: input.formationDate,
    responsibleParty: input.responsibleParty,
    businessAddress: input.businessAddress,
    reasonForApplying: input.reasonForApplying ?? "Started new business",
    primaryActivity: input.primaryActivity ?? "General business activities",
    specificProducts: input.specificProducts ?? "",
    expectedEmployees: input.expectedEmployees ?? 0,
    ...(input.firstWagesDate ? { firstWagesDate: input.firstWagesDate } : {}),
  };
}

/**
 * Map the wizard's entity type to the SS-4 entity class.
 * LLC membership count affects single vs multi-member classification.
 */
export function resolveEntityClass(
  entityType: string,
  memberCount: number
): EntityClass {
  if (entityType === "llc") {
    return memberCount === 1 ? "llc_single" : "llc_multi";
  }
  if (entityType === "ccorp") return "corporation";
  if (entityType === "nonprofit") return "nonprofit";
  return "corporation";
}
