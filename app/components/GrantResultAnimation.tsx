"use client";

import { useEffect, useState } from "react";

const GRANTS = [
  {
    fit: "high" as const,
    name: "DOE ARPA-E OPEN 2025",
    amount: "$500K–$3M",
    rationale:
      "Seed-stage clean energy companies are explicitly eligible; strong match on technology focus and commercialization stage.",
  },
  {
    fit: "high" as const,
    name: "SBA SBIR Phase I",
    amount: "Up to $275K",
    rationale:
      "Technology commercialization at seed stage is the core mandate; climate focus aligns with current SBA priority areas.",
  },
  {
    fit: "medium" as const,
    name: "NSF SBIR / STTR",
    amount: "Up to $275K",
    rationale:
      "Strong technology focus match; competition is higher for pre-revenue applicants in this cohort.",
  },
];

const MESSAGES = [
  "Scoring 100+ programs…",
  "Checking federal eligibility…",
  "Ranking by fit score…",
];

export default function GrantResultAnimation() {
  const [phase, setPhase] = useState<"loading" | "results">("loading");
  const [msgIndex, setMsgIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(0);
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    const msgInterval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % MESSAGES.length);
    }, 750);

    const doneTimer = setTimeout(() => {
      clearInterval(msgInterval);
      setPhase("results");
      GRANTS.forEach((_, i) => {
        setTimeout(() => setVisibleCount(i + 1), i * 280);
      });
      setTimeout(() => setShowMore(true), GRANTS.length * 280 + 200);
    }, 2000);

    return () => {
      clearInterval(msgInterval);
      clearTimeout(doneTimer);
    };
  }, []);

  return (
    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5">
      <div className="flex items-center gap-2 pb-4 border-b border-gray-100 mb-4">
        <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span className="text-xs text-gray-400">Searching for</span>
        <span className="text-sm font-medium font-mono text-gray-900 truncate">Seed · Climate tech · Austin, TX</span>
      </div>

      {phase === "loading" && (
        <div className="flex items-center gap-2 py-1">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-pulse shrink-0" />
          <span className="text-xs font-mono text-gray-400">{MESSAGES[msgIndex]}</span>
        </div>
      )}

      {phase === "results" && (
        <div>
          {GRANTS.map((grant, i) => (
            <div
              key={grant.name}
              className="py-3 border-b border-gray-100 last:border-0 transition-all duration-300"
              style={{
                opacity: visibleCount > i ? 1 : 0,
                transform: visibleCount > i ? "translateY(0)" : "translateY(5px)",
              }}
            >
              {grant.fit === "high" ? (
                <span className="inline-flex items-center text-[11px] font-medium bg-green-50 text-green-800 border border-green-200 rounded-md px-2 py-0.5 mb-1.5">
                  High fit
                </span>
              ) : (
                <span className="inline-flex items-center text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200 rounded-md px-2 py-0.5 mb-1.5">
                  Medium fit
                </span>
              )}
              <div className="flex items-baseline justify-between gap-2 mb-1">
                <span className="text-sm font-medium font-mono text-gray-900">{grant.name}</span>
                <span className="text-xs font-mono text-gray-400 whitespace-nowrap shrink-0">{grant.amount}</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">{grant.rationale}</p>
            </div>
          ))}

          {showMore && (
            <div
              className="pt-2.5 transition-all duration-300"
              style={{ opacity: showMore ? 1 : 0 }}
            >
              <span className="text-xs font-mono text-gray-400">
                4 more matches →{" "}
                <a href="/grants" className="text-[#1a5c3a] hover:underline">
                  view all
                </a>
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
