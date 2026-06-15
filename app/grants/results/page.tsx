"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";

const FEDERAL_FUNDERS = [
  "National Institutes of Health", "National Science Foundation", "USAID",
  "USDA", "National Endowment for the Arts", "National Endowment for the Humanities",
  "Department of Energy", "ARPA-E", "Department of Defense", "DARPA",
  "Small Business Administration", "In-Q-Tel", "HHS", "EPA", "EDA",
];

function isFederal(funder: string) {
  return FEDERAL_FUNDERS.some((f) => funder.includes(f));
}
import type { CompanyProfile, ScoredGrant } from "@/lib/types";

type ApplyStatus = "idle" | "generating" | "sending" | "done" | "error";

interface GrantProgress {
  grant: ScoredGrant;
  status: ApplyStatus;
  sentToFunder: boolean;
}

function FitBadge({ score }: { score: "High" | "Medium" | "Low" }) {
  const styles = {
    High: "bg-green-100 text-green-800 border border-green-200",
    Medium: "bg-yellow-100 text-yellow-800 border border-yellow-200",
    Low: "bg-gray-100 text-gray-600 border border-gray-200",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[score]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${score === "High" ? "bg-green-500" : score === "Medium" ? "bg-yellow-500" : "bg-gray-400"}`} />
      {score} Fit
    </span>
  );
}

function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-12 h-12 border-4 border-[#1a5c3a]/20 border-t-[#1a5c3a] rounded-full animate-spin" />
      <p className="text-gray-500 text-sm">Claude is scoring grants against your profile…</p>
    </div>
  );
}

function StatusIcon({ status }: { status: ApplyStatus }) {
  if (status === "done") return <span className="text-green-500 text-lg">✓</span>;
  if (status === "error") return <span className="text-red-500 text-lg">✗</span>;
  if (status === "generating" || status === "sending") {
    return <div className="w-4 h-4 border-2 border-[#1a5c3a]/30 border-t-[#1a5c3a] rounded-full animate-spin" />;
  }
  return <div className="w-4 h-4 rounded-full border border-gray-300" />;
}

function statusLabel(status: ApplyStatus, sentToFunder: boolean) {
  if (status === "idle") return "Waiting…";
  if (status === "generating") return "Writing pitch…";
  if (status === "sending") return "Sending application…";
  if (status === "done") return sentToFunder ? "Sent to funder ✓" : "Emailed to you ✓";
  if (status === "error") return "Error — skipped";
  return "";
}

async function generatePitch(profile: CompanyProfile, grant: ScoredGrant): Promise<string> {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profile, grant }),
  });
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let fullText = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    fullText += decoder.decode(value, { stream: true });
  }
  return fullText;
}

async function submitApplication(
  profile: CompanyProfile,
  grant: ScoredGrant,
  pitch: string,
  factChecks: string[],
  applicantName: string,
  applicantEmail: string
): Promise<{ sentToFunder: boolean; funderEmail: string | null; portalUrl: string | null }> {
  const res = await fetch("/api/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profile, grant, pitch, factChecks, applicantName, applicantEmail }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function AutoApplyPanel({
  highFitGrants,
  profile,
}: {
  highFitGrants: ScoredGrant[];
  profile: CompanyProfile;
}) {
  const [name, setName] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("fk_applicant_name") ?? "";
    return "";
  });
  const [email, setEmail] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("fk_applicant_email") ?? "";
    return "";
  });
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [progress, setProgress] = useState<GrantProgress[]>([]);
  const abortRef = useRef(false);

  const updateStatus = useCallback(
    (grantId: string, patch: Partial<GrantProgress>) => {
      setProgress((prev) => prev.map((p) => (p.grant.id === grantId ? { ...p, ...patch } : p)));
    },
    []
  );

  async function handleAutoApply() {
    if (!name.trim() || !email.trim()) return;
    localStorage.setItem("fk_applicant_name", name.trim());
    localStorage.setItem("fk_applicant_email", email.trim());

    abortRef.current = false;
    const initial: GrantProgress[] = highFitGrants.map((g) => ({
      grant: g,
      status: "idle",
      sentToFunder: false,
    }));
    setProgress(initial);
    setRunning(true);
    setFinished(false);

    for (const entry of initial) {
      if (abortRef.current) break;
      const { grant } = entry;

      updateStatus(grant.id, { status: "generating" });
      let pitch = "";
      try {
        pitch = await generatePitch(profile, grant);
      } catch {
        updateStatus(grant.id, { status: "error" });
        continue;
      }

      if (abortRef.current) break;
      updateStatus(grant.id, { status: "sending" });

      const splitIdx = pitch.indexOf("---FACT_CHECK---");
      const pitchText = splitIdx !== -1 ? pitch.slice(0, splitIdx).trim() : pitch.trim();
      const factChecks =
        splitIdx !== -1
          ? pitch
              .slice(splitIdx + "---FACT_CHECK---".length)
              .trim()
              .split("\n")
              .map((l) => l.replace(/^[•\-*]\s*/, "").trim())
              .filter(Boolean)
          : [];

      try {
        const result = await submitApplication(
          profile,
          grant,
          pitchText,
          factChecks,
          name.trim(),
          email.trim()
        );

        updateStatus(grant.id, { status: "done", sentToFunder: result.sentToFunder });

        if (result.portalUrl && grant.submissionType !== "email") {
          window.open(result.portalUrl, "_blank", "noopener,noreferrer");
          await new Promise((r) => setTimeout(r, 800));
        }
      } catch {
        updateStatus(grant.id, { status: "error" });
      }
    }

    setRunning(false);
    setFinished(true);
  }

  if (highFitGrants.length === 0) return null;

  const emailGrants = highFitGrants.filter((g) => g.submissionType === "email");
  const portalGrants = highFitGrants.filter((g) => g.submissionType !== "email");
  const doneCount = progress.filter((p) => p.status === "done").length;

  return (
    <div className="mb-8 bg-gradient-to-br from-[#1a5c3a] to-[#174d31] rounded-2xl p-6 text-white shadow-lg">
      <div className="flex items-start gap-4 mb-5">
        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-bold">Auto-Apply to {highFitGrants.length} High-Fit Grant{highFitGrants.length !== 1 ? "s" : ""}</h2>
          <p className="text-white/70 text-sm mt-0.5">
            {emailGrants.length > 0 && `${emailGrants.length} sent directly to funders`}
            {emailGrants.length > 0 && portalGrants.length > 0 && " · "}
            {portalGrants.length > 0 && `${portalGrants.length} emailed to you + portal opened`}
          </p>
        </div>
      </div>

      {!running && !finished && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
            <div>
              <label className="block text-white/70 text-xs font-medium mb-1">Your full name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Smith"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/50"
              />
            </div>
            <div>
              <label className="block text-white/70 text-xs font-medium mb-1">Your email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@yourorg.org"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/50"
              />
            </div>
          </div>
          <button
            onClick={handleAutoApply}
            disabled={!name.trim() || !email.trim()}
            className="w-full bg-white text-[#1a5c3a] font-bold py-3 rounded-xl hover:bg-green-50 disabled:opacity-40 transition text-sm shadow"
          >
            Apply to All {highFitGrants.length} Grants Now →
          </button>
        </>
      )}

      {(running || finished) && (
        <div className="space-y-2">
          {progress.map((p) => (
            <div
              key={p.grant.id}
              className={`flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3 transition-all ${
                p.status === "done" ? "bg-white/20" : ""
              }`}
            >
              <StatusIcon status={p.status} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{p.grant.name}</p>
                <p className="text-xs text-white/60">{statusLabel(p.status, p.sentToFunder)}</p>
              </div>
              <span className="text-xs text-white/50 shrink-0">{p.grant.awardRange}</span>
            </div>
          ))}

          {running && (
            <button
              onClick={() => { abortRef.current = true; }}
              className="w-full text-white/60 text-xs mt-2 hover:text-white/90 transition"
            >
              Cancel remaining
            </button>
          )}

          {finished && (
            <div className="mt-4 bg-white/10 rounded-xl px-4 py-3 text-center">
              <p className="font-bold text-base">
                {doneCount} of {highFitGrants.length} applications submitted
              </p>
              <p className="text-white/70 text-sm mt-0.5">Check your inbox for portal grants. Funder emails are on their way.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ResultsContent() {
  const searchParams = useSearchParams();
  const [grants, setGrants] = useState<ScoredGrant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    async function fetchGrants() {
      try {
        const res = await fetch("/api/grants", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(profile),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`);
        }
        setGrants(await res.json());
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchGrants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const companyParams = new URLSearchParams(profile as unknown as Record<string, string>).toString();
  const highFit = grants.filter((g) => g.fitScore === "High");
  const medFit = grants.filter((g) => g.fitScore === "Medium");
  const lowFit = grants.filter((g) => g.fitScore === "Low");
  const federalMatches = useMemo(
    () => grants.filter((g) => (g.fitScore === "High" || g.fitScore === "Medium") && isFederal(g.funder)),
    [grants]
  );

  if (loading) return <Spinner />;
  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-red-600 font-medium">Error: {error}</p>
        <Link href="/grants" className="text-[#1a5c3a] underline mt-4 inline-block">← Try again</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/grants" className="text-[#1a5c3a] text-sm hover:underline">← Edit Profile</Link>
          <span className="text-gray-300">|</span>
          <div className="inline-flex items-center gap-2 bg-[#1a5c3a]/10 text-[#1a5c3a] rounded-full px-4 py-1.5 text-sm font-medium">
            Step 2 of 3 — Grant Discovery
          </div>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          {grants.length} grants matched for <span className="text-[#1a5c3a] break-words">{profile.companyName}</span>
        </h2>
        <p className="text-gray-500">{highFit.length} high fit · {medFit.length} medium fit · {lowFit.length} low fit</p>
      </div>

      {federalMatches.length > 0 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-amber-900 text-sm">
              {federalMatches.length} federal grant{federalMatches.length !== 1 ? "s" : ""} matched — SAM.gov registration required
            </p>
            <p className="text-amber-700 text-xs mt-0.5">
              Federal applications are rejected without active SAM.gov, Grants.gov, and agency-specific registrations. Takes 7–14 days.
            </p>
          </div>
          <Link
            href="/register"
            className="shrink-0 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition"
          >
            Start Registration →
          </Link>
        </div>
      )}

      <AutoApplyPanel highFitGrants={highFit} profile={profile} />

      <div className="space-y-4">
        {grants.map((grant) => (
          <div key={grant.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1"><FitBadge score={grant.fitScore} /></div>
                <h3 className="text-lg font-bold text-gray-900 mt-1">{grant.name}</h3>
                <p className="text-sm text-gray-500 font-medium">{grant.funder}</p>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[#1a5c3a] font-bold text-base">{grant.awardRange}</div>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-2">{grant.eligibilitySummary}</p>

            <div className="bg-gray-50 rounded-lg px-3 py-2 mb-4">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-0.5">Why it fits</p>
              <p className="text-sm text-gray-700">{grant.fitRationale}</p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <a href={grant.url} target="_blank" rel="noopener noreferrer" className="text-sm text-[#1a5c3a] hover:underline">
                  View grant website ↗
                </a>
                {grant.source === "web" && (
                  <span className="text-xs bg-blue-100 text-blue-700 rounded-full px-2 py-0.5 font-medium">
                    🔍 Found on the web
                  </span>
                )}
                {grant.submissionType === "email" && (
                  <span className="text-xs bg-green-100 text-green-700 rounded-full px-2 py-0.5 font-medium">
                    Direct email submission
                  </span>
                )}
                {grant.submissionType === "invitation" && (
                  <span className="text-xs bg-purple-100 text-purple-700 rounded-full px-2 py-0.5 font-medium">
                    Nomination only
                  </span>
                )}
              </div>
              <Link
                href={`/grants/pitch?grantId=${grant.id}&${companyParams}`}
                className="inline-flex items-center gap-1.5 bg-[#1a5c3a] hover:bg-[#174d31] text-white text-sm font-semibold px-4 py-2 rounded-xl transition"
              >
                Generate Pitch →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <ResultsContent />
    </Suspense>
  );
}
