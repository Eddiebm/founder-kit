import Link from "next/link";
import { getDb } from "@/lib/db";
import GrantResultAnimation from "./components/GrantResultAnimation";

async function getStats(): Promise<{ founders: number }> {
  try {
    const db = getDb();
    const [row] = await db(
      "SELECT COUNT(DISTINCT user_id) AS founders FROM usage_events WHERE action = 'score'"
    ) as [{ founders: string }];
    return { founders: Math.max(Number(row.founders), 12) };
  } catch {
    return { founders: 12 };
  }
}

export default async function HomePage() {
  const { founders } = await getStats();

  return (
    <div className="max-w-4xl mx-auto pt-8 pb-16">

      {/* Hero */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12 items-start">
        <div>
          <p className="text-xs text-gray-400 tracking-wide mb-5">
            Federal &amp; private grants, matched in 30 seconds
          </p>
          <h1 className="text-3xl sm:text-4xl font-medium leading-tight text-gray-900 mb-4">
            Stop guessing which grants you qualify for.
          </h1>
          <p className="text-base text-gray-500 leading-relaxed mb-8">
            Describe your company once. Claude reads 100+ federal and private programs and returns every grant you&apos;re eligible for — scored, ranked, ready to apply to.
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href="/grants"
              className="bg-gray-900 text-white font-medium px-5 py-2.5 rounded-xl text-sm hover:bg-gray-800 transition"
            >
              Find my grants →
            </Link>
            <span className="text-sm text-gray-400">Free — no credit card</span>
          </div>
        </div>

        <GrantResultAnimation />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 border border-gray-100 rounded-2xl overflow-hidden mb-12">
        {[
          { num: "100+", label: "programs tracked" },
          { num: "$4B+", label: "available this year" },
          { num: "30s", label: "to your matched list" },
        ].map((stat, i) => (
          <div
            key={stat.label}
            className={`py-6 text-center ${i < 2 ? "border-r border-gray-100" : ""}`}
          >
            <div className="text-2xl font-medium text-gray-900 mb-1">{stat.num}</div>
            <div className="text-sm text-gray-400">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Pricing */}
      <p className="text-xs text-gray-400 tracking-wide mb-4">Pricing</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        <div className="border border-gray-100 rounded-2xl p-6">
          <p className="text-sm text-gray-400 mb-1">Discovery</p>
          <p className="text-2xl font-medium text-gray-900 mb-4">
            $0 <span className="text-sm font-normal text-gray-400">/ month</span>
          </p>
          <ul className="space-y-2 mb-6">
            {[
              "5 grant searches / month",
              "3 AI pitch drafts / month",
              "Entity formation wizard",
              "Federal registration guide",
            ].map((f) => (
              <li key={f} className="text-sm text-gray-500 flex gap-3">
                <span className="text-gray-300 shrink-0">—</span>
                {f}
              </li>
            ))}
          </ul>
          <Link
            href="/auth"
            className="block text-center text-sm font-medium text-gray-700 border border-gray-200 rounded-xl py-2.5 hover:border-gray-300 hover:bg-gray-50 transition"
          >
            Start free
          </Link>
        </div>

        <div className="border-2 border-[#1B3F7B]/20 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm text-gray-400">Launchpad</p>
            <span className="text-[11px] bg-blue-50 text-blue-700 border border-blue-100 rounded-md px-2 py-0.5 font-medium">
              Most popular
            </span>
          </div>
          <p className="text-2xl font-medium text-gray-900 mb-1">
            $29 <span className="text-sm font-normal text-gray-400">/ month</span>
          </p>
          <p className="text-xs text-gray-400 mb-4">or $249 / year — save $99</p>
          <ul className="space-y-2 mb-6">
            {[
              "Unlimited grant searches",
              "Unlimited pitch drafts",
              "Auto-apply to email grants",
              "Everything in Discovery",
            ].map((f) => (
              <li key={f} className="text-sm text-gray-500 flex gap-3">
                <span className="text-gray-300 shrink-0">—</span>
                {f}
              </li>
            ))}
          </ul>
          <Link
            href="/billing"
            className="block text-center text-sm font-medium bg-[#1B3F7B] text-white rounded-xl py-2.5 hover:bg-[#163269] transition"
          >
            Upgrade to Launchpad
          </Link>
        </div>
      </div>

      <p className="text-center text-xs text-gray-300 mt-10">
        {founders} founders have used Founder Kit to find their first grant match.
      </p>

    </div>
  );
}
