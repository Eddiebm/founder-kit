import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Find Small Business Grants — Founder Kit",
  description: "Describe your business once. AI matches you to 100+ federal and private grant programs in 30 seconds — scored, ranked, and ready to apply.",
  alternates: { canonical: "/grants" },
  openGraph: {
    title: "Find Small Business Grants — Founder Kit",
    description: "AI-powered grant matching for US startups and small businesses. 100+ programs, 30 seconds.",
    type: "website",
  },
};

export default function GrantsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
