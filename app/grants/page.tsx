"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const FOCUS_AREAS = ["Healthcare","Education","Climate","Agriculture","Financial Inclusion","Other"];
const GEOGRAPHIES = ["Sub-Saharan Africa","Southeast Asia","South Asia","Latin America","Global"];
const STAGES = ["Pre-seed","Seed","Series A","Nonprofit"];
const REVENUE_MODELS = ["Free/nonprofit","Freemium","B2B SaaS","Other"];
const BUDGETS = ["Under $50K","$50K-$500K","$500K-$5M","Over $5M"];
const NONPROFIT_STATUS = ["Yes","No","In progress"];

export default function GrantsPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    companyName: "", oneLiner: "", stage: "", focusArea: "",
    geography: "", revenueModel: "", annualBudget: "",
    isNonprofit: "", impactDescription: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => { const n = { ...prev }; delete n[name]; return n; });
  }

  function validate() {
    const required = ["companyName","oneLiner","stage","focusArea","geography","revenueModel","annualBudget","isNonprofit","impactDescription"] as const;
    const newErrors: Record<string, string> = {};
    for (const key of required) {
      if (!form[key].trim()) newErrors[key] = "This field is required";
    }
    return newErrors;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    router.push(`/grants/results?${new URLSearchParams(form).toString()}`);
  }

  const inp = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-[#1a5c3a] focus:outline-none focus:ring-2 focus:ring-[#1a5c3a]/20 transition";
  const err = "text-red-600 text-xs mt-1";
  const lbl = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 bg-[#1a5c3a]/10 text-[#1a5c3a] rounded-full px-4 py-1.5 text-sm font-medium mb-4">
          Step 1 of 3 — Organization Profile
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Find matching grants</h2>
        <p className="text-gray-500 text-base">
          Claude will score 15 grant programs against your profile and draft a pitch for any you choose.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
        <div>
          <label className={lbl} htmlFor="companyName">Organization / Company Name</label>
          <input id="companyName" name="companyName" type="text" placeholder="e.g. HealthBridge Africa" value={form.companyName} onChange={handleChange} className={inp} />
          {errors.companyName && <p className={err}>{errors.companyName}</p>}
        </div>

        <div>
          <label className={lbl} htmlFor="oneLiner">One-liner <span className="text-gray-400 font-normal">(what you do)</span></label>
          <input id="oneLiner" name="oneLiner" type="text" placeholder="e.g. AI triage tool for community health workers in rural Ghana" value={form.oneLiner} onChange={handleChange} className={inp} />
          {errors.oneLiner && <p className={err}>{errors.oneLiner}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={lbl} htmlFor="stage">Stage</label>
            <select id="stage" name="stage" value={form.stage} onChange={handleChange} className={inp}>
              <option value="">Select stage…</option>
              {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            {errors.stage && <p className={err}>{errors.stage}</p>}
          </div>
          <div>
            <label className={lbl} htmlFor="focusArea">Primary Focus Area</label>
            <select id="focusArea" name="focusArea" value={form.focusArea} onChange={handleChange} className={inp}>
              <option value="">Select focus…</option>
              {FOCUS_AREAS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
            {errors.focusArea && <p className={err}>{errors.focusArea}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={lbl} htmlFor="geography">Primary Geography</label>
            <select id="geography" name="geography" value={form.geography} onChange={handleChange} className={inp}>
              <option value="">Select region…</option>
              {GEOGRAPHIES.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
            {errors.geography && <p className={err}>{errors.geography}</p>}
          </div>
          <div>
            <label className={lbl} htmlFor="revenueModel">Revenue Model</label>
            <select id="revenueModel" name="revenueModel" value={form.revenueModel} onChange={handleChange} className={inp}>
              <option value="">Select model…</option>
              {REVENUE_MODELS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            {errors.revenueModel && <p className={err}>{errors.revenueModel}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={lbl} htmlFor="annualBudget">Annual Budget Estimate</label>
            <select id="annualBudget" name="annualBudget" value={form.annualBudget} onChange={handleChange} className={inp}>
              <option value="">Select range…</option>
              {BUDGETS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
            {errors.annualBudget && <p className={err}>{errors.annualBudget}</p>}
          </div>
          <div>
            <label className={lbl} htmlFor="isNonprofit">Registered Nonprofit?</label>
            <select id="isNonprofit" name="isNonprofit" value={form.isNonprofit} onChange={handleChange} className={inp}>
              <option value="">Select…</option>
              {NONPROFIT_STATUS.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            {errors.isNonprofit && <p className={err}>{errors.isNonprofit}</p>}
          </div>
        </div>

        <div>
          <label className={lbl} htmlFor="impactDescription">Brief Impact Description <span className="text-gray-400 font-normal">(2–3 sentences)</span></label>
          <textarea id="impactDescription" name="impactDescription" rows={4} placeholder="Describe the problem you're solving and the measurable impact you've had or plan to achieve…" value={form.impactDescription} onChange={handleChange} className={inp} />
          {errors.impactDescription && <p className={err}>{errors.impactDescription}</p>}
        </div>

        <button type="submit" className="w-full bg-[#1a5c3a] hover:bg-[#174d31] text-white font-semibold py-3 px-6 rounded-xl transition text-base shadow-sm">
          Find Matching Grants →
        </button>
      </form>
    </div>
  );
}
