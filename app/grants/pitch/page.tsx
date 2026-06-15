"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { GRANT_PROGRAMS } from "@/lib/grants";
import type { CompanyProfile, ScoredGrant } from "@/lib/types";

function Spinner({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <div className="w-10 h-10 border-4 border-[#1a5c3a]/20 border-t-[#1a5c3a] rounded-full animate-spin" />
      {message && <p className="text-gray-500 text-sm">{message}</p>}
    </div>
  );
}

function PitchContent() {
  const searchParams = useSearchParams();
  const grantId = searchParams.get("grantId") ?? "";

  const profile: CompanyProfile = {
    companyName: searchParams.get("companyName") ?? "",
    oneLiner: searchParams.get("oneLiner") ?? "",
    fundingType: searchParams.get("fundingType") ?? "",
    stage: searchParams.get("stage") ?? "",
    focusArea: searchParams.get("focusArea") ?? "",
    geography: searchParams.get("geography") ?? "",
    revenueModel: searchParams.get("revenueModel") ?? "",
    annualBudget: searchParams.get("annualBudget") ?? "",
    isNonprofit: searchParams.get("isNonprofit") ?? "",
    impactDescription: searchParams.get("impactDescription") ?? "",
  };

  const baseGrant = GRANT_PROGRAMS.find((g) => g.id === grantId);
  const [pitch, setPitch] = useState("");
  const [factChecks, setFactChecks] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [applicantName, setApplicantName] = useState("");
  const [applicantEmail, setApplicantEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    sentToFunder: boolean;
    funderEmail: string | null;
    portalUrl: string | null;
  } | null>(null);

  const companyParams = new URLSearchParams(profile as unknown as Record<string, string>).toString();

  async function handleGenerate() {
    if (!baseGrant) return;
    setGenerating(true); setError(null); setPitch(""); setFactChecks([]);

    const scoredGrant: ScoredGrant = { ...baseGrant, fitScore: "High", fitRationale: "" };

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, grant: scoredGrant }),
      });
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
        const splitIdx = fullText.indexOf("---FACT_CHECK---");
        setPitch(splitIdx !== -1 ? fullText.slice(0, splitIdx).trim() : fullText.trim());
      }

      const splitIdx = fullText.indexOf("---FACT_CHECK---");
      if (splitIdx !== -1) {
        setPitch(fullText.slice(0, splitIdx).trim());
        setFactChecks(
          fullText.slice(splitIdx + "---FACT_CHECK---".length).trim()
            .split("\n").map((l) => l.replace(/^[•\-*]\s*/, "").trim()).filter(Boolean)
        );
      }
      setGenerated(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setGenerating(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(pitch);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSubmitApplication() {
    if (!baseGrant || !applicantName.trim() || !applicantEmail.trim()) return;
    setSubmitting(true);
    try {
      const scoredGrant = { ...baseGrant, fitScore: "High" as const, fitRationale: "" };
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, grant: scoredGrant, pitch, factChecks, applicantName, applicantEmail }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSubmitResult(data);
      setShowSubmitModal(false);
      if (data.portalUrl) {
        window.open(data.portalUrl, "_blank", "noopener,noreferrer");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setShowSubmitModal(false);
    } finally {
      setSubmitting(false);
    }
  }

  function handleDownload() {
    const content = pitch + (factChecks.length > 0
      ? `\n\n---\nFACT-CHECK BEFORE SUBMITTING:\n${factChecks.map((f) => `• ${f}`).join("\n")}`
      : "");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${profile.companyName.replace(/\s+/g, "_")}_${baseGrant?.name.replace(/\s+/g, "_") ?? "pitch"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!baseGrant) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-600">Grant not found.</p>
        <Link href="/grants" className="text-[#1a5c3a] underline mt-4 inline-block">← Start over</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/grants/results?${companyParams}`} className="text-[#1a5c3a] text-sm hover:underline">← Back to Results</Link>
        <span className="text-gray-300">|</span>
        <div className="inline-flex items-center gap-2 bg-[#1a5c3a]/10 text-[#1a5c3a] rounded-full px-4 py-1.5 text-sm font-medium">
          Step 3 of 3 — Pitch Generator
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Selected Grant</p>
            <h2 className="text-xl font-bold text-gray-900">{baseGrant.name}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{baseGrant.funder}</p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[#1a5c3a] font-bold">{baseGrant.awardRange}</div>
            <a href={baseGrant.url} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-[#1a5c3a] hover:underline">View program ↗</a>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-3 pt-3 border-t border-gray-100">{baseGrant.eligibilitySummary}</p>
      </div>

      <div className="bg-gray-50 rounded-xl px-4 py-3 mb-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-[#1a5c3a]/10 rounded-lg flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-[#1a5c3a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <div>
          <p className="text-xs text-gray-500 font-medium">Generating pitch for</p>
          <p className="text-sm font-semibold text-gray-900">{profile.companyName}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-xs text-gray-400">{profile.focusArea} · {profile.geography}</p>
          <p className="text-xs text-gray-400">{profile.stage}</p>
        </div>
      </div>

      {!generated && !generating && (
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm mb-6">
            Claude will write a tailored pitch matching {baseGrant.funder}&apos;s priorities to your specific impact model.
          </p>
          <button onClick={handleGenerate} className="bg-[#1a5c3a] hover:bg-[#174d31] text-white font-semibold py-3 px-8 rounded-xl transition text-base shadow-sm">
            Generate Pitch
          </button>
        </div>
      )}

      {generating && !pitch && <Spinner message="Claude is writing your pitch…" />}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-red-700 text-sm font-medium">Error: {error}</p>
          <button onClick={handleGenerate} className="text-red-600 underline text-sm mt-1">Try again</button>
        </div>
      )}

      {pitch && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h3 className="text-lg font-bold text-gray-900">Your Pitch Draft</h3>
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={handleCopy} className="flex items-center gap-1.5 text-sm bg-white border border-gray-200 hover:border-[#1a5c3a] text-gray-700 hover:text-[#1a5c3a] px-3 py-1.5 rounded-lg transition">
                {copied ? "✓ Copied!" : "Copy"}
              </button>
              <button onClick={handleDownload} className="flex items-center gap-1.5 text-sm bg-white border border-gray-200 hover:border-[#1a5c3a] text-gray-700 hover:text-[#1a5c3a] px-3 py-1.5 rounded-lg transition">
                Download .txt
              </button>
              {generated && (
                <button onClick={handleGenerate} className="flex items-center gap-1.5 text-sm bg-white border border-gray-200 hover:border-[#1a5c3a] text-gray-700 hover:text-[#1a5c3a] px-3 py-1.5 rounded-lg transition">
                  ↺ Regenerate
                </button>
              )}
              {generated && (
                <button
                  onClick={() => setShowSubmitModal(true)}
                  className="flex items-center gap-1.5 text-sm bg-[#1a5c3a] hover:bg-[#174d31] text-white font-semibold px-4 py-1.5 rounded-lg transition shadow-sm"
                >
                  Submit →
                </button>
              )}
            </div>
          </div>
          <textarea value={pitch} onChange={(e) => setPitch(e.target.value)} rows={16} className="w-full rounded-xl border border-gray-200 px-4 py-4 text-sm text-gray-800 leading-relaxed focus:border-[#1a5c3a] focus:outline-none focus:ring-2 focus:ring-[#1a5c3a]/20 transition resize-y font-mono min-h-[200px]" />
          {generating && pitch && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <div className="w-3 h-3 border-2 border-gray-300 border-t-[#1a5c3a] rounded-full animate-spin" />
              Writing…
            </div>
          )}
        </div>
      )}

      {submitResult && (
        <div className={`mt-4 rounded-xl p-4 border ${submitResult.sentToFunder ? "bg-green-50 border-green-200" : "bg-blue-50 border-blue-200"}`}>
          <p className={`font-semibold text-sm mb-1 ${submitResult.sentToFunder ? "text-green-800" : "text-blue-800"}`}>
            {submitResult.sentToFunder
              ? `Application sent to ${submitResult.funderEmail} and emailed to you!`
              : "Application emailed to you — portal opening now"}
          </p>
          <p className={`text-sm ${submitResult.sentToFunder ? "text-green-700" : "text-blue-700"}`}>
            {submitResult.sentToFunder
              ? "Check your inbox for a copy. The funder will be in touch if you move forward."
              : `Paste your pitch into the portal at ${submitResult.portalUrl ?? baseGrant?.url}.`}
          </p>
        </div>
      )}

      {factChecks.length > 0 && (
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-amber-900 mb-2">Fact-check before submitting</h4>
              <p className="text-sm text-amber-700 mb-3">Claude generated these claims — confirm each is accurate:</p>
              <ul className="space-y-1.5">
                {factChecks.map((fact, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-amber-800">
                    <span className="mt-1 w-4 h-4 rounded-full border border-amber-300 flex items-center justify-center shrink-0 text-xs font-bold text-amber-600">{i + 1}</span>
                    {fact}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-0 sm:px-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Submit Application</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {baseGrant?.submissionType === "email"
                    ? `We'll email your pitch to ${baseGrant.submissionEmail} and send you a copy.`
                    : "We'll email you a formatted copy and open the grant portal."}
                </p>
              </div>
              <button onClick={() => setShowSubmitModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none ml-4">×</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your full name</label>
                <input
                  type="text"
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  placeholder="Jane Smith"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#1a5c3a] focus:outline-none focus:ring-2 focus:ring-[#1a5c3a]/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your email address</label>
                <input
                  type="email"
                  value={applicantEmail}
                  onChange={(e) => setApplicantEmail(e.target.value)}
                  placeholder="jane@yourorg.org"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#1a5c3a] focus:outline-none focus:ring-2 focus:ring-[#1a5c3a]/20"
                />
              </div>

              {baseGrant?.submissionType === "invitation" && (
                <div className="bg-blue-50 rounded-lg px-3 py-2.5 text-sm text-blue-700">
                  This grant is nomination-only — we&apos;ll email you the formatted pitch and open the nominations page.
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowSubmitModal(false)}
                  className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitApplication}
                  disabled={submitting || !applicantName.trim() || !applicantEmail.trim()}
                  className="flex-1 bg-[#1a5c3a] hover:bg-[#174d31] disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-semibold transition"
                >
                  {submitting ? "Sending…" : baseGrant?.submissionType === "email" ? "Send to Funder" : "Email Me & Open Portal"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PitchPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <PitchContent />
    </Suspense>
  );
}
