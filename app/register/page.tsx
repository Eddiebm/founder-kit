"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const NAICS_CODES: Record<string, { code: string; description: string }[]> = {
  "Technology & AI": [
    { code: "541511", description: "Custom Computer Programming Services" },
    { code: "511210", description: "Software Publishers" },
    { code: "541714", description: "R&D in Biotechnology (except Nanobiotechnology)" },
    { code: "541715", description: "R&D in Physical, Engineering & Life Sciences" },
  ],
  "Healthcare": [
    { code: "541714", description: "R&D in Biotechnology" },
    { code: "621999", description: "All Other Miscellaneous Ambulatory Health Care" },
    { code: "339112", description: "Surgical & Medical Instrument Manufacturing" },
    { code: "541715", description: "R&D in Physical, Engineering & Life Sciences" },
  ],
  "Education": [
    { code: "611710", description: "Educational Support Services" },
    { code: "611699", description: "All Other Miscellaneous Schools & Instruction" },
    { code: "541512", description: "Computer Systems Design Services" },
  ],
  "Agriculture & Food": [
    { code: "111998", description: "All Other Miscellaneous Crop Farming" },
    { code: "541690", description: "Other Scientific & Technical Consulting" },
    { code: "311999", description: "All Other Miscellaneous Food Manufacturing" },
  ],
  "Climate & Environment": [
    { code: "541620", description: "Environmental Consulting Services" },
    { code: "541715", description: "R&D in Physical, Engineering & Life Sciences" },
    { code: "221118", description: "Other Electric Power Generation" },
  ],
  "Arts & Culture": [
    { code: "711510", description: "Independent Artists, Writers, and Performers" },
    { code: "711190", description: "Other Performing Arts Companies" },
    { code: "512110", description: "Motion Picture and Video Production" },
  ],
  "Media & Journalism": [
    { code: "519130", description: "Internet Publishing and Broadcasting" },
    { code: "511110", description: "Newspaper Publishers" },
    { code: "711510", description: "Independent Artists, Writers, and Performers" },
  ],
  "Other": [
    { code: "541690", description: "Other Scientific & Technical Consulting" },
    { code: "541990", description: "All Other Professional, Scientific & Technical Services" },
  ],
};

const STEPS = [
  {
    id: "ein",
    number: 1,
    title: "Get your EIN",
    agency: "IRS",
    badge: "Instant online",
    badgeColor: "bg-green-100 text-green-700",
    description: "Your Employer Identification Number is the federal tax ID for your entity. Required before registering anywhere else. Apply online in 15 minutes — you get the number immediately.",
    url: "https://www.irs.gov/businesses/small-businesses-self-employed/apply-for-an-employer-identification-number-ein-online",
    urlLabel: "Apply for EIN at IRS.gov →",
    requiredFor: ["SAM.gov registration", "All federal grants", "Bank accounts"],
    whatYouNeed: ["Legal business name", "Business address", "Responsible party's SSN", "Business structure (LLC, Corp, etc.)"],
    tip: "If you used the Formation Wizard, your entity name and state are already decided. Have that info handy.",
    color: "border-blue-200 bg-blue-50",
    iconColor: "bg-blue-600",
  },
  {
    id: "sam",
    number: 2,
    title: "Register in SAM.gov",
    agency: "General Services Administration",
    badge: "7–14 business days",
    badgeColor: "bg-amber-100 text-amber-700",
    description: "SAM (System for Award Management) is the master federal vendor registry. Every federal grant and contract requires an active SAM registration. You'll receive a UEI (Unique Entity Identifier) and CAGE code. Renews annually.",
    url: "https://sam.gov/content/entity-registration",
    urlLabel: "Register at SAM.gov →",
    requiredFor: ["All SBIR/STTR programs", "NIH, NSF, USDA, DOE grants", "USAID contracts", "DoD contracts"],
    whatYouNeed: ["EIN (from step 1)", "NAICS code (see selector below)", "Banking info for direct deposit", "Business address + point of contact", "Fiscal year end date"],
    tip: "Start SAM.gov registration the day your entity is formed. The 7–14 day processing window is the most common reason founders miss grant deadlines.",
    color: "border-amber-200 bg-amber-50",
    iconColor: "bg-amber-500",
  },
  {
    id: "grants-gov",
    number: 3,
    title: "Register on Grants.gov",
    agency: "HHS / Federal Grants Portal",
    badge: "1–3 days after SAM",
    badgeColor: "bg-blue-100 text-blue-700",
    description: "Grants.gov is the central portal for civilian federal grant applications (NIH, NSF, USDA, NEA, NEH, and 25+ agencies). Requires an active SAM registration. You'll also need to designate an Authorized Organizational Representative (AOR).",
    url: "https://www.grants.gov/web/grants/register.html",
    urlLabel: "Register at Grants.gov →",
    requiredFor: ["NIH grants", "NSF grants", "NEA and NEH grants", "USDA grants", "Most civilian federal grants"],
    whatYouNeed: ["Active SAM.gov registration", "UEI from SAM.gov", "Authorized Organizational Representative designated"],
    tip: "The AOR role can be you as founder. You'll need to verify the AOR via email after SAM registration is confirmed.",
    color: "border-indigo-200 bg-indigo-50",
    iconColor: "bg-indigo-600",
  },
  {
    id: "sbir-gov",
    number: 4,
    title: "Register on SBIR.gov",
    agency: "Small Business Administration",
    badge: "1 day",
    badgeColor: "bg-green-100 text-green-700",
    description: "SBA's SBIR portal tracks your company's SBIR/STTR participation history. Required for NSF SBIR, DOE SBIR, USDA SBIR, and EPA SBIR. NIH uses eRA Commons instead (next step).",
    url: "https://www.sbir.gov/registration",
    urlLabel: "Register at SBIR.gov →",
    requiredFor: ["NSF SBIR/STTR", "DOE / ARPA-E SBIR", "USDA SBIR", "EPA SBIR", "DOD SBIR"],
    whatYouNeed: ["Active SAM.gov registration", "UEI number", "Business size certification (<500 employees)"],
    tip: "Only US-owned small businesses with fewer than 500 employees qualify for SBIR/STTR. At least 51% US-owned.",
    color: "border-purple-200 bg-purple-50",
    iconColor: "bg-purple-600",
  },
  {
    id: "era-commons",
    number: 5,
    title: "Create eRA Commons account",
    agency: "National Institutes of Health",
    badge: "1–2 days",
    badgeColor: "bg-green-100 text-green-700",
    description: "NIH's electronic Research Administration system. Required for NIH SBIR/STTR Phase I & II, NIH R01, and Fogarty International grants. The Principal Investigator (PI) must have a personal eRA Commons account linked to your institution.",
    url: "https://public.era.nih.gov/commonsplus/public/registration/initRegistration.era",
    urlLabel: "Register at eRA Commons →",
    requiredFor: ["NIH SBIR/STTR Phase I & II", "NIH R01 Research Grants", "NIH Fogarty International Grants"],
    whatYouNeed: ["Grants.gov registration", "Principal Investigator personal info", "Institution/org already registered in eRA Commons"],
    tip: "If your org is new, you'll need to request an institutional account from NIH before the PI can register.",
    color: "border-teal-200 bg-teal-50",
    iconColor: "bg-teal-600",
  },
  {
    id: "research-gov",
    number: 6,
    title: "Register on Research.gov",
    agency: "National Science Foundation",
    badge: "1 day",
    badgeColor: "bg-green-100 text-green-700",
    description: "NSF's portal for grant applications and management. Required for NSF SBIR, NSF CAREER Award, and NSF Convergence Accelerator. Your organization and PI both need accounts.",
    url: "https://www.research.gov/research-portal/appmanager/base/desktop?_nfpb=true&_pageLabel=research_home_page",
    urlLabel: "Register at Research.gov →",
    requiredFor: ["NSF SBIR/STTR", "NSF CAREER Award", "NSF Convergence Accelerator"],
    whatYouNeed: ["Active SAM.gov registration", "Grants.gov registration", "PI personal account"],
    tip: "NSF requires your organization to be registered before any individual PI can submit.",
    color: "border-cyan-200 bg-cyan-50",
    iconColor: "bg-cyan-600",
  },
];

const FEDERAL_STEPS_REQUIRED: Record<string, string[]> = {
  "nih-sttr-sbir": ["ein", "sam", "grants-gov", "era-commons"],
  "nsf-sbir": ["ein", "sam", "grants-gov", "sbir-gov", "research-gov"],
  "usda-sbir": ["ein", "sam", "grants-gov", "sbir-gov"],
  "arpa-e": ["ein", "sam", "sbir-gov"],
  "usaid-div": ["ein", "sam", "grants-gov"],
  "nea": ["ein", "sam", "grants-gov"],
  "neh": ["ein", "sam", "grants-gov"],
};

export default function RegisterPage() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [industry, setIndustry] = useState("");
  const [startDate] = useState(() => {
    const d = new Date();
    return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  });
  const [eligibleDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 18);
    return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  });

  useEffect(() => {
    const saved = localStorage.getItem("fk_reg_checklist");
    if (saved) setChecked(JSON.parse(saved));
  }, []);

  function toggle(id: string) {
    setChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem("fk_reg_checklist", JSON.stringify(next));
      return next;
    });
  }

  const completedCount = STEPS.filter((s) => checked[s.id]).length;
  const progress = Math.round((completedCount / STEPS.length) * 100);

  const naicsList = NAICS_CODES[industry] ?? [];

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link href="/grants" className="text-[#1a5c3a] text-sm hover:underline">← Back to Grants</Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-4 mb-2">Federal Registration Roadmap</h1>
        <p className="text-gray-500">Complete these registrations before applying to any US federal grant, SBIR, or contract. Missing even one will get your application rejected.</p>
      </div>

      {/* Timeline banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="font-semibold text-amber-900 text-sm">Start today: {startDate}</p>
            <p className="text-amber-700 text-sm mt-0.5">SAM.gov takes 7–14 days — your earliest federal application date is approximately:</p>
            <p className="text-xl font-bold text-amber-900 mt-1">{eligibleDate}</p>
          </div>
          <div className="shrink-0 text-center">
            <div className="text-3xl font-bold text-amber-700">{completedCount}/{STEPS.length}</div>
            <div className="text-xs text-amber-600 mt-0.5">steps complete</div>
            <div className="w-full bg-amber-200 rounded-full h-2 mt-2 min-w-[80px]">
              <div className="bg-amber-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* NAICS selector */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
        <h2 className="font-semibold text-gray-900 mb-1">Find your NAICS code</h2>
        <p className="text-sm text-gray-500 mb-3">Required for SAM.gov registration. Pick the closest industry:</p>
        <select
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:border-[#1a5c3a] focus:outline-none focus:ring-2 focus:ring-[#1a5c3a]/20 mb-3"
        >
          <option value="">Select your industry…</option>
          {Object.keys(NAICS_CODES).map((k) => <option key={k} value={k}>{k}</option>)}
        </select>
        {naicsList.length > 0 && (
          <div className="space-y-2">
            {naicsList.map((n) => (
              <div key={n.code} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2">
                <span className="font-mono text-sm font-bold text-[#1a5c3a]">{n.code}</span>
                <span className="text-sm text-gray-700">{n.description}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {STEPS.map((step) => (
          <div key={step.id} className={`rounded-2xl border p-5 transition-all ${checked[step.id] ? "opacity-60 bg-gray-50 border-gray-200" : step.color}`}>
            <div className="flex items-start gap-4">
              <button
                onClick={() => toggle(step.id)}
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                  checked[step.id] ? "bg-green-500 text-white" : `${step.iconColor} text-white`
                }`}
              >
                {checked[step.id] ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="text-sm font-bold">{step.number}</span>
                )}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className={`font-bold text-gray-900 ${checked[step.id] ? "line-through text-gray-400" : ""}`}>{step.title}</h3>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${step.badgeColor}`}>{step.badge}</span>
                </div>
                <p className="text-xs text-gray-500 font-medium mb-2">{step.agency}</p>
                <p className="text-sm text-gray-700 mb-3">{step.description}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Required for</p>
                    <ul className="space-y-0.5">
                      {step.requiredFor.map((r) => (
                        <li key={r} className="text-xs text-gray-600 flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-gray-400 shrink-0" />{r}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">You'll need</p>
                    <ul className="space-y-0.5">
                      {step.whatYouNeed.map((n) => (
                        <li key={n} className="text-xs text-gray-600 flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-gray-400 shrink-0" />{n}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="bg-white/60 rounded-lg px-3 py-2 mb-3 text-xs text-gray-600">
                  <span className="font-semibold text-gray-700">Tip: </span>{step.tip}
                </div>

                <a
                  href={step.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-[#1a5c3a] hover:underline"
                >
                  {step.urlLabel}
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="mt-8 bg-[#1a5c3a] rounded-2xl p-6 text-white text-center">
        <p className="font-bold text-lg mb-1">All registered? You&apos;re federal-ready.</p>
        <p className="text-white/70 text-sm mb-4">Go back to find and auto-apply to federal grants matching your profile.</p>
        <Link
          href="/grants"
          className="inline-block bg-white text-[#1a5c3a] font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-green-50 transition"
        >
          Find Federal Grants →
        </Link>
      </div>
    </div>
  );
}
