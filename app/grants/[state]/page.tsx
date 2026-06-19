import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { STATES_LIST, STATE_REGISTRY } from "@/lib/states";
import { getStateGrantInfo, FEDERAL_PROGRAMS } from "@/lib/state-grants";

function nameToSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-");
}

function slugToAbbr(slug: string): string | undefined {
  const entry = STATES_LIST.find((s) => nameToSlug(s.name) === slug);
  return entry?.abbr;
}

export function generateStaticParams() {
  return STATES_LIST.map((s) => ({ state: nameToSlug(s.name) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string }>;
}): Promise<Metadata> {
  const { state: slug } = await params;
  const abbr = slugToAbbr(slug);
  if (!abbr) return {};
  const info = STATE_REGISTRY[abbr];
  return {
    title: `Small Business Grants in ${info.name} — Founder Kit`,
    description: `Find small business grants, startup funding, and state programs available in ${info.name}. Includes SBIR, state-specific grants, and federal programs — matched to your business in 30 seconds.`,
    alternates: { canonical: `/grants/${slug}` },
    openGraph: {
      title: `Small Business Grants in ${info.name}`,
      description: `State and federal grant programs available to startups and small businesses in ${info.name}.`,
      type: "website",
    },
  };
}

export default async function StateGrantsPage({
  params,
}: {
  params: Promise<{ state: string }>;
}) {
  const { state: slug } = await params;
  const abbr = slugToAbbr(slug);
  if (!abbr) notFound();

  const info = STATE_REGISTRY[abbr];
  const { programs, sbdcUrl } = getStateGrantInfo(abbr);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `Small Business Grants in ${info.name}`,
    description: `State and federal grant programs for small businesses in ${info.name}.`,
    url: `https://myfounderkit.com/grants/${slug}`,
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Link
        href="/grants"
        className="text-xs text-gray-400 hover:text-gray-600 transition mb-6 inline-block"
      >
        ← Find my grants
      </Link>

      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 leading-tight">
        Small Business Grants in {info.name}
      </h1>
      <p className="text-gray-500 text-sm leading-relaxed mb-8">
        {info.name} small businesses and startups have access to both state-specific programs and
        federal funding through SBIR, SBA, EDA, and USDA. Below are the most relevant programs —
        use Founder Kit to match your specific business to all programs you qualify for.
      </p>

      {/* CTA */}
      <div className="bg-gray-900 rounded-2xl p-5 mb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-white font-medium text-sm mb-1">
            Find every grant you qualify for in {info.name}
          </p>
          <p className="text-gray-400 text-xs">
            Describe your business once — AI scores 100+ programs in 30 seconds.
          </p>
        </div>
        <Link
          href="/grants"
          className="shrink-0 bg-white text-gray-900 font-semibold text-sm px-4 py-2.5 rounded-xl hover:bg-gray-100 transition"
        >
          Match my grants →
        </Link>
      </div>

      {/* State-specific programs */}
      {programs.length > 0 && (
        <section className="mb-10">
          <h2 className="text-base font-bold text-gray-900 mb-4">
            {info.name} State Grant Programs
          </h2>
          <div className="space-y-4">
            {programs.map((p) => (
              <div
                key={p.name}
                className="border border-gray-100 rounded-xl p-4"
              >
                <div className="flex items-start justify-between gap-3 mb-1">
                  <p className="font-semibold text-gray-900 text-sm">{p.name}</p>
                  <span className="shrink-0 text-xs bg-green-50 text-green-700 border border-green-100 px-2 py-0.5 rounded-full font-medium">
                    {p.amount}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mb-2">{p.agency}</p>
                <p className="text-sm text-gray-600 mb-3">{p.description}</p>
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#1a5c3a] font-medium hover:underline"
                >
                  Learn more →
                </a>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Federal programs */}
      <section className="mb-10">
        <h2 className="text-base font-bold text-gray-900 mb-4">
          Federal Programs Available in {info.name}
        </h2>
        <div className="space-y-4">
          {FEDERAL_PROGRAMS.map((p) => (
            <div
              key={p.name}
              className="border border-gray-100 rounded-xl p-4"
            >
              <div className="flex items-start justify-between gap-3 mb-1">
                <p className="font-semibold text-gray-900 text-sm">{p.name}</p>
                <span className="shrink-0 text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full font-medium">
                  {p.amount}
                </span>
              </div>
              <p className="text-xs text-gray-400 mb-2">{p.agency}</p>
              <p className="text-sm text-gray-600 mb-3">{p.description}</p>
              <a
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#1a5c3a] font-medium hover:underline"
              >
                Learn more →
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* SBDC + Formation */}
      <section className="mb-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="border border-gray-100 rounded-xl p-5">
          <p className="font-semibold text-gray-900 text-sm mb-2">
            {info.name} Small Business Development Center
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Free one-on-one advising for {info.name} small businesses — grant writing, business plans, and financing strategies.
          </p>
          <a
            href={sbdcUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#1a5c3a] font-medium hover:underline"
          >
            Find your local SBDC →
          </a>
        </div>

        <div className="border border-gray-100 rounded-xl p-5">
          <p className="font-semibold text-gray-900 text-sm mb-2">
            Form your company in {info.name}
          </p>
          <p className="text-sm text-gray-500 mb-2">
            Filing fee: <span className="font-medium text-gray-800">${info.corpFee}</span> ·{" "}
            Timeline: <span className="font-medium text-gray-800">{info.processingTime}</span>
          </p>
          {info.notes && (
            <p className="text-xs text-gray-400 mb-4">{info.notes}</p>
          )}
          <Link
            href="/wizard"
            className="text-xs text-[#1a5c3a] font-medium hover:underline"
          >
            Start formation wizard →
          </Link>
        </div>
      </section>

      {/* Related guides */}
      <section className="mb-10">
        <h2 className="text-base font-bold text-gray-900 mb-4">Guides for {info.name} Founders</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { slug: "how-to-get-an-ein", title: "How to Get an EIN" },
            { slug: "how-to-register-on-sam-gov", title: "How to Register on SAM.gov" },
            { slug: "how-to-get-uei-number", title: "How to Get a UEI Number" },
            { slug: "sbir-vs-sttr-grants", title: "SBIR vs STTR Grants" },
            { slug: "non-dilutive-funding-guide", title: "Non-Dilutive Funding Guide" },
            { slug: "how-to-apply-for-federal-small-business-grant", title: "How to Apply for a Federal Grant" },
            { slug: "c-corp-vs-llc-for-startups", title: "C-Corp vs LLC for Startups" },
            { slug: "founder-equity-split-agreement", title: "Founder Equity Split Agreement" },
            { slug: "how-to-incorporate-in-delaware", title: "How to Incorporate in Delaware" },
            { slug: "what-is-a-registered-agent", title: "What Is a Registered Agent?" },
            { slug: "duns-number-vs-uei", title: "DUNS Number vs UEI" },
            { slug: "state-small-business-grants", title: "State Small Business Grants Overview" },
          ].map((article) => (
            <Link
              key={article.slug}
              href={`/blog/${article.slug}`}
              className="text-sm text-[#1a5c3a] hover:underline px-3 py-2 rounded-lg hover:bg-green-50 transition flex items-center gap-2"
            >
              <span className="text-gray-300">→</span>
              {article.title}
            </Link>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <div className="bg-[#1B3F7B] rounded-2xl p-6 text-white text-center">
        <h3 className="font-bold text-base mb-2">
          Not sure which {info.name} grants you qualify for?
        </h3>
        <p className="text-blue-200 text-sm mb-4">
          Describe your business once. Founder Kit scores 100+ federal and state programs and
          returns every grant you&apos;re eligible for — ranked and ready to apply.
        </p>
        <Link
          href="/grants"
          className="inline-block bg-white text-[#1B3F7B] font-semibold text-sm px-6 py-2.5 rounded-xl hover:bg-blue-50 transition"
        >
          Find my grants — free →
        </Link>
      </div>
    </div>
  );
}
