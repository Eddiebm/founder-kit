/**
 * Document generation — Articles of Incorporation / Organization + Operating Agreement
 *
 * Returns HTML strings (suitable for PDF conversion via a headless browser service
 * such as Gotenberg, wkhtmltopdf, or Browserless). Each document is self-contained
 * and can be rendered directly in a <iframe> or piped to a PDF endpoint.
 *
 * No external dependencies — pure string generation, works in edge runtime.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CompanyInfo {
  companyName: string;
  entityType: "llc" | "ccorp" | "nonprofit";
  stateOfFormation: string;
  formationDate: string;         // ISO date
  purpose?: string;
  authorizedShares?: number;     // C-Corps only
}

export interface RegisteredAgent {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}

export interface Organizer {
  name: string;
  title: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}

export interface Member {
  name: string;
  ownershipPercent: number;
  contributedCapital?: string;
}

export interface DocumentInput {
  company: CompanyInfo;
  registeredAgent: RegisteredAgent;
  organizer: Organizer;
  members?: Member[];            // LLC members or C-Corp founders
}

// ─── Articles of Organization (LLC) ──────────────────────────────────────────

export function generateArticlesOfOrganization(input: DocumentInput): string {
  const { company, registeredAgent, organizer } = input;
  const date = new Date(company.formationDate).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Certificate of Formation — ${esc(company.companyName)}</title>
  <style>${legalStyles()}</style>
</head>
<body>
  <div class="doc">
    <div class="header">
      <p class="state">STATE OF ${esc(company.stateOfFormation.toUpperCase())}</p>
      <p class="division">DIVISION OF CORPORATIONS</p>
      <h1>CERTIFICATE OF FORMATION</h1>
      <p class="subtitle">LIMITED LIABILITY COMPANY</p>
    </div>

    <p class="intro">
      The undersigned, being a natural person of the age of eighteen years or more and
      acting as organizer of a Limited Liability Company under the
      ${esc(company.stateOfFormation)} Limited Liability Company Act, adopts the
      following Certificate of Formation:
    </p>

    <section>
      <h2>ARTICLE I — NAME</h2>
      <p>
        The name of the Limited Liability Company is
        <strong>${esc(company.companyName)}</strong> (the "Company").
      </p>
    </section>

    <section>
      <h2>ARTICLE II — REGISTERED AGENT AND REGISTERED OFFICE</h2>
      <p>
        The address of the Company's registered office in the State of
        ${esc(company.stateOfFormation)} is
        ${esc(registeredAgent.address)}, ${esc(registeredAgent.city)},
        ${esc(registeredAgent.state)} ${esc(registeredAgent.zip)}.
        The name of the Company's registered agent at such address is
        <strong>${esc(registeredAgent.name)}</strong>.
      </p>
    </section>

    <section>
      <h2>ARTICLE III — PURPOSE</h2>
      <p>
        The purpose of the Company is to engage in any lawful act or activity for which a
        Limited Liability Company may be organized under the laws of the State of
        ${esc(company.stateOfFormation)}.
        ${company.purpose ? `More specifically: ${esc(company.purpose)}.` : ""}
      </p>
    </section>

    <section>
      <h2>ARTICLE IV — MANAGEMENT</h2>
      <p>
        The management of the Company shall be vested in its Members unless the Members
        elect to be managed by a Manager or Managers as set forth in the Operating Agreement.
      </p>
    </section>

    <section>
      <h2>ARTICLE V — ORGANIZER</h2>
      <p>
        The name and address of the organizer of the Company is:
      </p>
      <div class="info-block">
        <p><strong>${esc(organizer.name)}</strong></p>
        <p>${esc(organizer.address)}</p>
        <p>${esc(organizer.city)}, ${esc(organizer.state)} ${esc(organizer.zip)}</p>
      </div>
    </section>

    <div class="signature-block">
      <p>
        IN WITNESS WHEREOF, the undersigned has executed this Certificate of Formation
        as of <strong>${date}</strong>.
      </p>
      <div class="sig-line">
        <div class="line"></div>
        <p>${esc(organizer.name)}, Organizer</p>
      </div>
    </div>

    <p class="disclaimer">
      This document was prepared for filing with the ${esc(company.stateOfFormation)}
      Division of Corporations. Consult a licensed attorney for legal advice.
    </p>
  </div>
</body>
</html>`;
}

// ─── Articles of Incorporation (C-Corp) ──────────────────────────────────────

export function generateArticlesOfIncorporation(input: DocumentInput): string {
  const { company, registeredAgent, organizer } = input;
  const shares = (company.authorizedShares ?? 10_000_000).toLocaleString();
  const date = new Date(company.formationDate).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Certificate of Incorporation — ${esc(company.companyName)}</title>
  <style>${legalStyles()}</style>
</head>
<body>
  <div class="doc">
    <div class="header">
      <p class="state">STATE OF ${esc(company.stateOfFormation.toUpperCase())}</p>
      <p class="division">DIVISION OF CORPORATIONS</p>
      <h1>CERTIFICATE OF INCORPORATION</h1>
      <p class="subtitle">GENERAL CORPORATION LAW</p>
    </div>

    <p class="intro">
      The undersigned, a natural person, for the purpose of organizing a corporation
      for conducting the business and promoting the purposes hereinafter stated, under the
      provisions and subject to the requirements of the laws of the State of
      ${esc(company.stateOfFormation)} (particularly Chapter 1, Title 8 of the
      Delaware Code and the acts amendatory thereof and supplemental thereto,
      and known, identified, and referred to as the "General Corporation Law of the
      State of Delaware"), hereby certifies that:
    </p>

    <section>
      <h2>ARTICLE I — NAME</h2>
      <p>
        The name of the Corporation is <strong>${esc(company.companyName)}</strong>
        (the "Corporation").
      </p>
    </section>

    <section>
      <h2>ARTICLE II — REGISTERED AGENT AND REGISTERED OFFICE</h2>
      <p>
        The address of the Corporation's registered office in the State of Delaware is
        ${esc(registeredAgent.address)}, ${esc(registeredAgent.city)},
        ${esc(registeredAgent.state)} ${esc(registeredAgent.zip)}.
        The name of its registered agent at such address is
        <strong>${esc(registeredAgent.name)}</strong>.
      </p>
    </section>

    <section>
      <h2>ARTICLE III — PURPOSE</h2>
      <p>
        The purpose of the Corporation is to engage in any lawful act or activity for
        which corporations may be organized under the General Corporation Law of the
        State of Delaware.
        ${company.purpose ? `More specifically: ${esc(company.purpose)}.` : ""}
      </p>
    </section>

    <section>
      <h2>ARTICLE IV — AUTHORIZED CAPITAL STOCK</h2>
      <p>
        The total number of shares of stock that the Corporation is authorized to issue is
        <strong>${shares} shares</strong> of Common Stock, each with a par value of
        $0.00001 per share. The Board of Directors is authorized to establish one or more
        series of Preferred Stock and to fix the rights, preferences, and privileges of
        each series.
      </p>
    </section>

    <section>
      <h2>ARTICLE V — INCORPORATOR</h2>
      <p>The name and mailing address of the sole incorporator is:</p>
      <div class="info-block">
        <p><strong>${esc(organizer.name)}</strong></p>
        <p>${esc(organizer.address)}</p>
        <p>${esc(organizer.city)}, ${esc(organizer.state)} ${esc(organizer.zip)}</p>
      </div>
    </section>

    <section>
      <h2>ARTICLE VI — DIRECTOR LIABILITY</h2>
      <p>
        To the fullest extent permitted by the General Corporation Law of the State of
        Delaware, a director of the Corporation shall not be personally liable to the
        Corporation or its stockholders for monetary damages for breach of fiduciary duty
        as a director, except for liability (i) for any breach of the director's duty of
        loyalty to the Corporation or its stockholders; (ii) for acts or omissions not in
        good faith or which involve intentional misconduct or a knowing violation of law;
        (iii) under Section 174 of the General Corporation Law of the State of Delaware;
        or (iv) for any transaction from which the director derived an improper personal
        benefit.
      </p>
    </section>

    <section>
      <h2>ARTICLE VII — INDEMNIFICATION</h2>
      <p>
        The Corporation shall indemnify its officers, directors, employees, and agents
        to the fullest extent permitted by the General Corporation Law of the State of
        Delaware, as amended from time to time.
      </p>
    </section>

    <div class="signature-block">
      <p>
        I, the undersigned, being the incorporator hereinbefore named, for the purpose of
        forming a corporation pursuant to the General Corporation Law of the State of
        Delaware, do make and file this Certificate, hereby declaring and certifying that
        this is my act and deed and the facts herein stated are true, and accordingly have
        hereunto set my hand this <strong>${date}</strong>.
      </p>
      <div class="sig-line">
        <div class="line"></div>
        <p>${esc(organizer.name)}, Incorporator</p>
      </div>
    </div>

    <p class="disclaimer">
      This document was prepared for filing with the Delaware Division of Corporations.
      Consult a licensed attorney for legal advice.
    </p>
  </div>
</body>
</html>`;
}

// ─── Operating Agreement (LLC) ────────────────────────────────────────────────

export function generateOperatingAgreement(input: DocumentInput): string {
  const { company, organizer, members = [] } = input;
  const date = new Date(company.formationDate).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  const memberTable = members.length
    ? members
        .map(
          (m) => `<tr>
            <td>${esc(m.name)}</td>
            <td>${m.ownershipPercent}%</td>
            <td>${m.contributedCapital ? esc(m.contributedCapital) : "—"}</td>
          </tr>`
        )
        .join("")
    : `<tr><td>${esc(organizer.name)}</td><td>100%</td><td>—</td></tr>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Operating Agreement — ${esc(company.companyName)}</title>
  <style>${legalStyles()}</style>
</head>
<body>
  <div class="doc">
    <div class="header">
      <h1>OPERATING AGREEMENT</h1>
      <p class="subtitle">OF ${esc(company.companyName.toUpperCase())}</p>
      <p class="subtitle">A ${esc(company.stateOfFormation)} Limited Liability Company</p>
    </div>

    <p class="intro">
      This Operating Agreement (this "Agreement") of <strong>${esc(company.companyName)}</strong>
      (the "Company"), a ${esc(company.stateOfFormation)} limited liability company, is entered
      into as of <strong>${date}</strong>, by and among the Members listed in Exhibit A
      attached hereto.
    </p>

    <section>
      <h2>ARTICLE I — ORGANIZATION</h2>
      <p><strong>1.1 Formation.</strong> The Company was formed as a limited liability company
      pursuant to the ${esc(company.stateOfFormation)} Limited Liability Company Act
      (the "Act") by filing a Certificate of Formation with the ${esc(company.stateOfFormation)}
      Secretary of State.</p>

      <p><strong>1.2 Name.</strong> The name of the Company is ${esc(company.companyName)}.
      The Company may do business under such other names as the Members may determine.</p>

      <p><strong>1.3 Principal Office.</strong> The principal office of the Company shall be
      at such place as the Members may designate from time to time.</p>

      <p><strong>1.4 Term.</strong> The term of the Company shall be perpetual unless sooner
      dissolved in accordance with the provisions of this Agreement.</p>

      <p><strong>1.5 Purpose.</strong> The purpose of the Company is to engage in any lawful
      business activity permitted under the Act.
      ${company.purpose ? `More specifically: ${esc(company.purpose)}.` : ""}</p>
    </section>

    <section>
      <h2>ARTICLE II — MEMBERS AND CAPITAL CONTRIBUTIONS</h2>
      <p>
        The name, membership interest, and initial capital contribution of each Member
        are set forth below:
      </p>
      <table class="members-table">
        <thead>
          <tr><th>Member Name</th><th>Ownership %</th><th>Capital Contribution</th></tr>
        </thead>
        <tbody>${memberTable}</tbody>
      </table>
      <p>Additional capital contributions shall require the unanimous written consent of all Members.</p>
    </section>

    <section>
      <h2>ARTICLE III — MANAGEMENT</h2>
      <p><strong>3.1 Member-Managed.</strong> Unless the Members unanimously agree in writing
      to appoint a Manager, the Company shall be managed by its Members. Each Member shall
      have voting power proportional to their membership interest.</p>

      <p><strong>3.2 Ordinary Decisions.</strong> Decisions in the ordinary course of business
      may be made by Members holding a majority of the outstanding membership interests.</p>

      <p><strong>3.3 Major Decisions.</strong> The following decisions require unanimous
      written approval of all Members: (a) amendment of this Agreement; (b) admission of
      new Members; (c) dissolution or merger of the Company; (d) sale of substantially all
      assets; (e) incurrence of debt exceeding $50,000 in any transaction.</p>
    </section>

    <section>
      <h2>ARTICLE IV — ALLOCATIONS AND DISTRIBUTIONS</h2>
      <p><strong>4.1 Allocations.</strong> Net profits and net losses of the Company for each
      fiscal year shall be allocated among the Members in proportion to their respective
      membership interests.</p>

      <p><strong>4.2 Distributions.</strong> Distributions shall be made to the Members at
      such times and in such amounts as determined by a majority vote of the Members,
      pro rata in accordance with their membership interests. No distribution shall be
      made that would render the Company unable to pay its debts as they become due.</p>

      <p><strong>4.3 Tax Distributions.</strong> To the extent the Company has available cash,
      the Company shall make quarterly tax distributions to each Member in an amount
      estimated to cover such Member's income tax liability attributable to the Company's
      taxable income allocated to such Member.</p>
    </section>

    <section>
      <h2>ARTICLE V — TRANSFER OF MEMBERSHIP INTERESTS</h2>
      <p><strong>5.1 Restrictions.</strong> No Member may sell, assign, transfer, pledge, or
      otherwise dispose of all or any part of their membership interest without the prior
      written consent of all other Members.</p>

      <p><strong>5.2 Right of First Refusal.</strong> Before any Member may transfer an
      interest to a third party, the transferring Member must first offer the interest to
      the remaining Members on the same terms and conditions as the proposed transfer.
      The remaining Members shall have thirty (30) days to exercise this right.</p>
    </section>

    <section>
      <h2>ARTICLE VI — WITHDRAWAL AND DISSOLUTION</h2>
      <p><strong>6.1 Withdrawal.</strong> A Member may not withdraw from the Company without
      the unanimous written consent of the other Members.</p>

      <p><strong>6.2 Dissolution.</strong> The Company shall be dissolved upon: (a) the
      unanimous written agreement of all Members; (b) entry of a judicial decree of
      dissolution; or (c) any event causing dissolution under the Act.</p>

      <p><strong>6.3 Liquidation.</strong> Upon dissolution, the Company's assets shall be
      applied first to pay creditors, then to return capital contributions, then to
      distribute remaining assets to Members in proportion to their interests.</p>
    </section>

    <section>
      <h2>ARTICLE VII — INDEMNIFICATION</h2>
      <p>The Company shall indemnify each Member and Manager against claims, liabilities,
      damages, costs, and expenses (including reasonable attorneys' fees) arising out of
      their service to the Company, to the fullest extent permitted by applicable law,
      provided that such indemnification shall not extend to acts of gross negligence,
      fraud, or willful misconduct.</p>
    </section>

    <section>
      <h2>ARTICLE VIII — BOOKS AND RECORDS</h2>
      <p>The Company shall maintain complete and accurate books and records of the Company's
      business at its principal office. Each Member shall have the right to inspect and
      copy such records upon reasonable notice.</p>
    </section>

    <section>
      <h2>ARTICLE IX — MISCELLANEOUS</h2>
      <p><strong>9.1 Governing Law.</strong> This Agreement shall be governed by and construed
      in accordance with the laws of the State of ${esc(company.stateOfFormation)},
      without giving effect to any choice of law provisions.</p>

      <p><strong>9.2 Entire Agreement.</strong> This Agreement constitutes the entire
      agreement among the Members with respect to the subject matter hereof and supersedes
      all prior agreements and understandings.</p>

      <p><strong>9.3 Amendment.</strong> This Agreement may only be amended by a written
      instrument signed by all Members.</p>

      <p><strong>9.4 Severability.</strong> If any provision of this Agreement is found to
      be invalid or unenforceable, the remaining provisions shall continue in full force
      and effect.</p>
    </section>

    <div class="signature-block">
      <p>IN WITNESS WHEREOF, the Members have executed this Operating Agreement as of the date
      first written above.</p>
      ${
        (members.length ? members : [{ name: organizer.name, ownershipPercent: 100 }])
          .map(
            (m) => `<div class="sig-line">
          <div class="line"></div>
          <p>${esc(m.name)}, Member</p>
        </div>`
          )
          .join("")
      }
    </div>

    <div class="exhibit">
      <h2>EXHIBIT A — MEMBERSHIP INTERESTS</h2>
      <table class="members-table">
        <thead>
          <tr><th>Member Name</th><th>Ownership %</th><th>Capital Contribution</th></tr>
        </thead>
        <tbody>${memberTable}</tbody>
      </table>
    </div>

    <p class="disclaimer">
      This Operating Agreement was prepared for informational purposes. Consult a licensed
      attorney before relying on this document for legal, tax, or business decisions.
    </p>
  </div>
</body>
</html>`;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

function legalStyles(): string {
  return `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: "Times New Roman", Times, serif; font-size: 12pt; color: #000; background: #fff; }
    .doc { max-width: 750px; margin: 0 auto; padding: 72px 64px; }
    .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #000; padding-bottom: 24px; }
    .header h1 { font-size: 18pt; text-transform: uppercase; letter-spacing: 0.05em; margin: 8px 0; }
    .header .state { font-size: 11pt; letter-spacing: 0.15em; color: #333; }
    .header .division { font-size: 10pt; letter-spacing: 0.1em; color: #555; margin-bottom: 8px; }
    .header .subtitle { font-size: 11pt; margin-top: 6px; color: #333; }
    .intro { margin: 0 0 24px; line-height: 1.7; text-align: justify; }
    section { margin-bottom: 24px; }
    section h2 { font-size: 11pt; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 10px; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
    section p { line-height: 1.7; margin-bottom: 10px; text-align: justify; }
    .info-block { margin: 12px 0 12px 24px; line-height: 1.8; }
    .members-table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 11pt; }
    .members-table th, .members-table td { border: 1px solid #000; padding: 6px 12px; text-align: left; }
    .members-table th { background: #f0f0f0; font-weight: bold; }
    .signature-block { margin-top: 40px; padding-top: 24px; border-top: 1px solid #ccc; }
    .signature-block p { line-height: 1.7; margin-bottom: 24px; }
    .sig-line { margin: 32px 0; }
    .sig-line .line { border-bottom: 1px solid #000; width: 280px; margin-bottom: 6px; }
    .sig-line p { font-size: 11pt; }
    .exhibit { margin-top: 48px; padding-top: 24px; border-top: 2px solid #000; }
    .exhibit h2 { font-size: 13pt; text-align: center; margin-bottom: 20px; }
    .disclaimer { margin-top: 40px; font-size: 9pt; color: #666; font-style: italic; line-height: 1.5; border-top: 1px solid #ddd; padding-top: 12px; }
  `;
}

/** Choose the correct article generator based on entity type */
export function generateArticles(input: DocumentInput): string {
  return input.company.entityType === "llc"
    ? generateArticlesOfOrganization(input)
    : generateArticlesOfIncorporation(input);
}
