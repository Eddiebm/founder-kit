"use client";

import { useState, useCallback, useEffect } from "react";
import { STATES_LIST, getState, type StateFilingInfo } from "../lib/states";

// ─── Types ───────────────────────────────────────────────────────────────────

interface CompanyInfo {
  founderName: string;
  companyName: string;
  state: string;
  incorporationDate: string;
  founderEmail: string;
  githubRepo: string;
  numShares: string;
  incorporatorAddress: string;
  registeredAgentName: string;
  registeredAgentAddress: string;
}

interface IPItem {
  id: string;
  label: string;
  checked: boolean;
}

type EntityStructure = "ccorp" | "hybrid" | "nonprofit";

interface FoundationInfo {
  foundationName: string;
  foundationPurpose: string;
}

// ─── Default IP items ─────────────────────────────────────────────────────────

const DEFAULT_IP_ITEMS: IPItem[] = [
  { id: "clinical-ai", label: "Clinical AI Engine (streaming clinical decision support)", checked: true },
  { id: "drug-safety", label: "Drug Safety Engine (offline-capable, client-side)", checked: true },
  { id: "ghana-eml", label: "Ghana Essential Medicines List dataset", checked: true },
  { id: "offline-queue", label: "Offline Queue & sync architecture", checked: true },
  { id: "clinical-pipeline", label: "Clinical Data Pipeline (encounters, vitals, summaries)", checked: true },
  { id: "org-portal", label: "Organization Portal (multi-facility B2B layer)", checked: true },
  { id: "outbreak", label: "Outbreak Surveillance system", checked: true },
  { id: "lab-scanner", label: "Lab Report Scanner", checked: true },
  { id: "trad-medicine", label: "Traditional Medicine Module", checked: true },
  { id: "python-backend", label: "Python Analytics Backend", checked: true },
  { id: "trademark", label: "MedOS trademark and trade name", checked: true },
  { id: "domain", label: "medosafrica.org domain and web properties", checked: true },
  { id: "source-code", label: "All source code in GitHub repository", checked: true },
];

// ─── Document generators ─────────────────────────────────────────────────────

function generateIPAssignment(
  info: CompanyInfo,
  ipItems: IPItem[],
  effectiveDate: string,
  stateName: string
): string {
  const checkedItems = ipItems.filter((i) => i.checked);
  const ipList = checkedItems
    .map((item, idx) => `   ${idx + 1}. ${item.label}`)
    .join("\n");

  return `INTELLECTUAL PROPERTY ASSIGNMENT AGREEMENT

This Intellectual Property Assignment Agreement ("Agreement") is entered into
as of ${effectiveDate || "[DATE]"} ("Effective Date"), by and between:

ASSIGNOR:  ${info.founderName || "[FOUNDER NAME]"}
           ${info.founderEmail || "[FOUNDER EMAIL]"}
           ("Founder" or "Assignor")

ASSIGNEE:  ${info.companyName || "[COMPANY NAME]"}, a ${stateName} corporation
           ("Company" or "Assignee")

RECITALS

WHEREAS, Founder has conceived, developed, and/or reduced to practice certain
intellectual property assets related to the Company's business; and

WHEREAS, Company desires to acquire, and Founder desires to assign to Company,
all right, title, and interest in and to such intellectual property assets, in
exchange for the consideration set forth herein.

NOW, THEREFORE, in consideration of the mutual covenants and agreements set
forth herein, and for other good and valuable consideration, the receipt and
sufficiency of which are hereby acknowledged, the parties agree as follows:

1. ASSIGNMENT OF INTELLECTUAL PROPERTY

   1.1  Assigned IP. Founder hereby irrevocably assigns, transfers, and
        conveys to Company all right, title, and interest throughout the
        world in and to the following intellectual property assets
        (collectively, the "Assigned IP"):

${ipList}

   1.2  Scope. The assignment includes, without limitation, all patents,
        patent applications, copyrights, trade secrets, trademarks, domain
        names, source code, documentation, know-how, and any other
        intellectual property rights relating to the Assigned IP, whether
        registered or unregistered, and all applications and registrations
        therefor.

   1.3  GitHub Repository. Founder specifically assigns all right, title, and
        interest in and to all source code, commit history, and associated
        materials hosted at: ${info.githubRepo || "[GITHUB REPO URL]"}

2. CONSIDERATION

   In full consideration for the assignment of the Assigned IP, Company agrees
   to issue to Founder ${parseInt(info.numShares || "10000000").toLocaleString()} shares of Common Stock of the Company
   (the "Founder Shares"), subject to the Company's standard vesting schedule
   and the terms of a separate Stock Purchase Agreement. The parties
   acknowledge that such consideration is fair and adequate.

3. FURTHER ASSURANCES

   Founder agrees to execute and deliver such additional documents,
   instruments, and agreements, and to take such further actions, as Company
   may reasonably request to perfect, record, or enforce Company's ownership
   of the Assigned IP, including without limitation executing any patent
   assignment documents required by the United States Patent and Trademark
   Office or any foreign patent office.

4. REPRESENTATIONS AND WARRANTIES

   Founder represents and warrants that:
   (a) Founder is the sole owner of all right, title, and interest in and to
       the Assigned IP;
   (b) Founder has the full right, power, and authority to enter into this
       Agreement and to grant the rights herein;
   (c) The Assigned IP does not infringe any third-party intellectual property
       rights;
   (d) There are no outstanding liens, encumbrances, or claims against the
       Assigned IP; and
   (e) Founder has not previously assigned, licensed, or transferred any
       rights in the Assigned IP to any third party.

5. GOVERNING LAW

   This Agreement shall be governed by and construed in accordance with the
   laws of the State of ${stateName}, without regard to its conflict of
   law provisions.

6. ENTIRE AGREEMENT

   This Agreement constitutes the entire agreement between the parties with
   respect to the subject matter hereof and supersedes all prior and
   contemporaneous agreements, representations, and understandings.

IN WITNESS WHEREOF, the parties have executed this Agreement as of the
Effective Date.

ASSIGNOR:

_________________________________
${info.founderName || "[FOUNDER NAME]"}
Date: ___________________________


ASSIGNEE: ${info.companyName || "[COMPANY NAME]"}

By: _____________________________
Name: ___________________________
Title: __________________________
Date: ___________________________
`;
}

function generateNonprofitArticles(
  info: CompanyInfo,
  foundation: FoundationInfo,
  stateInfo: StateFilingInfo
): string {
  const fname = foundation.foundationName || "[FOUNDATION NAME]";
  const agent = info.registeredAgentName || "[REGISTERED AGENT NAME]";
  const agentAddr = info.registeredAgentAddress || `[REGISTERED AGENT ADDRESS], ${stateInfo.name}`;
  const incorporator = info.founderName || "[FOUNDER NAME]";
  const incorporatorAddr = info.incorporatorAddress || "[INCORPORATOR MAILING ADDRESS]";
  const purpose = foundation.foundationPurpose ||
    "To provide free clinical decision support to frontline health workers in sub-Saharan Africa";
  const docTitle = stateInfo.nonprofitDocName.toUpperCase();
  const stateName = stateInfo.name;
  const statute = stateInfo.nonprofitStatute;

  return `${docTitle}
OF
${fname}
(A ${stateName} Nonstock Nonprofit Corporation)

FIRST: The name of the corporation is ${fname}.

SECOND: Its registered office in the State of ${stateName} is located at
${agentAddr}.
The name of its registered agent at such address is ${agent}.

THIRD: The nature of the business or purposes to be conducted or promoted
by the corporation is exclusively charitable, educational, and scientific
within the meaning of Section 501(c)(3) of the Internal Revenue Code of
1986, as amended (the "Code"). Specifically: ${purpose}.

This corporation is organized under the ${statute}.

FOURTH: The corporation is organized exclusively for charitable,
educational, and scientific purposes, including, for such purposes, the
making of distributions to organizations that qualify as exempt
organizations under Section 501(c)(3) of the Code.

FIFTH: No part of the net earnings of the corporation shall inure to the
benefit of, or be distributable to, its directors, officers, or other
private persons, except that the corporation shall be authorized and
empowered to pay reasonable compensation for services rendered and to
make payments and distributions in furtherance of the purposes set forth
in Article Third hereof.

SIXTH: No substantial part of the activities of the corporation shall be
the carrying on of propaganda, or otherwise attempting to influence
legislation, and the corporation shall not participate in, or intervene
in (including the publishing or distribution of statements), any
political campaign on behalf of (or in opposition to) any candidate for
public office.

SEVENTH: The corporation shall not carry on any other activities not
permitted to be carried on (a) by a corporation exempt from federal
income tax under Section 501(c)(3) of the Code, or (b) by a corporation
to which contributions are deductible under Section 170(c)(2) of the Code.

EIGHTH: Upon the dissolution of the corporation, the Board of Directors
shall, after paying or making provision for the payment of all the
liabilities of the corporation, dispose of all the assets of the
corporation exclusively for the purposes of the corporation in such
manner, or to such organization or organizations organized and operated
exclusively for charitable, educational, or scientific purposes as shall
at the time qualify as an exempt organization or organizations under
Section 501(c)(3) of the Code, as the Board of Directors shall determine.

NINTH: This corporation has no stockholders or members. The affairs of
the corporation shall be governed by its Board of Directors.

TENTH: The name and mailing address of the sole incorporator are:

   Name:    ${incorporator}
   Address: ${incorporatorAddr}

ELEVENTH: The Board of Directors is expressly authorized to make, alter,
or repeal the bylaws of the corporation.

IN WITNESS WHEREOF, the undersigned, being the incorporator hereinabove
named, has executed this ${stateInfo.nonprofitDocName} this _____ day of
_____________, 20___.


_________________________________
${incorporator}
Incorporator
`;
}

function generateCertificateOfIncorporation(info: CompanyInfo, stateInfo: StateFilingInfo): string {
  const name = info.companyName || "[COMPANY NAME]";
  const agent = info.registeredAgentName || "[REGISTERED AGENT NAME]";
  const agentAddr = info.registeredAgentAddress || `[REGISTERED AGENT ADDRESS], ${stateInfo.name}`;
  const shares = parseInt(info.numShares || "10000000").toLocaleString();
  const incorporator = info.founderName || "[FOUNDER NAME]";
  const incorporatorAddr = info.incorporatorAddress || "[INCORPORATOR MAILING ADDRESS]";
  const stateName = stateInfo.name;
  const statute = stateInfo.corpStatute;
  const docTitle = stateInfo.corpDocName.toUpperCase();

  return `${docTitle}
OF
${name}
(A ${stateName} Corporation)

FIRST: The name of the corporation is ${name}.

SECOND: Its registered office in the State of ${stateName} is located at
${agentAddr}.
The name of its registered agent at such address is ${agent}.

THIRD: The purpose of the corporation is to engage in any lawful act or
activity for which corporations may be organized under the ${statute}.

FOURTH: The total number of shares of stock which the corporation is
authorized to issue is ${shares} shares of Common Stock, par value
$0.0001 per share.

FIFTH: The name and mailing address of the sole incorporator are:

   Name:    ${incorporator}
   Address: ${incorporatorAddr}

SIXTH: In furtherance and not in limitation of the powers conferred by
statute, the Board of Directors is expressly authorized to make, alter,
repeal, or adopt the bylaws of the corporation.

SEVENTH: To the fullest extent permitted by the ${statute},
a director of the corporation shall not be personally liable to the
corporation or its stockholders for monetary damages for breach of
fiduciary duty as a director. Any repeal or modification of this provision
shall not adversely affect any right or protection of a director existing
at the time of such repeal or modification.

EIGHTH: The corporation reserves the right to amend, alter, change, or
repeal any provision contained in this ${stateInfo.corpDocName}, in the
manner now or hereafter prescribed by the ${statute},
and all rights conferred upon stockholders herein are granted subject to
this reservation.

IN WITNESS WHEREOF, the undersigned, being the incorporator hereinabove
named, has executed this ${stateInfo.corpDocName} this _____ day of
_____________, 20___.


_________________________________
${incorporator}
Incorporator
`;
}

function generateIntercompanyLicense(
  info: CompanyInfo,
  foundation: FoundationInfo,
  effectiveDate: string,
  stateName: string
): string {
  return `INTERCOMPANY LICENSE AGREEMENT

This Intercompany License Agreement ("Agreement") is entered into as of
${effectiveDate || "[DATE]"} ("Effective Date"), by and between:

LICENSOR:  ${info.companyName || "[COMPANY NAME]"}, a ${stateName} corporation
           ("Company" or "Licensor")

LICENSEE:  ${foundation.foundationName || "[FOUNDATION NAME]"}, a ${stateName}
           nonprofit corporation ("Foundation" or "Licensee")

RECITALS

WHEREAS, Company owns certain proprietary technology and intellectual property
constituting a clinical decision support platform (the "Platform"); and

WHEREAS, Foundation is organized and operated exclusively for charitable and
educational purposes, and desires to use the Platform to advance its
mission of providing free clinical decision support to frontline health
workers in sub-Saharan Africa; and

WHEREAS, Company desires to support Foundation's mission by granting a
license to the Platform on the terms set forth herein.

NOW, THEREFORE, the parties agree as follows:

1. LICENSE GRANT

   1.1  Grant. Subject to the terms and conditions of this Agreement, Company
        hereby grants to Foundation a non-exclusive, non-transferable,
        royalty-free license to use, display, and operate the Platform solely
        for Foundation's nonprofit, charitable purposes as described in its
        organizational documents and as approved by the IRS under
        Section 501(c)(3) of the Internal Revenue Code.

   1.2  Restrictions. Foundation shall not: (a) sublicense, sell, resell,
        transfer, assign, or otherwise commercially exploit the Platform;
        (b) modify or create derivative works based on the Platform without
        Company's prior written consent; (c) reverse engineer, decompile, or
        disassemble the Platform; or (d) use the Platform for any commercial
        purpose or for the direct or indirect benefit of any for-profit entity.

2. LICENSE FEE

   2.1  Pilot Phase. During the period commencing on the Effective Date and
        ending on the third (3rd) anniversary thereof ("Pilot Phase"), the
        license fee shall be zero dollars ($0.00) per year ("Zero Fee").

   2.2  Post-Pilot Pricing. Following the Pilot Phase, Company reserves the
        right, upon not less than one hundred eighty (180) days' prior written
        notice, to convert the license fee to a cost-recovery pricing model
        not to exceed Company's actual direct costs of providing the Platform
        to Foundation. Any such pricing shall be negotiated in good faith and
        shall not exceed rates that would jeopardize Foundation's tax-exempt
        status.

3. INTELLECTUAL PROPERTY

   3.1  Ownership. As between the parties, Company retains all right, title,
        and interest in and to the Platform, including all intellectual
        property rights therein. Foundation acquires no ownership interest in
        the Platform by virtue of this Agreement.

   3.2  Feedback. Foundation may provide Company with feedback, suggestions,
        or enhancement requests regarding the Platform. Foundation hereby
        assigns to Company all rights in such feedback, and Company may
        incorporate it into the Platform without obligation to Foundation.

4. SUPPORT AND UPDATES

   Company shall use commercially reasonable efforts to provide Foundation
   with access to the Platform substantially in the same manner as provided
   to Company's commercial customers, including making available updates and
   bug fixes released during the term of this Agreement.

5. TERM AND TERMINATION

   5.1  Term. This Agreement commences on the Effective Date and continues
        indefinitely unless terminated as provided herein.

   5.2  Termination for Cause. Either party may terminate this Agreement upon
        thirty (30) days' written notice if the other party materially
        breaches this Agreement and fails to cure such breach within such
        notice period.

   5.3  Automatic Termination. This Agreement shall automatically terminate
        if Foundation's 501(c)(3) tax-exempt status is revoked or if
        Foundation ceases to operate for its stated charitable purposes.

6. DISCLAIMER AND LIMITATION OF LIABILITY

   THE PLATFORM IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND. COMPANY
   DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED. IN NO EVENT SHALL COMPANY
   BE LIABLE TO FOUNDATION FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR
   CONSEQUENTIAL DAMAGES.

7. GOVERNING LAW

   This Agreement shall be governed by the laws of the State of
   ${stateName}.

IN WITNESS WHEREOF, the parties have executed this Agreement as of the
Effective Date.

${info.companyName || "[COMPANY NAME]"} (Licensor):

By: _____________________________
Name: ___________________________
Title: __________________________
Date: ___________________________


${foundation.foundationName || "[FOUNDATION NAME]"} (Licensee):

By: _____________________________
Name: ___________________________
Title: __________________________
Date: ___________________________
`;
}

function generatePurposeNarrative(
  info: CompanyInfo,
  foundation: FoundationInfo,
  stateName: string
): string {
  const fname = foundation.foundationName || "[FOUNDATION NAME]";
  const purpose =
    foundation.foundationPurpose ||
    "To provide free clinical decision support to frontline health workers in sub-Saharan Africa";

  return `IRS FORM 1023 / 1023-EZ — ORGANIZATIONAL PURPOSE NARRATIVE

Organization: ${fname}
State of Formation: ${stateName}
Prepared by: ${info.founderName || "[FOUNDER NAME]"} (${info.founderEmail || "[EMAIL]"})

─────────────────────────────────────────────────────────────────────────────
ORGANIZATIONAL PURPOSE
─────────────────────────────────────────────────────────────────────────────

PARAGRAPH 1 — THE PROBLEM

Sub-Saharan Africa faces a critical shortage of trained clinical professionals,
with the World Health Organization estimating a deficit of over 2.4 million
physicians, nurses, and midwives across the region. In countries such as Ghana,
frontline community health workers (CHWs) and rural clinicians often make
life-or-death triage decisions without access to current clinical guidelines,
drug interaction databases, or specialist consultation. This access gap results
in preventable mortality, diagnostic errors, and inequitable health outcomes
that disproportionately affect low-income and rural populations who lack the
financial means to access private healthcare facilities.

PARAGRAPH 2 — THE SOLUTION

${fname} was organized exclusively to address this healthcare access crisis.
The Foundation's stated mission is: "${purpose}." To accomplish this mission,
the Foundation operates a digital clinical decision support platform that
provides evidence-based triage guidance, drug safety checks, disease reference
cards, outbreak surveillance, and AI-assisted diagnostic support — all
accessible offline on low-end Android devices widely available across the
region. The platform is provided entirely free of charge to qualifying health
workers and community clinics, with no subscription fees, licensing costs, or
data charges passed to beneficiaries. The Foundation actively partners with
government ministries of health, community health NGOs, and accredited medical
training institutions to distribute the platform and train its users.

PARAGRAPH 3 — CHARITABLE QUALIFICATION

${fname} qualifies as a tax-exempt organization under Section 501(c)(3) of
the Internal Revenue Code on the following grounds: (1) CHARITABLE — the
Foundation directly serves low-income and medically underserved populations
who cannot afford private healthcare access, combating the effects of poverty
and geographic isolation on health outcomes; (2) EDUCATIONAL — the platform
delivers clinical education and evidence-based practice guidelines to
frontline health workers who otherwise lack access to continuing medical
education resources, improving the overall standard of care; and (3) PUBLIC
HEALTH — the Foundation's outbreak surveillance and communicable disease
tracking features serve a broad public health function, aiding government
health authorities in identifying and responding to disease outbreaks that
threaten entire communities. No part of the Foundation's net earnings inures
to the benefit of any private shareholder or individual, and no substantial
part of its activities constitutes carrying on propaganda, attempting to
influence legislation, or participating in political campaigns.

─────────────────────────────────────────────────────────────────────────────
NOTE: This narrative was generated by Formation Wizard and should be reviewed
and customized by a licensed attorney or nonprofit formation specialist before
submission to the IRS. IRS processing times for Form 1023-EZ are typically
1–3 months; Form 1023 (full) may take 6–12 months.
─────────────────────────────────────────────────────────────────────────────
`;
}

function generateNextSteps(
  info: CompanyInfo,
  structure: EntityStructure,
  foundation: FoundationInfo,
  stateInfo: StateFilingInfo
): string {
  const isHybrid = structure === "hybrid";
  const isNonprofit = structure === "nonprofit";

  return `NEXT STEPS CHECKLIST
Formation: ${info.companyName || "[COMPANY NAME]"}${isHybrid ? ` + ${foundation.foundationName || "[FOUNDATION NAME]"}` : ""}
Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}

─────────────────────────────────────────────────────────────────────────────
IMMEDIATE (Week 1)
─────────────────────────────────────────────────────────────────────────────

${!isNonprofit ? `[ ] File C-Corp via Stripe Atlas — $500 flat fee
    → https://stripe.com/atlas
    Includes: DE incorporation, EIN, registered agent (1 yr), bank account
    Estimated time: 1–2 business days

` : ""}[ ] Have a licensed attorney review all generated documents before signing
    Look for an attorney experienced in startup IP and nonprofit law.
    Many offer flat-fee formation packages ($500–$2,000).

${!isNonprofit ? `[ ] Sign IP Assignment Agreement within 30 days of incorporation
    Do NOT delay — IP assigned after equity grants can create tax complications.
    Both Founder and an authorized officer of the Company must sign.

` : ""}─────────────────────────────────────────────────────────────────────────────
SHORT-TERM (Month 1–3)
─────────────────────────────────────────────────────────────────────────────

${!isNonprofit ? `[ ] Issue Founder shares via Restricted Stock Purchase Agreement (RSPA)
    Standard 4-year vest, 1-year cliff. File 83(b) election within 30 days
    of grant — missing this deadline has significant tax consequences.

[ ] Open a business bank account (Mercury or SVB) linked to your EIN

[ ] File Beneficial Ownership Information (BOI) report with FinCEN within
    90 days of incorporation — required for all new US entities as of 2024
    → https://boiefiling.fincen.gov/

` : ""}${isHybrid || isNonprofit ? `[ ] File IRS Form 1023-EZ if projected annual budget < $50,000/yr — $275 fee
    Use full Form 1023 if budget >= $50K or if you have complex activities.
    → https://www.pay.gov/public/form/start/88500000
    Required to receive tax-deductible donations.

[ ] Register as a foreign nonprofit in Ghana (if operating there)
    Contact Ghana's Registrar General's Department for NGO registration.

` : ""}─────────────────────────────────────────────────────────────────────────────
AI & CLOUD CREDITS
─────────────────────────────────────────────────────────────────────────────

[ ] Apply for Anthropic Startup Program
    → https://claude.com/programs/startups
    Provides API credits for eligible startups.

${isHybrid || isNonprofit ? `[ ] Apply for Anthropic Nonprofit Credits (after 501(c)(3) approved)
    Once your determination letter arrives, apply for nonprofit AI credits.
    → https://www.anthropic.com/contact-us (select "Nonprofits")

` : ""}[ ] Apply for AWS Activate (up to $100K in credits for startups)
    → https://aws.amazon.com/activate/

[ ] Apply for Google for Nonprofits (Google Workspace + $10K/mo Ads grant)
    → https://www.google.com/nonprofits/
    Requires 501(c)(3) determination letter.

─────────────────────────────────────────────────────────────────────────────
ONGOING
─────────────────────────────────────────────────────────────────────────────

[ ] File your ${stateInfo.name} annual report / franchise tax (check your state's due date)
    ${stateInfo.abbr === "DE" ? "Delaware: minimum $50, due March 1 each year. Can be $400+ depending on share count." : `File with the ${stateInfo.portalLabel} to keep your entity in good standing.`}

[ ] Keep board meeting minutes — at minimum an annual meeting on record

${isHybrid || isNonprofit ? `[ ] File IRS Form 990 annually once 501(c)(3) is active
    Form 990-N (e-Postcard) for orgs with < $50K gross receipts.

[ ] Maintain separate bank accounts for C-Corp and Foundation

` : ""}─────────────────────────────────────────────────────────────────────────────
DISCLAIMER: This checklist is informational only and does not constitute
legal or tax advice. Consult a licensed attorney and CPA before making
any decisions.
─────────────────────────────────────────────────────────────────────────────
`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressBar({ step }: { step: number }) {
  const steps = ["Company Info", "IP Inventory", "Entity Structure", "Documents"];
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between mb-3">
        {steps.map((label, idx) => {
          const num = idx + 1;
          const isActive = num === step;
          const isDone = num < step;
          return (
            <div key={label} className="flex flex-col items-center flex-1">
              <div className="flex items-center w-full">
                {idx > 0 && (
                  <div
                    className="flex-1 h-0.5 transition-all duration-300"
                    style={{ background: isDone ? "#1B3F7B" : "#e2e8f0" }}
                  />
                )}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 shrink-0"
                  style={{
                    background: isDone || isActive ? "#1B3F7B" : "#e2e8f0",
                    color: isDone || isActive ? "white" : "#94a3b8",
                  }}
                >
                  {isDone ? (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2.5 7L5.5 10L11.5 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    num
                  )}
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className="flex-1 h-0.5 transition-all duration-300"
                    style={{ background: num < step ? "#1B3F7B" : "#e2e8f0" }}
                  />
                )}
              </div>
              <span
                className="text-xs mt-1.5 font-medium hidden sm:block"
                style={{ color: isActive ? "#1B3F7B" : isDone ? "#64748b" : "#94a3b8" }}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DocBlock({
  title,
  description,
  content,
}: {
  title: string;
  description: string;
  content: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [content]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
      <div
        className="px-5 py-4 flex items-start justify-between gap-4"
        style={{ background: "#1B3F7B" }}
      >
        <div>
          <h3 className="text-white font-semibold text-base">{title}</h3>
          <p className="text-blue-200 text-xs mt-0.5">{description}</p>
        </div>
        <button
          onClick={handleCopy}
          className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={{
            background: copied ? "#22c55e" : "rgba(255,255,255,0.18)",
            color: "white",
          }}
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="doc-block rounded-none border-0">{content}</pre>
    </div>
  );
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────

export default function WizardPage() {
  const [step, setStep] = useState(1);

  // Step 1
  const [info, setInfo] = useState<CompanyInfo>({
    founderName: "",
    companyName: "",
    state: "DE",
    incorporationDate: "",
    founderEmail: "",
    githubRepo: "",
    numShares: "10000000",
    incorporatorAddress: "",
    registeredAgentName: "",
    registeredAgentAddress: "",
  });

  // Step 2
  const [ipItems, setIpItems] = useState<IPItem[]>([]);
  const [customInput, setCustomInput] = useState("");

  // Step 3
  const [structure, setStructure] = useState<EntityStructure>("ccorp");
  const [foundation, setFoundation] = useState<FoundationInfo>({
    foundationName: "",
    foundationPurpose: "",
  });

  // Step 4 — download all
  const [allCopied, setAllCopied] = useState(false);

  // Formation filing
  const [showManual, setShowManual] = useState(false);
  const [filingLoading, setFilingLoading] = useState(false);
  const [filingError, setFilingError] = useState("");
  const [formationSuccess, setFormationSuccess] = useState<{ orderId: string; companyName: string } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("formation") === "success") {
      const orderId = params.get("orderId") ?? "";
      setFormationSuccess({ orderId, companyName: info.companyName || "your company" });
      setStep(4);
      window.history.replaceState({}, "", "/wizard");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleFileForMe() {
    if (!info.founderEmail) {
      setFilingError("Add your email address in Step 1 before filing.");
      return;
    }
    setFilingLoading(true);
    setFilingError("");
    try {
      const res = await fetch("/api/formation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: info.companyName,
          state: info.state,
          entityType: structure,
          founderEmail: info.founderEmail,
          wizardData: { ...info, structure },
        }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "Something went wrong");
      window.location.href = data.url;
    } catch (e) {
      setFilingError(e instanceof Error ? e.message : "Something went wrong");
      setFilingLoading(false);
    }
  }

  const isHybrid = structure === "hybrid";
  const isNonprofit = structure === "nonprofit";

  const stateInfo: StateFilingInfo = getState(info.state) ?? getState("DE")!;

  const effectiveDate = info.incorporationDate
    ? new Date(info.incorporationDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "[INCORPORATION DATE]";

  // Generated docs
  const docs: Array<{ title: string; description: string; content: string; show: boolean }> = [
    {
      title: `Document 0: ${stateInfo.corpDocName}`,
      description: `The official document filed with the State of ${stateInfo.name} to form ${info.companyName || "your corporation"}. Filing fee: $${stateInfo.corpFee}. Processing: ${stateInfo.processingTime}.`,
      content: generateCertificateOfIncorporation(info, stateInfo),
      show: !isNonprofit,
    },
    {
      title: "Document 1: IP Assignment Agreement",
      description: `Assigns all checked IP from ${info.founderName || "Founder"} to ${info.companyName || "Company"} in exchange for ${parseInt(info.numShares || "10000000").toLocaleString()} shares.`,
      content: generateIPAssignment(info, ipItems, effectiveDate, stateInfo.name),
      show: !isNonprofit,
    },
    {
      title: "Document 2: Intercompany License Agreement",
      description: `${info.companyName || "Company"} licenses the platform to ${foundation.foundationName || "Foundation"} at $0/yr during pilot, with cost-recovery option after 3 years.`,
      content: generateIntercompanyLicense(info, foundation, effectiveDate, stateInfo.name),
      show: isHybrid,
    },
    {
      title: isHybrid ? `Document 2b: Foundation ${stateInfo.nonprofitDocName}` : `Document 1: ${stateInfo.nonprofitDocName}`,
      description: `The official document filed with the State of ${stateInfo.name} to form ${foundation.foundationName || "your nonprofit foundation"} as a nonstock nonprofit corporation. Filing fee: $${stateInfo.nonprofitFee}.`,
      content: generateNonprofitArticles(info, foundation, stateInfo),
      show: isHybrid || isNonprofit,
    },
    {
      title: isHybrid ? "Document 3: 501(c)(3) Organizational Purpose Narrative" : "Document 2: 501(c)(3) Organizational Purpose Narrative",
      description: "3-paragraph IRS Form 1023/1023-EZ organizational purpose statement.",
      content: generatePurposeNarrative(info, foundation, stateInfo.name),
      show: isHybrid || isNonprofit,
    },
    {
      title: "Document 4: Next Steps Checklist",
      description: "Actionable checklist for completing your formation.",
      content: generateNextSteps(info, structure, foundation, stateInfo),
      show: true,
    },
  ];

  const visibleDocs = docs.filter((d) => d.show);

  function handleDownloadAll() {
    const bundle = visibleDocs
      .map((d) => `${"═".repeat(80)}\n${d.title.toUpperCase()}\n${"═".repeat(80)}\n\n${d.content}`)
      .join("\n\n\n");

    const blob = new Blob([bundle], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `formation-documents-${(info.companyName || "company").replace(/\s+/g, "-").toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleCopyAll() {
    const bundle = visibleDocs
      .map((d) => `${"═".repeat(80)}\n${d.title.toUpperCase()}\n${"═".repeat(80)}\n\n${d.content}`)
      .join("\n\n\n");
    navigator.clipboard.writeText(bundle).then(() => {
      setAllCopied(true);
      setTimeout(() => setAllCopied(false), 2000);
    });
  }

  function addCustomItem() {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    setIpItems((prev) => [
      ...prev,
      { id: `custom-${Date.now()}`, label: trimmed, checked: true },
    ]);
    setCustomInput("");
  }

  function toggleItem(id: string) {
    setIpItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  }

  function InputField({
    label,
    value,
    onChange,
    placeholder,
    type = "text",
    hint,
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    type?: string;
    hint?: string;
  }) {
    return (
      <div className="mb-5">
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          {label}
        </label>
        {hint && <p className="text-xs text-gray-400 mb-1.5">{hint}</p>}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 transition-all"
          style={{ boxSizing: "border-box" }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#1B3F7B")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F4FA]">
      {/* Top nav */}
      <header style={{ background: "#1B3F7B" }} className="shadow-md">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="3" y="1" width="10" height="14" rx="1" fill="#1B3F7B" opacity="0.9" />
                <rect x="5" y="4" width="6" height="1" rx="0.5" fill="white" />
                <rect x="5" y="7" width="4" height="1" rx="0.5" fill="white" />
                <rect x="5" y="10" width="5" height="1" rx="0.5" fill="white" />
              </svg>
            </div>
            <span className="text-white font-bold text-base">Formation Wizard</span>
          </div>
          <span className="text-blue-200 text-sm">Step {step} of 4</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <ProgressBar step={step} />

        {/* ── STEP 1 ─────────────────────────────────────────────────────────── */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Company Information</h2>
            <p className="text-sm text-gray-500 mb-6">
              Basic details about your founder and the corporation being formed.
            </p>

            <InputField
              label="Legal Founder Name"
              value={info.founderName}
              onChange={(v) => setInfo((p) => ({ ...p, founderName: v }))}
              placeholder="Full legal name as it will appear on documents"
            />
            <InputField
              label="Company Name"
              value={info.companyName}
              onChange={(v) => setInfo((p) => ({ ...p, companyName: v }))}
              placeholder="MedOS Inc"
            />
            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                State of Incorporation
              </label>
              <select
                value={info.state}
                onChange={(e) => setInfo((p) => ({ ...p, state: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 transition-all appearance-none"
              >
                {STATES_LIST.map((s) => (
                  <option key={s.abbr} value={s.abbr}>
                    {s.name} ({s.abbr}) — ${s.corpFee} to file
                  </option>
                ))}
              </select>
              {stateInfo.notes && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mt-2">
                  {stateInfo.notes}
                </p>
              )}
            </div>
            <InputField
              label="Incorporation Date"
              value={info.incorporationDate}
              onChange={(v) => setInfo((p) => ({ ...p, incorporationDate: v }))}
              type="date"
              hint="Leave blank if not yet incorporated — a placeholder will appear in documents."
            />
            <InputField
              label="Founder Email"
              value={info.founderEmail}
              onChange={(v) => setInfo((p) => ({ ...p, founderEmail: v }))}
              placeholder="founder@example.com"
              type="email"
            />
            <InputField
              label="GitHub Repository URL"
              value={info.githubRepo}
              onChange={(v) => setInfo((p) => ({ ...p, githubRepo: v }))}
              placeholder="https://github.com/yourorg/yourrepo"
            />
            <InputField
              label="Incorporator Mailing Address"
              value={info.incorporatorAddress}
              onChange={(v) => setInfo((p) => ({ ...p, incorporatorAddress: v }))}
              placeholder="123 Main St, City, State, ZIP"
              hint="Your personal mailing address — appears on the Certificate of Incorporation."
            />
            <div className="mb-5 p-4 rounded-xl bg-amber-50 border border-amber-100">
              <p className="text-xs font-semibold text-amber-800 mb-1">{stateInfo.name} Registered Agent Required</p>
              <p className="text-xs text-amber-700 mb-2">
                Every state requires a registered agent with a physical address in that state.
                Common options: Northwest Registered Agent (~$125/yr), Registered Agents Inc (~$50/yr), Incfile (~$119/yr).
              </p>
            </div>
            <InputField
              label="Registered Agent Name"
              value={info.registeredAgentName}
              onChange={(v) => setInfo((p) => ({ ...p, registeredAgentName: v }))}
              placeholder="Northwest Registered Agent, LLC"
              hint="The registered agent company or individual name."
            />
            <InputField
              label={`Registered Agent Street Address (${stateInfo.name})`}
              value={info.registeredAgentAddress}
              onChange={(v) => setInfo((p) => ({ ...p, registeredAgentAddress: v }))}
              placeholder={`123 Main St, [City], ${stateInfo.abbr} [ZIP]`}
              hint="Get this from your registered agent after signing up with them."
            />
            <InputField
              label="Number of Authorized Shares"
              value={info.numShares}
              onChange={(v) => setInfo((p) => ({ ...p, numShares: v.replace(/\D/g, "") }))}
              placeholder="10000000"
              hint="Shares authorized in Certificate of Incorporation. Default: 10,000,000."
            />
          </div>
        )}

        {/* ── STEP 2 ─────────────────────────────────────────────────────────── */}
        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-1">IP Inventory</h2>
            <p className="text-sm text-gray-500 mb-6">
              Select the intellectual property assets to assign to the corporation. All are
              pre-checked. Add custom items below.
            </p>

            <div className="space-y-2 mb-6">
              {ipItems.map((item) => (
                <label
                  key={item.id}
                  className="flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all hover:bg-blue-50"
                  style={{
                    borderColor: item.checked ? "#1B3F7B" : "#e5e7eb",
                    background: item.checked ? "#f0f4ff" : "white",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => toggleItem(item.id)}
                    className="mt-0.5 accent-[#1B3F7B]"
                  />
                  <span className="text-sm text-gray-800">{item.label}</span>
                </label>
              ))}
            </div>

            {/* Add custom item */}
            <div className="border-t border-gray-100 pt-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Add Custom IP Item
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  placeholder="Describe the IP asset…"
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none"
                  onKeyDown={(e) => e.key === "Enter" && addCustomItem()}
                />
                <button
                  onClick={addCustomItem}
                  className="px-4 py-2.5 rounded-xl text-white text-sm font-medium transition-opacity hover:opacity-90"
                  style={{ background: "#1B3F7B" }}
                >
                  Add
                </button>
              </div>
            </div>

            <div className="mt-4 p-3 rounded-xl bg-blue-50 border border-blue-100">
              <p className="text-xs text-blue-700">
                <span className="font-semibold">
                  {ipItems.filter((i) => i.checked).length} items
                </span>{" "}
                selected for assignment.
              </p>
            </div>
          </div>
        )}

        {/* ── STEP 3 ─────────────────────────────────────────────────────────── */}
        {step === 3 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Entity Structure</h2>
            <p className="text-sm text-gray-500 mb-6">
              Choose the legal structure for your organization. The hybrid approach is
              recommended for mission-driven for-profit founders.
            </p>

            <div className="space-y-3 mb-6">
              {[
                {
                  value: "ccorp" as EntityStructure,
                  label: "C-Corp Only",
                  desc: "A standard Delaware C-Corporation. Best if you plan to raise venture capital and don't need a public benefit / nonprofit arm.",
                },
                {
                  value: "hybrid" as EntityStructure,
                  label: "C-Corp + 501(c)(3) Foundation",
                  desc: "Recommended for mission-driven founders. The C-Corp handles commercial operations; the Foundation receives donations, grants, and provides services free to beneficiaries.",
                  badge: "Recommended",
                },
                {
                  value: "nonprofit" as EntityStructure,
                  label: "501(c)(3) Only",
                  desc: "A standalone nonprofit. Best if you are not planning commercial operations and will operate entirely on grants and donations.",
                },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all"
                  style={{
                    borderColor: structure === opt.value ? "#1B3F7B" : "#e5e7eb",
                    background: structure === opt.value ? "#f0f4ff" : "white",
                  }}
                >
                  <input
                    type="radio"
                    name="structure"
                    value={opt.value}
                    checked={structure === opt.value}
                    onChange={() => setStructure(opt.value)}
                    className="mt-1 accent-[#1B3F7B]"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-800">{opt.label}</span>
                      {opt.badge && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: "#1B3F7B", color: "white" }}
                        >
                          {opt.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>

            {(isHybrid || isNonprofit) && (
              <div className="border-t border-gray-100 pt-5 space-y-4">
                <p className="text-sm font-semibold text-gray-700">Foundation Details</p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Foundation Name
                  </label>
                  <input
                    type="text"
                    value={foundation.foundationName}
                    onChange={(e) =>
                      setFoundation((p) => ({ ...p, foundationName: e.target.value }))
                    }
                    placeholder="MedOS Africa Foundation"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Foundation Purpose
                  </label>
                  <textarea
                    value={foundation.foundationPurpose}
                    onChange={(e) =>
                      setFoundation((p) => ({ ...p, foundationPurpose: e.target.value }))
                    }
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none resize-none"
                    placeholder="To provide free clinical decision support…"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    This sentence will appear verbatim in the IRS Purpose Narrative.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 4 ─────────────────────────────────────────────────────────── */}
        {step === 4 && (
          <div>
            {/* ── Formation success banner ── */}
            {formationSuccess && (
              <div className="rounded-2xl border-2 border-green-200 bg-green-50 p-6 mb-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center shrink-0">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M5 10l4 4 6-7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-base mb-1">Payment received — filing in progress</h3>
                    <p className="text-sm text-gray-600 mb-1">
                      We&apos;ve submitted <strong>{formationSuccess.companyName}</strong> to the state. You&apos;ll receive
                      email updates at each step: state approval → EIN → registered agent confirmation.
                    </p>
                    <p className="text-xs text-gray-400">Order ID: {formationSuccess.orderId}</p>
                  </div>
                </div>
              </div>
            )}

            {/* ── File for me card (shown when no active order) ── */}
            {!formationSuccess && (
              <div className="rounded-2xl border-2 border-[#1B3F7B]/20 bg-[#1B3F7B]/[0.03] p-6 mb-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#1B3F7B" }}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M10 2L12.5 7.5H18L13.5 11L15.5 17L10 13.5L4.5 17L6.5 11L2 7.5H7.5L10 2Z" fill="white" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                      <h3 className="font-bold text-gray-900 text-base">Have us file this for you</h3>
                      <span className="text-xl font-semibold text-gray-900">$249</span>
                    </div>
                    <p className="text-sm text-gray-500 mb-3">
                      We submit to the {stateInfo.name} Secretary of State on your behalf. No trips to government portals.
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1 mb-4">
                      {[
                        `State filing fee included (${stateInfo.name} ${isNonprofit ? `$${stateInfo.nonprofitFee}` : `$${stateInfo.corpFee}`})`,
                        "EIN from the IRS",
                        "Registered agent (first year)",
                        "Email updates at every step",
                      ].map((f) => (
                        <li key={f} className="flex items-center gap-2">
                          <span className="text-green-500 shrink-0">✓</span>
                          {f}
                        </li>
                      ))}
                    </ul>
                    {filingError && (
                      <p className="text-sm text-red-600 mb-3">{filingError}</p>
                    )}
                    <button
                      onClick={handleFileForMe}
                      disabled={filingLoading}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
                      style={{ background: "#1B3F7B" }}
                    >
                      {filingLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Redirecting to checkout…
                        </>
                      ) : (
                        <>File {info.companyName || "my company"} — $249 →</>
                      )}
                    </button>
                    <p className="text-xs text-gray-400 mt-3">
                      Secure checkout via Stripe. Your documents above are also yours to keep.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-start justify-between mb-5 gap-4 flex-wrap">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Your Documents</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {visibleDocs.length} documents generated. Review, copy, and share with your
                  attorney.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCopyAll}
                  className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {allCopied ? "Copied!" : "Copy All"}
                </button>
                <button
                  onClick={handleDownloadAll}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-white hover:opacity-90 transition-opacity"
                  style={{ background: "#1B3F7B" }}
                >
                  Download .txt
                </button>
              </div>
            </div>

            <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-100">
              <p className="text-xs text-amber-800">
                <span className="font-semibold">Not legal advice.</span> These documents are a
                starting point. Have a licensed attorney review all agreements before signing.
              </p>
            </div>

            {visibleDocs.map((doc) => (
              <DocBlock
                key={doc.title}
                title={doc.title}
                description={doc.description}
                content={doc.content}
              />
            ))}

            {(isHybrid || isNonprofit) && (
              <div className="rounded-2xl border-2 border-dashed border-green-200 bg-green-50 p-6 mt-2">
                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "#166534" }}
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M10 2a8 8 0 100 16A8 8 0 0010 2zm-1 11.5L5.5 10l1.4-1.4L9 12.6l5.1-5.1 1.4 1.4L9 13.5z" fill="white" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-base mb-1">
                      File {foundation.foundationName || "the Foundation"} with {stateInfo.name} (Nonprofit)
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Copy the <strong>{stateInfo.nonprofitDocName}</strong> above, then file it as a
                      <strong> nonstock nonprofit corporation</strong> at the {stateInfo.name} filing portal.
                      Filing fee: <strong>${stateInfo.nonprofitFee}</strong>. Processing: {stateInfo.processingTime}.
                    </p>
                    <div className="text-sm text-gray-700 space-y-1.5 mb-4">
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-green-200 text-green-800 text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">1</span>
                        <span>Go to the {stateInfo.name} filing portal and select <strong>Nonprofit / Nonstock Corporation</strong></span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-green-200 text-green-800 text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">2</span>
                        <span>Enter the foundation name exactly as written in the {stateInfo.nonprofitDocName} above</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-green-200 text-green-800 text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">3</span>
                        <span>Paste your registered agent name and {stateInfo.name} address</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-green-200 text-green-800 text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">4</span>
                        <span>Select <strong>"Non-Stock"</strong> and enter <strong>no authorized shares</strong> (nonprofits have none)</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-green-200 text-green-800 text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">5</span>
                        <span>Pay ${stateInfo.nonprofitFee} by credit card. You'll receive your stamped document by email within {stateInfo.processingTime}.</span>
                      </div>
                    </div>
                    <a
                      href={stateInfo.filingPortal}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                      style={{ background: "#166534" }}
                    >
                      Open {stateInfo.portalLabel} →
                    </a>
                    <p className="text-xs text-gray-400 mt-3">
                      Cost: ${stateInfo.nonprofitFee} filing + ~$125/yr registered agent. Then apply to IRS (below).
                    </p>
                  </div>
                </div>
              </div>
            )}

            {(isHybrid || isNonprofit) && (
              <div className="rounded-2xl border-2 border-dashed border-purple-200 bg-purple-50 p-6 mt-2">
                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "#6B21A8" }}
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M9 2H4a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V9l-7-7z" fill="white" opacity=".6" />
                      <path d="M9 2v7h7" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-base mb-1">Apply for 501(c)(3) Tax-Exempt Status — IRS Form 1023-EZ</h3>
                    <p className="text-sm text-gray-600 mb-1">
                      Once Delaware approves the nonprofit incorporation, apply to the IRS for federal
                      tax exemption. Use <strong>Form 1023-EZ</strong> (short form, online only) if
                      projected annual gross receipts will be <strong>≤ $50,000</strong> and total assets
                      are <strong>≤ $250,000</strong>. Otherwise use the full Form 1023.
                    </p>
                    <p className="text-sm text-gray-500 mb-3">
                      Filing fee: <strong>$275</strong> (1023-EZ) or <strong>$600</strong> (full 1023).
                      Approval time: <strong>1–3 months</strong> for EZ, <strong>6–12 months</strong> for full.
                    </p>
                    <div className="text-sm text-gray-700 space-y-1.5 mb-4">
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-purple-200 text-purple-800 text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">1</span>
                        <span>Go to pay.gov and search for <strong>"Form 1023-EZ"</strong></span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-purple-200 text-purple-800 text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">2</span>
                        <span>Enter foundation name, EIN (get one free at irs.gov/ein), and state of incorporation (<strong>{stateInfo.name}</strong>)</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-purple-200 text-purple-800 text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">3</span>
                        <span>Paste your <strong>501(c)(3) Purpose Narrative</strong> (Document 3 above) into the "Narrative Description" field</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-purple-200 text-purple-800 text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">4</span>
                        <span>Certify the dissolution clause and pay the $275 filing fee</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-purple-200 text-purple-800 text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">5</span>
                        <span>IRS emails your determination letter (the official 501(c)(3) approval) to the address on file</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <a
                        href="https://pay.gov/public/form/start/61817462"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                        style={{ background: "#6B21A8" }}
                      >
                        File Form 1023-EZ on pay.gov →
                      </a>
                      <a
                        href="https://www.irs.gov/businesses/small-businesses-self-employed/apply-for-an-employer-identification-number-ein-online"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border border-purple-300 text-purple-800 bg-white hover:bg-purple-50 transition-colors"
                      >
                        Get EIN (free, instant) →
                      </a>
                    </div>
                    <p className="text-xs text-gray-400 mt-3">
                      Tip: Get your EIN before filing 1023-EZ — you need it on the form.
                      EIN takes ~5 minutes online.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!isNonprofit && (
              <div className="mt-2">
                <button
                  onClick={() => setShowManual((v) => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  <span>Prefer to file it yourself?</span>
                  <span className="text-gray-400">{showManual ? "↑ Hide" : "↓ Show instructions"}</span>
                </button>
                {showManual && (
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 mt-2">
                    <p className="text-sm text-gray-600 mb-3">
                      Copy <strong>Document 0</strong> above, then file at the {stateInfo.name} portal.
                      Filing fee: <strong>${stateInfo.corpFee}</strong>. Processing: {stateInfo.processingTime}.
                    </p>
                    {stateInfo.notes && (
                      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-3">
                        {stateInfo.notes}
                      </p>
                    )}
                    <div className="text-sm text-gray-700 space-y-1.5 mb-4">
                      {[
                        `Go to the ${stateInfo.name} filing portal and select "${stateInfo.corpDocName}"`,
                        `Enter your corporation name exactly as written in Document 0`,
                        `Paste your registered agent name and ${stateInfo.name} address`,
                        `Enter authorized shares: ${parseInt(info.numShares || "10000000").toLocaleString()} shares at $0.0001 par value`,
                        `Pay $${stateInfo.corpFee} filing fee by credit card`,
                      ].map((step, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-600 text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">{i + 1}</span>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                    <a
                      href={stateInfo.filingPortal}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Open {stateInfo.portalLabel} →
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Navigation ────────────────────────────────────────────────────── */}
        <div className="flex justify-between mt-6">
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="px-5 py-2.5 rounded-xl text-sm font-medium border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
            >
              ← Back
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity"
              style={{ background: "#1B3F7B" }}
            >
              Next →
            </button>
          ) : (
            <button
              onClick={() => setStep(1)}
              className="px-5 py-2.5 rounded-xl text-sm font-medium border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Start Over
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
