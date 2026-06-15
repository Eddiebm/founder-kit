"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import type { CompanyProfile, ScoredGrant } from "@/lib/types";

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

function ResultsContent() {
  const searchParams = useSearchParams();
  const [grants, setGrants] = useState<ScoredGrant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const profile: CompanyProfile = {
    companyName: searchParams.get("companyName") ?? "",
    oneLiner: searchParams.get("oneLiner") ?? "",
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
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/grants" className="text-[#1a5c3a] text-sm hover:underline">← Edit Profile</Link>
          <span className="text-gray-300">|</span>
          <div className="inline-flex items-center gap-2 bg-[#1a5c3a]/10 text-[#1a5c3a] rounded-full px-4 py-1.5 text-sm font-medium">
            Step 2 of 3 — Grant Discovery
          </div>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          {grants.length} grants matched for <span className="text-[#1a5c3a]">{profile.companyName}</span>
        </h2>
        <p className="text-gray-500">{highFit.length} high fit · {medFit.length} medium fit · {lowFit.length} low fit</p>
      </div>

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
              <a href={grant.url} target="_blank" rel="noopener noreferrer" className="text-sm text-[#1a5c3a] hover:underline">
                View grant website ↗
              </a>
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
