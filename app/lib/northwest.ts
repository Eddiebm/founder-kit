/**
 * Northwest Registered Agent — Partner API client
 *
 * Access: Requires a reseller/partner account with Northwest Registered Agent.
 * Apply at: https://www.northwestregisteredagent.com/partner-program
 * API docs: provided to approved partners.
 *
 * Credential env vars required:
 *   NORTHWEST_API_KEY     — partner API key
 *   NORTHWEST_PARTNER_ID  — your partner/reseller ID
 *   NORTHWEST_API_URL     — defaults to https://api.northwestregisteredagent.com/v1
 */

const BASE_URL =
  process.env.NORTHWEST_API_URL ?? "https://api.northwestregisteredagent.com/v1";

function headers(): Record<string, string> {
  const key = process.env.NORTHWEST_API_KEY;
  const partnerId = process.env.NORTHWEST_PARTNER_ID;
  if (!key) throw new Error("NORTHWEST_API_KEY is not set");
  if (!partnerId) throw new Error("NORTHWEST_PARTNER_ID is not set");
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${key}`,
    "X-Partner-ID": partnerId,
  };
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NorthwestOrderInput {
  /** ISO 2-letter state code where the entity is being formed */
  state: string;
  entityType: "LLC" | "CORPORATION";
  companyName: string;
  /** Client contact — used for agent service notifications */
  clientEmail: string;
  clientName: string;
  /** Billing year count — typically 1 (auto-renews annually) */
  serviceYears?: number;
  /** Webhook URL for status events; omit to use the default configured in partner portal */
  webhookUrl?: string;
}

export interface NorthwestOrderResponse {
  orderId: string;
  agentName: string;              // e.g. "Northwest Registered Agent, LLC"
  agentAddress: NorthwestAgentAddress;
  status: "pending" | "active" | "cancelled";
  serviceStartDate: string;       // ISO date
  annualRenewalDate: string;
  confirmationNumber: string;
}

export interface NorthwestAgentAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
}

export interface NorthwestOrderStatus {
  orderId: string;
  status: "pending" | "active" | "cancelled";
  agentName: string;
  agentAddress: NorthwestAgentAddress;
  documents: Array<{
    type: "consent_to_act" | "annual_report_reminder" | "other";
    url: string;
    uploadedAt: string;
  }>;
}

// ─── API calls ────────────────────────────────────────────────────────────────

/**
 * Place a registered agent service order for one state.
 * Returns the agent's address — this goes into the DE SOS filing as the
 * registered office address.
 */
export async function placeAgentOrder(
  input: NorthwestOrderInput
): Promise<NorthwestOrderResponse> {
  const res = await fetch(`${BASE_URL}/orders`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      state: input.state.toUpperCase(),
      entityType: input.entityType,
      companyName: input.companyName,
      clientEmail: input.clientEmail,
      clientName: input.clientName,
      serviceYears: input.serviceYears ?? 1,
      ...(input.webhookUrl ? { webhookUrl: input.webhookUrl } : {}),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Northwest RA order failed: ${res.status} ${text}`);
  }

  return res.json() as Promise<NorthwestOrderResponse>;
}

/** Get the current status of a registered agent order */
export async function getAgentOrderStatus(
  orderId: string
): Promise<NorthwestOrderStatus> {
  const res = await fetch(`${BASE_URL}/orders/${orderId}`, {
    method: "GET",
    headers: headers(),
  });
  if (!res.ok) {
    throw new Error(`Northwest RA status check failed: ${res.status} ${await res.text()}`);
  }
  return res.json() as Promise<NorthwestOrderStatus>;
}

/** Cancel a registered agent order (e.g. if filing fails) */
export async function cancelAgentOrder(orderId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/orders/${orderId}/cancel`, {
    method: "POST",
    headers: headers(),
  });
  if (!res.ok) {
    throw new Error(`Northwest RA cancel failed: ${res.status} ${await res.text()}`);
  }
}

/**
 * Build the registered agent block for a DE SOS filing payload.
 * Call this after placeAgentOrder to get the address in the right shape.
 */
export function toDelawareAgent(order: NorthwestOrderResponse) {
  return {
    name: order.agentName,
    address1: order.agentAddress.line1,
    address2: order.agentAddress.line2,
    city: order.agentAddress.city,
    state: "DE" as const,
    zip: order.agentAddress.zip,
  };
}
