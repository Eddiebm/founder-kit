"use client";

import Link from "next/link";
import { usePostHog } from "posthog-js/react";
import { useEffect } from "react";

interface Props {
  type: "search" | "pitch" | "signup";
}

const COPY = {
  search: {
    icon: "🔍",
    heading: "You've used all 5 free grant searches this month",
    body: "Upgrade to Launchpad for unlimited searches — run as many profiles as you need, any time.",
    features: ["Unlimited grant searches", "Unlimited AI pitch drafts", "Full auto-apply"],
    cta: { href: "/billing", label: "Upgrade to Launchpad →", secondary: null },
  },
  pitch: {
    icon: "✍️",
    heading: "You've used all 3 free pitch drafts this month",
    body: "Upgrade to Launchpad to generate pitches for every grant you match — unlimited.",
    features: ["Unlimited pitch generation", "Unlimited grant searches", "Full auto-apply"],
    cta: { href: "/billing", label: "Upgrade to Launchpad →", secondary: null },
  },
  signup: {
    icon: "🔍",
    heading: "You've used your 3 free searches today",
    body: "Create a free account to get 5 searches every month — no credit card needed.",
    features: ["5 grant searches / month", "3 AI pitch drafts / month", "Full formation wizard"],
    cta: { href: "/auth", label: "Sign up free →", secondary: "Already have an account? Sign in" },
  },
};

export default function UpgradePrompt({ type }: Props) {
  const ph = usePostHog();
  const copy = COPY[type];

  useEffect(() => {
    ph?.capture("paywall_hit", { type });
  }, [ph, type]);

  function handleUpgradeClick() {
    ph?.capture("upgrade_clicked", { source: `paywall_${type}` });
  }

  return (
    <div className="max-w-md mx-auto text-center py-16 px-4">
      <div className="text-4xl mb-4">{copy.icon}</div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">{copy.heading}</h2>
      <p className="text-gray-500 text-sm mb-6">{copy.body}</p>

      <div className="bg-[#1B3F7B] rounded-2xl p-6 text-left mb-6">
        {type !== "signup" && (
          <>
            <p className="text-white font-bold text-lg mb-1">
              Launchpad — $29<span className="text-blue-300 font-normal text-sm">/month</span>
            </p>
            <p className="text-blue-300 text-xs mb-4">or $249/year · save $99</p>
          </>
        )}
        <ul className="space-y-2 mb-5">
          {copy.features.map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm text-blue-100">
              <span className="text-blue-300 font-bold">✓</span> {f}
            </li>
          ))}
        </ul>
        <Link
          href={copy.cta.href}
          onClick={handleUpgradeClick}
          className="block text-center bg-white text-[#1B3F7B] font-bold py-3 rounded-xl hover:bg-blue-50 transition text-sm"
        >
          {copy.cta.label}
        </Link>
        {copy.cta.secondary && (
          <Link href="/auth" className="block text-center text-blue-300 text-xs mt-3 hover:text-white transition">
            {copy.cta.secondary}
          </Link>
        )}
      </div>

      <p className="text-xs text-gray-400">
        {type === "signup" ? "Free accounts get 5 searches / month." : "Free searches reset on the 1st of each month."}{" "}
        <Link href="/grants" className="underline hover:text-gray-600">← Back to search</Link>
      </p>
    </div>
  );
}
