"use client";

import Link from "next/link";
import { usePostHog } from "posthog-js/react";
import { useEffect } from "react";

interface Props {
  type: "search" | "pitch";
}

const COPY = {
  search: {
    icon: "🔍",
    heading: "You've used all 5 free grant searches this month",
    body: "Upgrade to Pro for unlimited searches — run as many profiles as you need, any time.",
    features: ["Unlimited grant searches", "Unlimited AI pitch drafts", "Full auto-apply"],
  },
  pitch: {
    icon: "✍️",
    heading: "You've used all 3 free pitch drafts this month",
    body: "Upgrade to Pro to generate pitches for every grant you match — unlimited.",
    features: ["Unlimited pitch generation", "Unlimited grant searches", "Full auto-apply"],
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
        <p className="text-white font-bold text-lg mb-1">
          Pro — $29<span className="text-blue-300 font-normal text-sm">/month</span>
        </p>
        <p className="text-blue-300 text-xs mb-4">or $249/year · save $99</p>
        <ul className="space-y-2 mb-5">
          {copy.features.map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm text-blue-100">
              <span className="text-blue-300 font-bold">✓</span> {f}
            </li>
          ))}
        </ul>
        <Link
          href="/billing"
          onClick={handleUpgradeClick}
          className="block text-center bg-white text-[#1B3F7B] font-bold py-3 rounded-xl hover:bg-blue-50 transition text-sm"
        >
          Upgrade to Pro →
        </Link>
      </div>

      <p className="text-xs text-gray-400">
        Free searches reset on the 1st of each month.{" "}
        <Link href="/grants" className="underline hover:text-gray-600">← Back to search</Link>
      </p>
    </div>
  );
}
