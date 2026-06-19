import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Company Formation Wizard — Founder Kit",
  description: "Generate your Certificate of Incorporation, IP Assignment, and filing instructions for any US state. Free — takes 3 minutes.",
  alternates: { canonical: "/wizard" },
  openGraph: {
    title: "Company Formation Wizard — Founder Kit",
    description: "Form your company in any US state. Generate your Certificate of Incorporation and filing instructions in 3 minutes.",
    type: "website",
  },
};

export default function WizardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
