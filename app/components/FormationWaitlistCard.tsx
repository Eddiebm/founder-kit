"use client";

import { useState } from "react";

interface Props {
  companyName: string;
  stateName: string;
  isNonprofit: boolean;
  corpFee: number;
  nonprofitFee: number;
  userEmail?: string;
}

export default function FormationWaitlistCard({
  companyName,
  stateName,
  isNonprofit,
  corpFee,
  nonprofitFee,
  userEmail,
}: Props) {
  const [email, setEmail] = useState(userEmail ?? "");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!email) { setError("Enter your email to join the waitlist."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/formation/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, companyName }),
      });
      if (!res.ok) {
        const d = await res.json() as { error?: string };
        throw new Error(d.error ?? "Something went wrong");
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border-2 border-green-200 bg-green-50 p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center shrink-0">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 10l4 4 6-7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-base mb-1">You&apos;re on the list</h3>
            <p className="text-sm text-gray-600">
              We&apos;ll email <strong>{email}</strong> as soon as automated filing is live — typically within a week.
              Your documents above are ready to use in the meantime.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
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
            <span className="text-sm font-medium text-[#1B3F7B] bg-[#1B3F7B]/10 px-2.5 py-1 rounded-lg">Coming soon</span>
          </div>
          <p className="text-sm text-gray-500 mb-3">
            Automated filing for {stateName} is almost ready. Join the waitlist and we&apos;ll notify you the moment it&apos;s live — you&apos;ll be first in line.
          </p>
          <ul className="text-sm text-gray-600 space-y-1 mb-4">
            {[
              `State filing fee included (${stateName} ${isNonprofit ? `$${nonprofitFee}` : `$${corpFee}`})`,
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
          <form onSubmit={handleJoin} className="flex gap-2 flex-wrap">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3F7B]/30"
            />
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 shrink-0"
              style={{ background: "#1B3F7B" }}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Notify me →</>
              )}
            </button>
          </form>
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
          <p className="text-xs text-gray-400 mt-3">
            No payment now. We&apos;ll email you when filing launches — {companyName ? `for ${companyName}` : "for your company"}.
          </p>
        </div>
      </div>
    </div>
  );
}
