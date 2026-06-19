import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Federal Business Registration Guide — Founder Kit",
  description: "Step-by-step guide to getting your UEI number, CAGE code, and SAM.gov registration — required for any federal grant or contract.",
  alternates: { canonical: "/register" },
  openGraph: {
    title: "Federal Business Registration Guide — Founder Kit",
    description: "Get your UEI number, CAGE code, and SAM.gov registration — required for SBIR, STTR, and all federal grants.",
    type: "website",
  },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
