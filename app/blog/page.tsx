import Link from "next/link";
import { getAllArticles } from "@/lib/blog";
import { getDb } from "@/lib/db";

export const metadata = {
  title: "Blog — Founder Kit",
  description: "Guides on grants, entity formation, federal registration, and funding for founders.",
};

const SECTIONS = [
  { key: "Entity Formation", color: "#1B3F7B", lightBg: "bg-blue-50", badge: "bg-blue-100 text-blue-700" },
  { key: "Federal Registration", color: "#7c3aed", lightBg: "bg-purple-50", badge: "bg-purple-100 text-purple-700" },
  { key: "Grants & Funding", color: "#b45309", lightBg: "bg-amber-50", badge: "bg-amber-100 text-amber-700" },
  { key: "General", color: "#1a5c3a", lightBg: "bg-green-50", badge: "bg-green-100 text-green-700" },
];

async function getVerificationMap(): Promise<Record<string, { verified: boolean; lastVerifiedAt: string | null }>> {
  try {
    const db = getDb();
    const rows = await db("SELECT slug, verified, last_verified_at FROM blog_verifications") as {
      slug: string; verified: boolean; last_verified_at: string | null;
    }[];
    return Object.fromEntries(rows.map((r) => [r.slug, { verified: r.verified, lastVerifiedAt: r.last_verified_at }]));
  } catch {
    return {};
  }
}

export default async function BlogIndexPage() {
  const articles = getAllArticles();
  const verMap = await getVerificationMap();

  const bySection = SECTIONS.map((s) => ({
    ...s,
    articles: articles.filter((a) => a.category === s.key),
  })).filter((s) => s.articles.length > 0);

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Founder Resources</h1>
        <p className="text-sm text-gray-500">Guides on grants, entity formation, federal registration, and funding — verified and kept up to date.</p>
      </div>

      {articles.length === 0 ? (
        <p className="text-gray-400 text-sm">No articles yet — check back soon.</p>
      ) : (
        <div className="space-y-10">
          {bySection.map((section) => (
            <div key={section.key}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 rounded-full" style={{ background: section.color }} />
                <h2 className="text-base font-bold text-gray-800">{section.key}</h2>
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-400">{section.articles.length} {section.articles.length === 1 ? "guide" : "guides"}</span>
              </div>
              <div className="space-y-3">
                {section.articles.map((a) => {
                  const ver = verMap[a.slug];
                  return (
                    <Link
                      key={a.slug}
                      href={`/blog/${a.slug}`}
                      className="block bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md hover:border-gray-300 transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-base mb-1 leading-snug">{a.title}</h3>
                          <p className="text-sm text-gray-500 line-clamp-2">{a.description}</p>
                          <div className="mt-3 flex flex-wrap gap-2 items-center">
                            <span className="text-xs text-gray-400">{new Date(a.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                            {a.tags.slice(0, 2).map((t) => (
                              <span key={t} className="text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">{t}</span>
                            ))}
                          </div>
                        </div>
                        <div className="shrink-0 mt-0.5">
                          {ver?.verified ? (
                            <span className="text-xs bg-green-50 text-green-700 border border-green-200 rounded-full px-2 py-0.5 font-medium">✓ Verified</span>
                          ) : ver ? (
                            <span className="text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-full px-2 py-0.5 font-medium">Reviewing</span>
                          ) : null}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
