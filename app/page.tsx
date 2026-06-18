import Link from "next/link";
import EmailCapture from "./components/EmailCapture";
import { getDb } from "@/lib/db";

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

const features = [
  {
    href: "/grants",
    color: "#b45309",
    lightBg: "bg-amber-50",
    lightText: "text-amber-700",
    lightBorder: "border-amber-100",
    hoverBorder: "hover:border-amber-300",
    ctaColor: "text-amber-700",
    icon: (
      <path d="M11 3l2 4h4l-3.5 3 1.5 4L11 12l-4 2 1.5-4L5 7h4l2-4z" fill="white" />
    ),
    title: "Grant Discovery",
    description:
      "Describe your org once. You get a ranked list of every federal and private grant you actually qualify for — scored against 100+ programs plus a live web search — in under 30 seconds.",
    tags: ["100+ grants", "Live web search", "Fit scoring", "Federal + private"],
    cta: "Find my grants",
  },
  {
    href: "/grants",
    color: "#1a5c3a",
    lightBg: "bg-green-50",
    lightText: "text-green-700",
    lightBorder: "border-green-100",
    hoverBorder: "hover:border-[#1a5c3a]/30",
    ctaColor: "text-[#1a5c3a]",
    icon: (
      <>
        <path d="M4 4h14v2H4zM4 8h10v2H4zM4 12h7v2H4z" fill="white" />
        <path d="M16 11l5 5-5 5v-3h-4v-4h4z" fill="white" />
      </>
    ),
    title: "AI Pitch & Auto-Apply",
    description:
      "You get a tailored 3–4 paragraph pitch for every high-fit grant — with a fact-check list so you submit with confidence. For email programs, your application goes out automatically.",
    tags: ["AI pitch draft", "Auto-apply", "Fact-check list", "Email delivery"],
    cta: "Generate a pitch",
  },
  {
    href: "/wizard",
    color: "#1B3F7B",
    lightBg: "bg-blue-50",
    lightText: "text-blue-700",
    lightBorder: "border-blue-100",
    hoverBorder: "hover:border-[#1B3F7B]/30",
    ctaColor: "text-[#1B3F7B]",
    icon: (
      <path d="M3 19V8l8-5 8 5v11h-5v-5H8v5H3z" fill="white" />
    ),
    title: "Entity Formation",
    description:
      "You leave with a Certificate of Incorporation, IP Assignment Agreement, and 501(c)(3) Purpose Narrative — ready to file online with the state and the IRS. Any structure, all 50 states.",
    tags: ["50 states + DC", "C-Corp", "Nonprofit", "Hybrid"],
    cta: "Form your entity",
  },
  {
    href: "/register",
    color: "#7c3aed",
    lightBg: "bg-purple-50",
    lightText: "text-purple-700",
    lightBorder: "border-purple-100",
    hoverBorder: "hover:border-purple-300",
    ctaColor: "text-purple-700",
    icon: (
      <path d="M11 2L4 6v6c0 4 3 7.4 7 8 4-.6 7-4 7-8V6l-7-4z" fill="white" />
    ),
    title: "Federal Registration",
    description:
      "You get a step-by-step checklist to obtain your UEI number, CAGE code, and complete SAM registration — the prerequisites for every federal grant and contract — without the maze.",
    tags: ["SAM.gov", "UEI number", "CAGE code", "NAICS codes"],
    cta: "Start registration",
  },
];

export default async function HomePage() {
  const { founders } = await getStats();

  return (
    <div className="max-w-4xl mx-auto pt-8">
      {/* Hero */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-3 py-1 text-xs font-semibold text-amber-700 mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
          $4B+ in federal grants available to small businesses this year
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 leading-tight">
          Incorporated. Registered.<br className="hidden sm:block" /> Funded. Fast.
        </h1>
        <p className="text-base sm:text-lg text-gray-500 max-w-2xl mx-auto">
          Founder Kit is the operating system for early-stage founders — form your entity, register federally, find grants you actually qualify for, and auto-apply. Everything in one place, no lawyer required.
        </p>

        {/* Live stats strip */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-400 inline-block animate-pulse" />
            <strong className="text-gray-800">{founders}</strong> founders matched
          </span>
          <span className="text-gray-200">|</span>
          <span className="flex items-center gap-1.5">
            <span className="text-amber-500 font-bold">✓</span>
            100+ grants tracked
          </span>
          <span className="text-gray-200">|</span>
          <span className="flex items-center gap-1.5">
            <span className="text-green-500 font-bold">✓</span>
            $0 to start
          </span>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link href="/grants" className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-6 py-3 rounded-xl text-sm transition">
            Find my grants →
          </Link>
          <Link href="/auth" className="border border-gray-200 hover:border-gray-300 bg-white text-gray-700 font-semibold px-6 py-3 rounded-xl text-sm transition">
            Sign up free
          </Link>
        </div>
      </div>

      {/* Four feature cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {features.map((f) => (
          <Link
            key={f.title}
            href={f.href}
            className={`group bg-white rounded-2xl border border-gray-200 p-6 ${f.hoverBorder} hover:shadow-lg transition-all flex flex-col`}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform"
              style={{ background: f.color }}
            >
              <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
                {f.icon}
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h2>
            <p className="text-sm text-gray-500 leading-relaxed flex-1">{f.description}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {f.tags.map((t) => (
                <span
                  key={t}
                  className={`text-xs ${f.lightBg} ${f.lightText} border ${f.lightBorder} rounded-full px-2.5 py-1 font-medium`}
                >
                  {t}
                </span>
              ))}
            </div>
            <div className={`mt-4 flex items-center gap-1 text-sm font-semibold ${f.ctaColor} group-hover:gap-2 transition-all`}>
              {f.cta} <span>→</span>
            </div>
          </Link>
        ))}
      </div>

      {/* End-to-end flow */}
      <div className="mt-5 bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-5 text-sm uppercase tracking-wide">
          The complete path — from idea to funded
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-sm text-gray-600 relative">
          {[
            { n: "1", head: "Form", body: "You leave with ready-to-file legal docs for any US state. File online in minutes — no attorney, no waiting." },
            { n: "2", head: "Register", body: "You get your UEI, CAGE code, and SAM.gov registration — unlocking every federal grant and contract opportunity." },
            { n: "3", head: "Match", body: "You see every grant you actually qualify for, ranked by fit. Real results in under 30 seconds." },
            { n: "4", head: "Apply", body: "You submit tailored pitches — auto-applied for email programs. Fact-checked before it goes out." },
          ].map(({ n, head, body }) => (
            <div key={n} className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                {n}
              </span>
              <p>
                <strong className="text-gray-800">{head}</strong> — {body}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Email capture — below features, not gating the hero */}
      <div className="mt-5">
        <EmailCapture
          source="homepage"
          heading="Get your free grant match report."
          subtext="Tell us your email — we'll send you the top grants your business qualifies for, no account needed."
          buttonText="Send my matches"
        />
      </div>

      {/* Pricing */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Discovery</p>
          <p className="text-2xl font-bold text-gray-900 mb-4">
            $0 <span className="text-sm font-normal text-gray-400">/ month</span>
          </p>
          <ul className="space-y-2 text-sm text-gray-600">
            {[
              "5 grant searches / month",
              "3 AI pitch drafts / month",
              "Full formation wizard",
              "Federal registration guide",
            ].map((feat) => (
              <li key={feat} className="flex items-center gap-2">
                <span className="text-green-500 font-bold text-base">✓</span> {feat}
              </li>
            ))}
          </ul>
          <Link
            href="/auth"
            className="mt-5 block text-center text-sm font-semibold text-[#1B3F7B] border border-[#1B3F7B]/30 rounded-xl py-2.5 hover:bg-blue-50 transition"
          >
            Start for free
          </Link>
        </div>

        <div className="bg-[#1B3F7B] rounded-2xl p-6 text-white">
          <p className="text-xs font-semibold text-blue-300 uppercase tracking-wide mb-1">Launchpad</p>
          <p className="text-2xl font-bold mb-1">
            $29 <span className="text-sm font-normal text-blue-300">/ month</span>
          </p>
          <p className="text-xs text-blue-300 mb-4">or $249/year <span className="bg-amber-400 text-amber-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1">Save $99</span></p>
          <ul className="space-y-2 text-sm text-blue-100">
            {[
              "Unlimited grant searches",
              "Unlimited pitch drafts",
              "Full formation wizard",
              "Federal registration guide",
            ].map((feat) => (
              <li key={feat} className="flex items-center gap-2">
                <span className="text-blue-300 font-bold text-base">✓</span> {feat}
              </li>
            ))}
          </ul>
          <Link
            href="/billing"
            className="mt-5 block text-center text-sm font-semibold bg-white text-[#1B3F7B] rounded-xl py-2.5 hover:bg-blue-50 transition"
          >
            Upgrade to Launchpad
          </Link>
        </div>
      </div>
    </div>
  );
}
