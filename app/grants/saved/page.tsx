"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type SavedGrant = {
  grant_id: string;
  grant_data: {
    name: string;
    funder: string;
    awardRange: string;
    fitScore?: string;
    fitRationale?: string;
    url?: string;
  };
  status: "saved" | "applied" | "awarded" | "rejected";
  deadline: string | null;
  notes: string | null;
  created_at: string;
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  saved: { label: "Saved", color: "bg-gray-100 text-gray-700" },
  applied: { label: "Applied", color: "bg-blue-100 text-blue-700" },
  awarded: { label: "Awarded", color: "bg-green-100 text-green-800" },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-700" },
};

const FIT_COLORS: Record<string, string> = {
  High: "bg-green-100 text-green-800",
  Medium: "bg-yellow-100 text-yellow-800",
  Low: "bg-gray-100 text-gray-600",
};

const FILTERS = ["All", "Applied", "Awarded", "Rejected"] as const;

export default function SavedGrantsPage() {
  const [grants, setGrants] = useState<SavedGrant[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<typeof FILTERS[number]>("All");
  const [editingDeadline, setEditingDeadline] = useState<string | null>(null);
  const [deadlineInput, setDeadlineInput] = useState("");

  useEffect(() => {
    fetch("/api/grants/save")
      .then((r) => {
        if (r.status === 401) { window.location.href = "/auth?redirect=/grants/saved"; return null; }
        return r.json();
      })
      .then((data) => { if (data) setGrants(data as SavedGrant[]); })
      .finally(() => setLoading(false));
  }, []);

  async function updateStatus(grant_id: string, status: SavedGrant["status"]) {
    setGrants((prev) => prev.map((g) => g.grant_id === grant_id ? { ...g, status } : g));
    await fetch("/api/grants/save", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grant_id, status }),
    });
  }

  async function saveDeadline(grant_id: string) {
    const deadline = deadlineInput.trim() || null;
    setGrants((prev) => prev.map((g) => g.grant_id === grant_id ? { ...g, deadline } : g));
    setEditingDeadline(null);
    await fetch("/api/grants/save", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grant_id, deadline }),
    });
  }

  const visible = grants.filter((g) =>
    filter === "All" ? true : g.status === filter.toLowerCase()
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#1B3F7B] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/grants" className="text-sm text-gray-400 hover:text-gray-600 mb-2 inline-block">
              ← Back to search
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Grant Pipeline</h1>
            <p className="text-sm text-gray-500 mt-1">{grants.length} saved</p>
          </div>
        </div>

        {grants.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg mb-2">No grants saved yet</p>
            <Link href="/grants" className="text-[#1B3F7B] font-medium text-sm hover:underline">
              Find grants →
            </Link>
          </div>
        ) : (
          <>
            <div className="flex gap-2 mb-6 overflow-x-auto">
              {FILTERS.map((f) => {
                const count = f === "All" ? grants.length : grants.filter((g) => g.status === f.toLowerCase()).length;
                return (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                      filter === f
                        ? "bg-[#1B3F7B] text-white"
                        : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {f} {count > 0 && <span className="ml-1 opacity-70">{count}</span>}
                  </button>
                );
              })}
            </div>

            <div className="space-y-4">
              {visible.map((g) => {
                const fit = g.grant_data.fitScore;
                const isEditingDeadline = editingDeadline === g.grant_id;
                const deadlineDate = g.deadline ? new Date(g.deadline) : null;
                const daysLeft = deadlineDate
                  ? Math.ceil((deadlineDate.getTime() - Date.now()) / 86400000)
                  : null;

                return (
                  <div key={g.grant_id} className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          {fit && (
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${FIT_COLORS[fit] ?? "bg-gray-100 text-gray-600"}`}>
                              {fit} Fit
                            </span>
                          )}
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_LABELS[g.status]?.color}`}>
                            {STATUS_LABELS[g.status]?.label}
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-900 leading-snug">{g.grant_data.name}</h3>
                        <p className="text-sm text-gray-500">{g.grant_data.funder}</p>
                      </div>
                      <div className="text-sm font-medium text-gray-700 whitespace-nowrap shrink-0">
                        {g.grant_data.awardRange}
                      </div>
                    </div>

                    {g.grant_data.fitRationale && (
                      <p className="text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2 mb-3 leading-relaxed">
                        {g.grant_data.fitRationale}
                      </p>
                    )}

                    <div className="mb-3">
                      {isEditingDeadline ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="date"
                            value={deadlineInput}
                            onChange={(e) => setDeadlineInput(e.target.value)}
                            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#1B3F7B]/30"
                            autoFocus
                          />
                          <button
                            onClick={() => saveDeadline(g.grant_id)}
                            className="text-sm font-medium text-[#1B3F7B] hover:underline"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingDeadline(null)}
                            className="text-sm text-gray-400 hover:text-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingDeadline(g.grant_id);
                            setDeadlineInput(g.deadline ?? "");
                          }}
                          className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1"
                        >
                          {g.deadline ? (
                            <>
                              <span className="text-gray-600">
                                Deadline: {new Date(g.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                              </span>
                              {daysLeft !== null && daysLeft >= 0 && daysLeft <= 14 && (
                                <span className="text-orange-600 font-medium ml-1">· {daysLeft}d left</span>
                              )}
                              {daysLeft !== null && daysLeft < 0 && (
                                <span className="text-red-500 font-medium ml-1">· Closed</span>
                              )}
                              <span className="text-gray-300 ml-1">· Edit</span>
                            </>
                          ) : (
                            <span>+ Add deadline</span>
                          )}
                        </button>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100">
                      <div className="flex gap-1">
                        {(["saved", "applied", "awarded", "rejected"] as const).map((s) => (
                          <button
                            key={s}
                            onClick={() => updateStatus(g.grant_id, s)}
                            className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${
                              g.status === s
                                ? `${STATUS_LABELS[s].color} ring-1 ring-current`
                                : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                            }`}
                          >
                            {STATUS_LABELS[s].label}
                          </button>
                        ))}
                      </div>
                      {g.grant_data.url && (
                        <a
                          href={g.grant_data.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-[#1B3F7B] font-medium hover:underline shrink-0"
                        >
                          Apply →
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}

              {visible.length === 0 && (
                <div className="text-center py-10 text-gray-400 text-sm">
                  No {filter.toLowerCase()} grants yet
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
