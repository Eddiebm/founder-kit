"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

interface User {
  id: string;
  email: string;
  name?: string;
  plan: string;
  usage: { score: number; generate: number };
}

function BillingContent() {
  const searchParams = useSearchParams();
  const upgraded = searchParams.get("success") === "1";
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => {
      setUser(d.user);
      setLoading(false);
    });
  }, []);

  async function handleUpgrade() {
    setUpgrading(true);
    const res = await fetch("/api/stripe/checkout", { method: "POST" });
    const { url } = await res.json();
    if (url) window.location.href = url;
    else setUpgrading(false);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 border-4 border-[#1a5c3a]/20 border-t-[#1a5c3a] rounded-full animate-spin" />
      </div>
    );
  }

  const isPro = user?.plan === "pro";
  const scoreLimit = isPro ? "Unlimited" : "5/month";
  const generateLimit = isPro ? "Unlimited" : "10/month";

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <Link href="/grants" className="text-[#1a5c3a] text-sm hover:underline">← Back to Grants</Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-4 mb-1">Your Plan</h1>
        <p className="text-gray-500 text-sm">{user?.email}</p>
      </div>

      {upgraded && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 text-green-800 font-medium text-sm">
          You&apos;re now on Pro — unlimited searches and pitch generation unlocked.
        </div>
      )}

      {/* Current plan card */}
      <div className={`rounded-2xl border-2 p-6 mb-5 ${isPro ? "border-[#1a5c3a] bg-[#1a5c3a]/5" : "border-gray-200 bg-white"}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className={`text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-full ${isPro ? "bg-[#1a5c3a] text-white" : "bg-gray-100 text-gray-600"}`}>
              {isPro ? "Pro" : "Free"}
            </span>
            <p className="text-2xl font-bold text-gray-900 mt-2">{isPro ? "$19/month" : "$0/month"}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Funding searches", used: user?.usage.score ?? 0, limit: scoreLimit, max: isPro ? null : 5 },
            { label: "Pitch generations", used: user?.usage.generate ?? 0, limit: generateLimit, max: isPro ? null : 10 },
          ].map((item) => (
            <div key={item.label} className="bg-white rounded-xl p-4 border border-gray-100">
              <p className="text-xs text-gray-500 mb-1">{item.label}</p>
              <p className="text-lg font-bold text-gray-900">
                {item.used}
                {item.max && <span className="text-gray-400 font-normal text-sm"> / {item.max}</span>}
              </p>
              {item.max && (
                <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                  <div
                    className={`h-1.5 rounded-full ${item.used >= item.max ? "bg-red-400" : "bg-[#1a5c3a]"}`}
                    style={{ width: `${Math.min(100, (item.used / item.max) * 100)}%` }}
                  />
                </div>
              )}
              {!item.max && <p className="text-xs text-[#1a5c3a] font-medium mt-1">Unlimited</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Upgrade card */}
      {!isPro && (
        <div className="bg-gradient-to-br from-[#1a5c3a] to-[#174d31] rounded-2xl p-6 text-white">
          <h2 className="text-xl font-bold mb-1">Upgrade to Pro</h2>
          <p className="text-white/70 text-sm mb-5">Unlimited searches, pitches, and auto-apply — $19/month</p>
          <ul className="space-y-2 mb-6">
            {[
              "Unlimited funding searches",
              "Unlimited AI pitch generation",
              "Auto-apply to all high-fit grants",
              "Priority processing",
            ].map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm">
                <span className="text-green-300 font-bold">✓</span> {f}
              </li>
            ))}
          </ul>
          <button
            onClick={handleUpgrade}
            disabled={upgrading}
            className="w-full bg-white text-[#1a5c3a] font-bold py-3 rounded-xl hover:bg-green-50 disabled:opacity-50 transition text-sm"
          >
            {upgrading ? "Redirecting to checkout…" : "Upgrade to Pro — $19/month →"}
          </button>
        </div>
      )}

      {isPro && (
        <p className="text-center text-sm text-gray-400 mt-4">
          To cancel your subscription, email <a href="mailto:eddie@bannermanmenson.com" className="text-[#1a5c3a] hover:underline">eddie@bannermanmenson.com</a>
        </p>
      )}
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense>
      <BillingContent />
    </Suspense>
  );
}
