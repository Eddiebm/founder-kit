"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ScoredGrant } from "@/lib/types";
import type { CompanyProfile } from "@/lib/types";

interface SavedRow {
  grant_id: string;
  grant_data: ScoredGrant;
  profile_data: CompanyProfile | null;
  created_at: string;
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

export default function SavedGrantsPage() {
  const [rows, setRows] = useState<SavedRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/grants/save")
      .then((r) => r.json())
      .then((data) => setRows(data))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  async function unsave(grantId: string) {
    setRows((prev) => prev.filter((r) => r.grant_id !== grantId));
    await fetch("/api/grants/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grant: { id: grantId }, action: "unsave" }),
    }).catch(() => null);
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <div className="w-10 h-10 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Saved Grants</h1>
          {rows.length > 0 && (
            <p className="text-sm text-gray-500 mt-1">{rows.length} grant{rows.length !== 1 ? "s" : ""} saved</p>
          )}
        </div>
        <Link href="/grants" className="text-sm text-[#1a5c3a] hover:underline">Search again →</Link>
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <svg className="w-10 h-10 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          <p className="text-gray-500 text-sm mb-4">No saved grants yet.</p>
          <Link href="/grants" className="bg-[#1a5c3a] text-white font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-[#174d31] transition">
            Find grants →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map(({ grant_id, grant_data: grant, profile_data: profile }) => {
            const companyParams = profile
              ? new URLSearchParams(profile as unknown as Record<string, string>).toString()
              : "";

            return (
              <div key={grant_id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <FitBadge score={grant.fitScore} />
                    </div>
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
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => unsave(grant_id)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-gray-500 hover:border-red-200 hover:text-red-500 text-sm font-medium transition"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Remove
                    </button>
                    {companyParams && (
                      <Link
                        href={`/grants/pitch?grantId=${grant_id}&${companyParams}`}
                        className="inline-flex items-center gap-1.5 bg-[#1a5c3a] hover:bg-[#174d31] text-white text-sm font-semibold px-4 py-2 rounded-xl transition"
                      >
                        Generate Pitch →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
