/**
 * IRS Form SS-4 PDF generator
 *
 * When no EIN API provider is configured, this generates a completed SS-4
 * as an HTML document that can be printed and faxed to the IRS at (855) 641-6935.
 * EIN is typically issued within 4 business days via fax.
 *
 * Reference: https://www.irs.gov/pub/irs-pdf/fss4.pdf
 */

export interface SS4Data {
  legalName: string;
  tradeNameOrDBA?: string;
  responsiblePartyName: string;
  responsiblePartySSN: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  county: string;
  entityType: "llc_single" | "llc_multi" | "corporation" | "nonprofit";
  stateOfFormation: string;
  formationDate: string;
  reasonForApplying: string;
  primaryActivity: string;
  hasEmployees: boolean;
  firstWagesDate?: string;
  highestEmployees?: number;
  agriculturalEmployees?: number;
  householdEmployees?: number;
  otherEmployees?: number;
  closingMonth: string;
  contactName?: string;
  contactPhone?: string;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function field(label: string, value: string, width = "100%"): string {
  return `
    <div style="display:inline-block;width:${width};padding:4px 8px;border:1px solid #000;box-sizing:border-box;vertical-align:top;">
      <div style="font-size:9px;color:#555;">${esc(label)}</div>
      <div style="font-size:12px;font-weight:bold;">${esc(value)}</div>
    </div>`;
}

function entityTypeLabel(t: SS4Data["entityType"]): string {
  const map: Record<string, string> = {
    llc_single: "Limited Liability Company (1 member)",
    llc_multi: "Limited Liability Company (more than 1 member)",
    corporation: "Corporation",
    nonprofit: "Other (nonprofit corporation)",
  };
  return map[t] ?? t;
}

export function generateSS4Html(data: SS4Data): string {
  const today = new Date().toLocaleDateString("en-US");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>IRS Form SS-4 — ${esc(data.legalName)}</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 11px; margin: 20px; color: #000; }
  h1 { font-size: 14px; text-align: center; margin: 0 0 4px; }
  .subtitle { text-align: center; font-size: 10px; margin: 0 0 12px; }
  .section { margin-bottom: 8px; }
  .row { display: flex; gap: 0; margin-bottom: 4px; }
  .instructions { background: #f5f5f5; border: 1px solid #ccc; padding: 8px; margin-bottom: 12px; font-size: 10px; }
  .signature-line { border-top: 1px solid #000; margin-top: 24px; padding-top: 4px; display: flex; gap: 16px; }
  @media print { body { margin: 0.5in; } }
</style>
</head>
<body>

<div class="instructions">
  <strong>FAX INSTRUCTIONS:</strong> Fax this completed form to the IRS at <strong>(855) 641-6935</strong> (domestic).
  For international: <strong>(304) 707-9471</strong>. EIN is typically issued within 4 business days.
  Keep the confirmation fax for your records.
</div>

<h1>Form SS-4 — Application for Employer Identification Number</h1>
<p class="subtitle">(For use by employers, corporations, partnerships, trusts, estates, churches, government agencies, Indian tribal entities, certain individuals, and others.)<br>
Department of the Treasury — Internal Revenue Service</p>

<div class="section">
  <div class="row">
    ${field("1. Legal name of entity (or individual) for whom the EIN is being requested", data.legalName)}
  </div>
  <div class="row">
    ${field("2. Trade name of business (if different from name on line 1)", data.tradeNameOrDBA ?? "")}
    ${field("3. Executor, administrator, trustee, 'care of' name", "")}
  </div>
  <div class="row">
    ${field("4a. Mailing address (room, apt., suite no. and street, or P.O. box)", data.address)}
    ${field("4b. City, state, and ZIP code (if foreign, see instructions)", `${data.city}, ${data.state} ${data.zip}`)}
  </div>
  <div class="row">
    ${field("5a. Street address (if different from address on lines 4a and 4b)", "")}
    ${field("5b. City, state, and ZIP code (if foreign, see instructions)", "")}
  </div>
  <div class="row">
    ${field("6. County and state where principal business is located", `${data.county}, ${data.state}`)}
  </div>
  <div class="row">
    ${field("7a. Name of responsible party", data.responsiblePartyName, "60%")}
    ${field("7b. SSN, ITIN, or EIN", data.responsiblePartySSN, "40%")}
  </div>
</div>

<div class="section">
  <div class="row">
    ${field("8a. Is this application for a limited liability company (LLC)?", data.entityType.startsWith("llc") ? "Yes" : "No", "40%")}
    ${field("8b. If 8a is Yes, enter the number of LLC members", data.entityType === "llc_single" ? "1" : data.entityType === "llc_multi" ? "2+" : "", "30%")}
    ${field("8c. If 8a is Yes, was the LLC organized in the United States?", data.entityType.startsWith("llc") ? "Yes" : "", "30%")}
  </div>
  <div class="row">
    ${field("9a. Type of entity", entityTypeLabel(data.entityType))}
  </div>
  <div class="row">
    ${field("9b. If a corporation, name the state or foreign country (if applicable) where incorporated", data.entityType === "corporation" ? data.stateOfFormation : "")}
  </div>
  <div class="row">
    ${field("10. Reason for applying", data.reasonForApplying)}
  </div>
  <div class="row">
    ${field("11. Date business started or acquired (month, day, year)", data.formationDate, "50%")}
    ${field("12. Closing month of accounting year", data.closingMonth, "50%")}
  </div>
  <div class="row">
    ${field("13. Highest number of employees expected in the next 12 months", data.highestEmployees?.toString() ?? "0", "34%")}
    ${field("Agricultural", data.agriculturalEmployees?.toString() ?? "0", "22%")}
    ${field("Household", data.householdEmployees?.toString() ?? "0", "22%")}
    ${field("Other", data.otherEmployees?.toString() ?? "0", "22%")}
  </div>
  <div class="row">
    ${field("14. Do you expect your employment tax liability to be $1,000 or less in a full calendar year?", "No")}
  </div>
  <div class="row">
    ${field("15. First date wages or annuities were paid (month, day, year)", data.firstWagesDate ?? "N/A")}
  </div>
  <div class="row">
    ${field("16. Check the box that best describes the principal activity of your business", data.primaryActivity)}
  </div>
  <div class="row">
    ${field("17. Indicate principal line of merchandise sold, specific construction work done, products produced, or services provided", data.primaryActivity)}
  </div>
  <div class="row">
    ${field("18. Has the applicant entity shown on line 1 ever applied for and received an EIN?", "No")}
  </div>
</div>

<div class="signature-line">
  <div style="flex:1;">
    <div style="font-size:10px;">Under penalties of perjury, I declare that I have examined this application, and to the best of my knowledge and belief, it is true, correct, and complete.</div>
    <br>
    <div style="display:flex;gap:16px;margin-top:8px;">
      <div style="flex:2;">Signature ▶ <span style="border-bottom:1px solid #000;display:inline-block;width:200px;">&nbsp;</span></div>
      <div style="flex:1;">Date ▶ <span style="border-bottom:1px solid #000;display:inline-block;width:120px;">${today}</span></div>
    </div>
    <div style="margin-top:8px;">Name and title (type or print clearly) ▶ ${esc(data.responsiblePartyName)}</div>
  </div>
</div>

<p style="font-size:9px;margin-top:16px;color:#666;">
  Form SS-4 (Rev. December 2019) — Department of the Treasury Internal Revenue Service<br>
  For Privacy Act and Paperwork Reduction Act Notice, see separate instructions.
</p>
</body>
</html>`;
}

/**
 * Build SS4Data from a formation order's wizard_data.
 * Call this when EIN_PROVIDER_API_KEY is not set to generate a fax-ready PDF.
 */
export function orderToSS4(
  companyName: string,
  entityType: "llc" | "ccorp" | "nonprofit",
  stateOfFormation: string,
  wizardData: Record<string, string>
): SS4Data {
  const memberCount = wizardData.memberCount ? Number(wizardData.memberCount) : 1;

  let etype: SS4Data["entityType"];
  if (entityType === "llc") {
    etype = memberCount > 1 ? "llc_multi" : "llc_single";
  } else if (entityType === "nonprofit") {
    etype = "nonprofit";
  } else {
    etype = "corporation";
  }

  return {
    legalName: companyName,
    responsiblePartyName: wizardData.founderName ?? "Responsible Party",
    responsiblePartySSN: wizardData.founderSSN ?? "XXX-XX-XXXX",
    address: wizardData.founderAddress ?? wizardData.businessAddress ?? "",
    city: wizardData.founderCity ?? wizardData.businessCity ?? "",
    state: wizardData.founderState ?? stateOfFormation,
    zip: wizardData.founderZip ?? wizardData.businessZip ?? "",
    county: wizardData.county ?? stateOfFormation,
    entityType: etype,
    stateOfFormation,
    formationDate: new Date().toLocaleDateString("en-US"),
    reasonForApplying: "Started new business",
    primaryActivity: wizardData.primaryActivity ?? wizardData.industry ?? "Professional services",
    hasEmployees: false,
    closingMonth: "December",
  };
}
