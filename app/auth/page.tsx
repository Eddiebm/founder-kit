"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/grants";
  const resetToken = searchParams.get("reset");

  type View = "login" | "signup" | "forgot" | "reset";
  const [view, setView] = useState<View>(resetToken ? "reset" : "login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (resetToken) setView("reset");
  }, [resetToken]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (view === "forgot") {
        const res = await fetch("/api/auth/reset", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        if (!res.ok) throw new Error("Something went wrong");
        setSuccess("If that email has an account, you'll receive a reset link shortly.");
        setLoading(false);
        return;
      }

      if (view === "reset") {
        const res = await fetch("/api/auth/confirm-reset", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: resetToken, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Something went wrong");
        router.push("/grants");
        router.refresh();
        return;
      }

      const url = view === "login" ? "/api/auth/login" : "/api/auth/signup";
      const body = view === "login" ? { email, password } : { email, password, name };
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const inp = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-[#1a5c3a] focus:outline-none focus:ring-2 focus:ring-[#1a5c3a]/20 transition";

  if (view === "forgot") {
    return (
      <div className="max-w-md mx-auto pt-4">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#1B3F7B" }}>
              <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
                <path d="M2 12V5l5-3 5 3v7H9V9H5v3H2z" fill="white" />
              </svg>
            </div>
            <span className="font-bold text-gray-900 text-base">Founder Kit</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Reset your password</h1>
          <p className="text-gray-500 text-sm mt-1">We&apos;ll send a reset link to your email</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@example.com" required className={inp} />
          </div>
          {error && <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">{error}</div>}
          {success && <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm text-green-700">{success}</div>}
          <button type="submit" disabled={loading} className="w-full bg-[#1a5c3a] hover:bg-[#174d31] disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition text-sm">
            {loading ? "Sending…" : "Send Reset Link"}
          </button>
          <p className="text-center text-xs text-gray-400">
            Remember it?{" "}
            <button type="button" onClick={() => { setView("login"); setError(null); setSuccess(null); }} className="text-[#1a5c3a] font-medium hover:underline">
              Sign in
            </button>
          </p>
        </form>
      </div>
    );
  }

  if (view === "reset") {
    return (
      <div className="max-w-md mx-auto pt-4">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#1B3F7B" }}>
              <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
                <path d="M2 12V5l5-3 5 3v7H9V9H5v3H2z" fill="white" />
              </svg>
            </div>
            <span className="font-bold text-gray-900 text-base">Founder Kit</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Choose a new password</h1>
          <p className="text-gray-500 text-sm mt-1">At least 8 characters</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" required className={inp} />
          </div>
          {error && <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">{error}</div>}
          <button type="submit" disabled={loading} className="w-full bg-[#1a5c3a] hover:bg-[#174d31] disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition text-sm">
            {loading ? "Saving…" : "Set New Password"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto pt-4">
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#1B3F7B" }}>
            <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
              <path d="M2 12V5l5-3 5 3v7H9V9H5v3H2z" fill="white" />
            </svg>
          </div>
          <span className="font-bold text-gray-900 text-base">Founder Kit</span>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          {view === "login" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {view === "login" ? "Sign in to access your funding dashboard" : "Free to start — 5 searches included"}
        </p>
      </div>

      <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
        {(["login", "signup"] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setView(t); setError(null); }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
              view === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "login" ? "Sign In" : "Sign Up"}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        {view === "signup" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Smith" className={inp} />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@example.com" required className={inp} />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700">Password</label>
            {view === "login" && (
              <button type="button" onClick={() => { setView("forgot"); setError(null); }} className="text-xs text-gray-400 hover:text-[#1a5c3a] transition">
                Forgot password?
              </button>
            )}
          </div>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={view === "signup" ? "At least 8 characters" : "••••••••"} required className={inp} />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#1a5c3a] hover:bg-[#174d31] disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition text-sm"
        >
          {loading ? "Please wait…" : view === "login" ? "Sign In" : "Create Account"}
        </button>

        {view === "login" && (
          <p className="text-center text-xs text-gray-400">
            No account?{" "}
            <button type="button" onClick={() => setView("signup")} className="text-[#1a5c3a] font-medium hover:underline">
              Sign up free
            </button>
          </p>
        )}
      </form>

      {view === "signup" && (
        <div className="mt-6 bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">What you get free</p>
          <ul className="space-y-2">
            {[
              "5 funding searches per month",
              "10 AI pitch generations per month",
              "Full formation wizard (unlimited)",
              "Federal registration roadmap",
            ].map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                <span className="text-green-500 font-bold">✓</span> {f}
              </li>
            ))}
          </ul>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Need unlimited?{" "}
              <Link href="/billing" className="text-[#1a5c3a] font-medium hover:underline">
                Upgrade to Pro — $19/month
              </Link>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense>
      <AuthContent />
    </Suspense>
  );
}
