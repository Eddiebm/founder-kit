import Link from "next/link";

export default function HomePage() {
  return (
    <div className="max-w-3xl mx-auto pt-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
          Build your company.<br />Fund your mission.
        </h1>
        <p className="text-base sm:text-lg text-gray-500 max-w-xl mx-auto">
          Two tools. Form your entity in any US state and generate grant pitches with AI — no lawyers, no agency fees.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Link
          href="/wizard"
          className="group bg-white rounded-2xl border border-gray-200 p-7 hover:shadow-lg hover:border-[#1B3F7B]/30 transition-all flex flex-col"
        >
          <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 group-hover:scale-105 transition-transform" style={{ background: "#1B3F7B" }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M3 19V8l8-5 8 5v11h-5v-5H8v5H3z" fill="white" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Entity Formation</h2>
          <p className="text-sm text-gray-500 leading-relaxed flex-1">
            Generate your Certificate of Incorporation, IP Assignment Agreement, and 501(c)(3) Purpose Narrative for any US state. Includes direct links to file online with the state and the IRS.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {["50 states + DC", "C-Corp", "Nonprofit", "Hybrid"].map((t) => (
              <span key={t} className="text-xs bg-blue-50 text-blue-700 border border-blue-100 rounded-full px-2.5 py-1 font-medium">
                {t}
              </span>
            ))}
          </div>
          <div className="mt-5 flex items-center gap-1 text-sm font-semibold text-[#1B3F7B] group-hover:gap-2 transition-all">
            Start Formation <span>→</span>
          </div>
        </Link>

        <Link
          href="/grants"
          className="group bg-white rounded-2xl border border-gray-200 p-7 hover:shadow-lg hover:border-[#1a5c3a]/30 transition-all flex flex-col"
        >
          <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 group-hover:scale-105 transition-transform" style={{ background: "#1a5c3a" }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M11 3l2 4h4l-3.5 3 1.5 4L11 12l-4 2 1.5-4L5 7h4l2-4z" fill="white" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Grant Automator</h2>
          <p className="text-sm text-gray-500 leading-relaxed flex-1">
            Fill out a 9-field profile. Claude scores 100+ grants (plus a live web search) for fit and auto-applies to all high-fit programs with a tailored pitch — one click.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {["100+ grants", "Live web search", "Pitch draft", "Auto-apply"].map((t) => (
              <span key={t} className="text-xs bg-green-50 text-green-700 border border-green-100 rounded-full px-2.5 py-1 font-medium">
                {t}
              </span>
            ))}
          </div>
          <div className="mt-5 flex items-center gap-1 text-sm font-semibold text-[#1a5c3a] group-hover:gap-2 transition-all">
            Find Grants <span>→</span>
          </div>
        </Link>
      </div>

      <div className="mt-8 bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-wide">How it works</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-sm text-gray-600">
          <div className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
            <p><strong className="text-gray-800">Form</strong> — Choose a state, fill in your details, download ready-to-file legal docs, and follow the link to file directly with the state.</p>
          </div>
          <div className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
            <p><strong className="text-gray-800">Match</strong> — Describe your org and Claude scores 15 grants for your fit in about 10 seconds.</p>
          </div>
          <div className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</span>
            <p><strong className="text-gray-800">Pitch</strong> — Generate a tailored 3–4 paragraph pitch draft, review the fact-check list, and apply.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
