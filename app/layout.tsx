import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Founder Kit",
  description: "Form your company in any US state, find matching grants, and generate pitch drafts — all in one place.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F0F4FA] flex flex-col">
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
            <nav className="flex items-center gap-1">
              <Link
                href="/wizard"
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                Formation
              </Link>
              <Link
                href="/grants"
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                Grants
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">{children}</main>
        <footer className="border-t border-gray-200 bg-white">
          <div className="max-w-5xl mx-auto px-4 py-4 text-center text-xs text-gray-400">
            Founder Kit · Documents and pitches are AI-generated — always verify with a licensed attorney before filing or submitting.
          </div>
        </footer>
      </body>
    </html>
  );
}
