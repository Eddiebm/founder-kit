"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface NavBarProps {
  user?: { name?: string; email: string; plan: string } | null;
}

export default function NavBar({ user }: NavBarProps) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/auth/login", { method: "DELETE" });
    router.push("/auth");
    router.refresh();
  }

  return (
    <nav className="flex items-center gap-1">
      <Link href="/wizard" className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">
        Formation
      </Link>
      <Link href="/grants" className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">
        Grants
      </Link>
      <Link href="/register" className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">
        Register
      </Link>
      {user ? (
        <div className="flex items-center gap-1 ml-1 pl-2 border-l border-gray-200">
          <Link href="/billing" className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm transition-colors hover:bg-gray-100">
            <span className="text-gray-700 font-medium hidden sm:inline">{user.name?.split(" ")[0] ?? user.email.split("@")[0]}</span>
            {user.plan === "pro" && (
              <span className="text-[10px] font-bold uppercase bg-[#1a5c3a] text-white px-1.5 py-0.5 rounded-full">Pro</span>
            )}
          </Link>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="px-2.5 py-1.5 rounded-lg text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            {loggingOut ? "…" : "Sign out"}
          </button>
        </div>
      ) : (
        <Link href="/auth" className="ml-1 px-3 py-1.5 bg-[#1a5c3a] text-white text-sm font-medium rounded-lg hover:bg-[#174d31] transition-colors">
          Sign In
        </Link>
      )}
    </nav>
  );
}
