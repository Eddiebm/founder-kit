import Link from "next/link";
import { getAllArticles } from "@/lib/blog";
import { getDb } from "@/lib/db";

export const metadata = {
  title: "Blog — Founder Kit",
  description: "Guides on grants, entity formation, federal registration, and funding for founders.",
};

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

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Founder Resources</h1>
        <p className="text-sm text-gray-500">Guides on grants, entity formation, federal registration, and funding — verified and kept up to date.</p>
      </div>

      {articles.length === 0 ? (
        <p className="text-gray-400 text-sm">No articles yet — check back soon.</p>
      ) : (
        <div className="space-y-4">
          {articles.map((a) => {
            const ver = verMap[a.slug];
            return (
              <Link
                key={a.slug}
                href={`/blog/${a.slug}`}
                className="block bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md hover:border-gray-300 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-gray-900 text-base mb-1 leading-snug">{a.title}</h2>
                    <p className="text-sm text-gray-500 line-clamp-2">{a.description}</p>
                    <div className="mt-3 flex flex-wrap gap-2 items-center">
                      <span className="text-xs text-gray-400">{new Date(a.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                      {a.tags.map((t) => (
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
      )}
    </div>
  );
}
