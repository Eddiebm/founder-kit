import fs from "fs";
import path from "path";
import matter from "gray-matter";

export interface ArticleMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  category: string;
  tags: string[];
  verifiableClaims: string[];
}

export interface Article extends ArticleMeta {
  content: string;
}

const CONTENT_DIR = path.join(process.cwd(), "content/blog");

export function getAllSlugs(): string[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  return fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx$/, ""));
}

export function getArticle(slug: string): Article | null {
  const filePath = path.join(CONTENT_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  return {
    slug,
    title: data.title ?? "",
    description: data.description ?? "",
    date: data.date ?? "",
    category: data.category ?? "General",
    tags: data.tags ?? [],
    verifiableClaims: data.verifiableClaims ?? [],
    content,
  };
}

export function getAllArticles(): ArticleMeta[] {
  return getAllSlugs()
    .map((slug) => getArticle(slug))
    .filter(Boolean)
    .map((a) => { const { content: _c, ...meta } = a as Article; return meta; })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
