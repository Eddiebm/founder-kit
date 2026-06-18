import { notFound } from "next/navigation";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getArticle, getAllSlugs } from "@/lib/blog";
import { getDb } from "@/lib/db";
import type { Metadata } from "next";
import EmailCapture from "@/components/EmailCapture";

interface VerificationState {
  verified: boolean;
  lastVerifiedAt: string | null;
  flaggedClaims: string[];
}

async function getVerification(slug: string): Promise<VerificationState | null> {
  try {
    const db = getDb();
    const rows = await db(
      "SELECT verified, last_verified_at, flagged_claims FROM blog_verifications WHERE slug = $1",
      [slug]
    ) as { verified: boolean; last_verified_at: string | null; flagged_claims: string[] }[];
    if (!rows.length) return null;
    return {
      verified: rows[0].verified,
      lastVerifiedAt: rows[0].last_verified_at,
      flaggedClaims: rows[0].flagged_claims ?? [],
    };
  } catch {
    return null;
  }
}

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return {};
  return {
    title: `${article.title} — Founder Kit`,
    description: article.description,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: { title: article.title, description: article.description, type: "article" },
  };
}

const CATEGORY_CTA: Record<string, { heading: string; subtext: string; href: string; linkLabel: string }> = {
  "Entity Formation": {
    heading: "Ready to form your entity?",
    subtext: "Founder Kit generates your Certificate of Incorporation, IP Assignment, and filing instructions for any US state.",
    href: "/wizard",
    linkLabel: "Start formation wizard →",
  },
  "Federal Registration": {
    heading: "Ready to register federally?",
    subtext: "Get a step-by-step checklist for your UEI number, CAGE code, and SAM.gov registration — required for any federal grant.",
    href: "/register",
    linkLabel: "Start federal registration →",
  },
  "Grants & Funding": {
    heading: "Find grants you actually qualify for",
    subtext: "Describe your business in 2 minutes. AI scores 100+ grants plus a live web search and ranks them by fit.",
    href: "/grants",
    linkLabel: "Find my grant matches →",
  },
};

export default async function BlogArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const ver = await getVerification(slug);
  const cta = CATEGORY_CTA[article.category] ?? CATEGORY_CTA["Grants & Funding"];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    datePublished: article.date,
    dateModified: article.date,
    author: { "@type": "Organization", name: "Founder Kit", url: "https://myfounderkit.com" },
    publisher: { "@type": "Organization", name: "Founder Kit", url: "https://myfounderkit.com" },
    mainEntityOfPage: { "@type": "WebPage", "@id": `https://myfounderkit.com/blog/${slug}` },
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Link href="/blog" className="text-xs text-gray-400 hover:text-gray-600 transition mb-6 inline-block">← All articles</Link>

      {/* Verification status banner */}
      {ver && !ver.verified && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-sm text-yellow-800">
          <strong>Under review:</strong> Our automated fact-checker flagged one or more claims in this article for re-verification. The content may have changed since publication.
          {ver.flaggedClaims.length > 0 && (
            <ul className="mt-2 list-disc pl-4 space-y-1 text-xs text-yellow-700">
              {ver.flaggedClaims.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
          )}
        </div>
      )}

      <div className="mb-6">
        <div className="flex flex-wrap gap-2 mb-3">
          {article.tags.map((t) => (
            <span key={t} className="text-xs bg-gray-100 text-gray-500 rounded-full px-2.5 py-1">{t}</span>
          ))}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 leading-tight">{article.title}</h1>
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span>{new Date(article.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
          {ver?.verified && ver.lastVerifiedAt && (
            <>
              <span>·</span>
              <span className="text-green-600 font-medium">
                ✓ Verified {new Date(ver.lastVerifiedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
            </>
          )}
        </div>
      </div>

      <article className="prose prose-sm prose-gray max-w-none
        prose-headings:font-bold prose-headings:text-gray-900
        prose-h2:text-lg prose-h2:mt-8 prose-h2:mb-3
        prose-h3:text-base prose-h3:mt-6 prose-h3:mb-2
        prose-p:text-gray-700 prose-p:leading-relaxed
        prose-li:text-gray-700 prose-a:text-[#1a5c3a] prose-a:no-underline hover:prose-a:underline
        prose-strong:text-gray-900 prose-code:text-sm prose-code:bg-gray-100 prose-code:px-1 prose-code:rounded">
        <MDXRemote source={article.content} />
      </article>

      <div className="mt-10 space-y-4">
        <EmailCapture
          source={`blog-${slug}`}
          heading="Get a free personalized grant match report"
          subtext="We'll match your business to the top grants you qualify for and send them to your inbox. Free, no spam."
        />

        <div className="bg-[#1B3F7B] rounded-2xl p-6 text-white">
          <h3 className="font-bold text-base mb-1">{cta.heading}</h3>
          <p className="text-blue-200 text-sm mb-4">{cta.subtext}</p>
          <Link href={cta.href} className="inline-block bg-white text-[#1B3F7B] font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-blue-50 transition">
            {cta.linkLabel}
          </Link>
        </div>
      </div>

      <p className="mt-6 text-xs text-gray-400 text-center">
        AI-assisted content — always verify with official sources and a licensed professional before acting.
      </p>
    </div>
  );
}
