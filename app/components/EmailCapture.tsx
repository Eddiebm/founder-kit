"use client";

import { useState } from "react";
import { usePostHog } from "posthog-js/react";

interface Props {
  source: string;
  heading?: string;
  subtext?: string;
  buttonText?: string;
  dark?: boolean;
}

export default function EmailCapture({
  source,
  heading = "Get a free personalized grant match report",
  subtext = "Enter your email and we'll send you the top grants your business qualifies for — no spam, one email.",
  buttonText = "Send my grant matches",
  dark = false,
}: Props) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const ph = usePostHog();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/email/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source }),
      });
      if (res.ok) {
        ph?.capture("email_captured", { source });
        setStatus("done");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  const bg = dark ? "bg-[#1B3F7B]" : "bg-amber-50 border border-amber-100";
  const headingColor = dark ? "text-white" : "text-gray-900";
  const subtextColor = dark ? "text-blue-200" : "text-gray-500";

  if (status === "done") {
    return (
      <div className={`${bg} rounded-2xl p-6 text-center`}>
        <p className={`font-semibold text-base ${headingColor} mb-1`}>You're on the list.</p>
        <p className={`text-sm ${subtextColor}`}>We'll send your grant matches within 24 hours.</p>
      </div>
    );
  }

  return (
    <div className={`${bg} rounded-2xl p-6`}>
      <h3 className={`font-bold text-base ${headingColor} mb-1`}>{heading}</h3>
      <p className={`text-sm ${subtextColor} mb-4`}>{subtext}</p>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition disabled:opacity-60 whitespace-nowrap"
        >
          {status === "loading" ? "Sending…" : buttonText}
        </button>
      </form>
      {status === "error" && (
        <p className="mt-2 text-xs text-red-500">Something went wrong — try again.</p>
      )}
    </div>
  );
}
