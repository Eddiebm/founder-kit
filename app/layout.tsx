import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import "./globals.css";
import NavBar from "./components/NavBar";
import PostHogProvider from "./components/PostHogProvider";
import { verifyToken } from "./lib/auth";

export const metadata: Metadata = {
  title: "Founder Kit — Find Grants & Form Your Company",
  description: "Search 100+ grants matched to your business, generate AI pitch drafts, auto-apply, and form your company in any US state — free to start.",
  metadataBase: new URL("https://myfounderkit.com"),
  alternates: { canonical: "/" },
  verification: { google: "QT5fH2uS2rLZ8yHRudRT7g9BXQ0twC6w3S4C_8f3mGQ" },
  openGraph: {
    title: "Founder Kit — Find Grants & Form Your Company",
    description: "Search 100+ grants matched to your business, generate AI pitch drafts, and auto-apply — free to start.",
    url: "https://myfounderkit.com",
    siteName: "Founder Kit",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Founder Kit — Find Grants & Form Your Company",
    description: "Search 100+ grants matched to your business, generate AI pitch drafts, and auto-apply — free to start.",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("app_session")?.value;
  const session = token ? await verifyToken(token) : null;
  const user = session
    ? { name: session.name, email: session.email, plan: session.plan }
    : null;

  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F0F4FA] flex flex-col">
        <PostHogProvider>
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#1B3F7B" }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 12V5l5-3 5 3v7H9V9H5v3H2z" fill="white" />
                </svg>
              </div>
              <span className="font-bold text-gray-900 text-base tracking-tight">Founder Kit</span>
            </Link>
            <NavBar user={user} />
          </div>
        </header>
        <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-5 sm:py-8">{children}</main>
        <footer className="border-t border-gray-200 bg-white">
          <div className="max-w-5xl mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
            <span>Founder Kit · AI-generated content — always verify with a licensed attorney before filing or submitting.</span>
            <div className="flex items-center gap-4">
              <a href="mailto:hello@myfounderkit.com" className="hover:text-gray-600 transition">Contact</a>
              <Link href="/privacy" className="hover:text-gray-600 transition">Privacy</Link>
              <Link href="/terms" className="hover:text-gray-600 transition">Terms</Link>
            </div>
          </div>
        </footer>
        </PostHogProvider>
      </body>
    </html>
  );
}
