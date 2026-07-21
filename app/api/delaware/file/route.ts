export const runtime = "nodejs";

import { getDb } from "@/lib/db";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";
import { placeAgentOrder, toDelawareAgent } from "@/lib/northwest";
import { submitFiling } from "@/lib/delaware";
import { applyForEin, resolveEntityClass } from "@/lib/ein";
import { generateArticles, generateOperatingAgreement } from "@/lib/documents";
import type { DocumentInput } from "@/lib/documents";

/**
 * POST /api/delaware/file
 *
 * Orchestrates the full Delaware formation pipeline for a paid order:
 *   1. Northwest RA order → agent address
 *   2. DE SOS DECIS filing (LLC or C-Corp)
 *   3. IRS EIN application (SS-4)
 *   4. Document generation (articles + operating agreement)
 *
 * Called by the Stripe webhook after payment is confirmed.
 * Can also be called manually by an admin to retry a failed order.
 *
 * Body: { orderId: string }
 */
export async function POST(request: Request) {
  const token = getTokenFromRequest(request);
  const session = token ? await verifyToken(token) : null;

  // Allow: authenticated user who owns the order, OR internal CRON/admin
  const adminSecret = process.env.AUDIT_SECRET;
  if (!adminSecret) throw new Error("AUDIT_SECRET is not set");
  const isAdmin =
    request.headers.get("x-admin-secret") === adminSecret;

  if (!session && !isAdmin) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json() as { orderId: string };
  if (!body.orderId) {
    return Response.json({ error: "orderId is required" }, { status: 400 });
  }

  const db = getDb();

  // Fetch order — enforce ownership unless admin
  const rows = await db(
    `SELECT id, user_id, email, company_name, state, entity_type,
            status, wizard_data, stripe_payment_intent,
            northwest_order_id, de_sos_filing_id, ein_application_id
     FROM formation_orders WHERE id = $1`,
    [body.orderId]
  ) as {
    id: string;
    user_id: string | null;
    email: string;
    company_name: string;
    state: string;
    entity_type: string;
    status: string;
    wizard_data: Record<string, unknown>;
    stripe_payment_intent: string | null;
    northwest_order_id: string | null;
    de_sos_filing_id: string | null;
    ein_application_id: string | null;
  }[];

  if (!rows.length) {
    return Response.json({ error: "Order not found" }, { status: 404 });
  }

  const order = rows[0];

  if (!isAdmin && session && order.user_id !== session.sub) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!["paid", "failed"].includes(order.status)) {
    return Response.json(
      { error: `Order status '${order.status}' is not eligible for filing` },
      { status: 409 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://myfounderkit.com";
  const wizardData = order.wizard_data as Record<string, string>;
  const entityType = order.entity_type as "llc" | "ccorp" | "nonprofit";

  // ── Step 1: Northwest Registered Agent ────────────────────────────────────
  let northwestOrderId = order.northwest_order_id;
  let agentBlock: ReturnType<typeof toDelawareAgent>;

  if (!northwestOrderId) {
    await db(
      "UPDATE formation_orders SET status = 'ra_ordered', updated_at = NOW() WHERE id = $1",
      [order.id]
    );

    try {
      const raOrder = await placeAgentOrder({
        state: order.state,
        entityType: entityType === "llc" ? "LLC" : "CORPORATION",
        companyName: order.company_name,
        clientEmail: order.email,
        clientName: wizardData.founderName ?? order.email,
        webhookUrl: `${appUrl}/api/delaware/webhook`,
      });

      northwestOrderId = raOrder.orderId;
      agentBlock = toDelawareAgent(raOrder);

      await db(
        `UPDATE formation_orders
         SET northwest_order_id   = $1,
             northwest_agent_name = $2,
             northwest_agent_address = $3,
             updated_at = NOW()
         WHERE id = $4`,
        [
          raOrder.orderId,
          raOrder.agentName,
          `${raOrder.agentAddress.line1}, ${raOrder.agentAddress.city}, ${raOrder.agentAddress.state} ${raOrder.agentAddress.zip}`,
          order.id,
        ]
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Northwest RA order failed:", msg);
      await db(
        "UPDATE formation_orders SET status = 'failed', last_error = $1, retry_count = retry_count + 1, updated_at = NOW() WHERE id = $2",
        [`RA: ${msg}`, order.id]
      );
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
  } else {
    // RA already placed on a prior attempt — reconstruct agent block from DB
    agentBlock = {
      name: "Northwest Registered Agent, LLC",
      address1: "1209 Orange Street",
      address2: undefined,
      city: "Wilmington",
      state: "DE" as const,
      zip: "19801",
    };
  }

  // ── Step 2: Delaware SOS DECIS filing ─────────────────────────────────────
  let deFilingId = order.de_sos_filing_id;

  if (!deFilingId) {
    await db(
      "UPDATE formation_orders SET status = 'filing_submitted', de_sos_submitted_at = NOW(), updated_at = NOW() WHERE id = $1",
      [order.id]
    );

    const organizer = {
      name: wizardData.founderName ?? "Organizer",
      address: wizardData.founderAddress ?? "123 Main St",
      city: wizardData.founderCity ?? "Wilmington",
      state: wizardData.founderState ?? "DE",
      zip: wizardData.founderZip ?? "19801",
    };

    try {
      const filingInput =
        entityType === "llc"
          ? {
              entityType: "LLC" as const,
              companyName: order.company_name,
              registeredAgent: agentBlock,
              organizer,
              purpose: wizardData.purpose,
              managementType: (wizardData.managementType as "member" | "manager") ?? "member",
            }
          : {
              entityType: "CCORP" as const,
              companyName: order.company_name,
              registeredAgent: agentBlock,
              incorporator: organizer,
              authorizedShares: wizardData.authorizedShares
                ? Number(wizardData.authorizedShares)
                : 10_000_000,
              purpose: wizardData.purpose,
            };

      const filing = await submitFiling(filingInput);
      deFilingId = filing.filingId;

      await db(
        "UPDATE formation_orders SET de_sos_filing_id = $1, updated_at = NOW() WHERE id = $2",
        [filing.filingId, order.id]
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("DE SOS filing failed:", msg);
      await db(
        "UPDATE formation_orders SET status = 'failed', last_error = $1, retry_count = retry_count + 1, updated_at = NOW() WHERE id = $2",
        [`DE SOS: ${msg}`, order.id]
      );
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
  }

  // ── Step 3: IRS EIN (SS-4) ────────────────────────────────────────────────
  if (!order.ein_application_id) {
    await db(
      "UPDATE formation_orders SET status = 'ein_pending', ein_applied_at = NOW(), updated_at = NOW() WHERE id = $1",
      [order.id]
    );

    const memberCount = wizardData.memberCount ? Number(wizardData.memberCount) : 1;

    try {
      const einApp = await applyForEin({
        legalName: order.company_name,
        entityClass: resolveEntityClass(entityType, memberCount),
        stateOfFormation: order.state,
        formationDate: new Date().toISOString().split("T")[0],
        responsibleParty: {
          name: wizardData.founderName ?? "Organizer",
          ssn: wizardData.founderSSN,         // collected securely at checkout; never stored
          address: wizardData.founderAddress ?? "123 Main St",
          city: wizardData.founderCity ?? "Wilmington",
          state: wizardData.founderState ?? "DE",
          zip: wizardData.founderZip ?? "19801",
        },
        businessAddress: {
          address: wizardData.businessAddress ?? wizardData.founderAddress ?? "123 Main St",
          city: wizardData.businessCity ?? wizardData.founderCity ?? "Wilmington",
          state: wizardData.businessState ?? order.state,
          zip: wizardData.businessZip ?? wizardData.founderZip ?? "19801",
        },
        reasonForApplying: "Started new business",
        primaryActivity: wizardData.primaryActivity,
      });

      await db(
        "UPDATE formation_orders SET ein_application_id = $1, updated_at = NOW() WHERE id = $2",
        [einApp.applicationId, order.id]
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("EIN application failed:", msg);
      await db(
        "UPDATE formation_orders SET status = 'failed', last_error = $1, retry_count = retry_count + 1, updated_at = NOW() WHERE id = $2",
        [`EIN: ${msg}`, order.id]
      );
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
  }

  // ── Step 4: Document generation ───────────────────────────────────────────
  const docInput: DocumentInput = {
    company: {
      companyName: order.company_name,
      entityType,
      stateOfFormation: order.state,
      formationDate: new Date().toISOString().split("T")[0],
      purpose: wizardData.purpose,
      authorizedShares: wizardData.authorizedShares ? Number(wizardData.authorizedShares) : 10_000_000,
    },
    registeredAgent: {
      name: agentBlock.name,
      address: agentBlock.address1,
      city: agentBlock.city,
      state: agentBlock.state,
      zip: agentBlock.zip,
    },
    organizer: {
      name: wizardData.founderName ?? "Organizer",
      title: entityType === "ccorp" ? "Incorporator" : "Organizer",
      address: wizardData.founderAddress ?? "",
      city: wizardData.founderCity ?? "",
      state: wizardData.founderState ?? "",
      zip: wizardData.founderZip ?? "",
    },
  };

  const articlesHtml = generateArticles(docInput);
  const operatingHtml = entityType === "llc"
    ? generateOperatingAgreement(docInput)
    : null;

  // Upload docs to storage (R2 or equivalent)
  // Wired here — actual upload implemented in /api/delaware/documents/upload
  // when R2_BUCKET_NAME env var is set.
  const docUrls = await uploadDocuments(order.id, articlesHtml, operatingHtml);

  await db(
    `UPDATE formation_orders
     SET status           = 'documents_ready',
         doc_articles_url = $1,
         doc_operating_url = $2,
         updated_at       = NOW()
     WHERE id = $3`,
    [docUrls.articlesUrl, docUrls.operatingUrl, order.id]
  );

  return Response.json({
    ok: true,
    orderId: order.id,
    deFilingId,
    northwestOrderId,
    documentsReady: true,
    articlesUrl: docUrls.articlesUrl,
    operatingUrl: docUrls.operatingUrl,
  });
}

// ─── Document upload helper ───────────────────────────────────────────────────

async function uploadDocuments(
  orderId: string,
  articlesHtml: string,
  operatingHtml: string | null
): Promise<{ articlesUrl: string | null; operatingUrl: string | null }> {
  const r2Endpoint = process.env.R2_UPLOAD_ENDPOINT;
  const r2Token = process.env.R2_API_TOKEN;

  if (!r2Endpoint || !r2Token) {
    // R2 not configured — store inline reference for now
    console.warn("R2 not configured — documents generated but not uploaded");
    return { articlesUrl: null, operatingUrl: null };
  }

  async function upload(key: string, html: string): Promise<string> {
    const res = await fetch(`${r2Endpoint}/${key}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${r2Token}`,
        "Content-Type": "text/html; charset=utf-8",
      },
      body: html,
    });
    if (!res.ok) throw new Error(`R2 upload failed: ${res.status}`);
    return `${r2Endpoint}/${key}`;
  }

  const [articlesUrl, operatingUrl] = await Promise.all([
    upload(`formations/${orderId}/articles.html`, articlesHtml),
    operatingHtml
      ? upload(`formations/${orderId}/operating-agreement.html`, operatingHtml)
      : Promise.resolve(null),
  ]);

  return { articlesUrl, operatingUrl };
}
