"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { login, signUp } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "signup">("login");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirm, setSignupConfirm] = useState("");
  const [signupError, setSignupError] = useState("");
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    if (!loginEmail || !loginPassword) {
      setLoginError("Please enter your email and password.");
      return;
    }
    setLoginLoading(true);
    const result = await login(loginEmail, loginPassword);
    setLoginLoading(false);
    if (!result.ok) {
      if (result.pendingApproval) {
        setLoginError("Your account is pending approval. You'll be notified once approved.");
        return;
      }
      setLoginError(result.error ?? "Login failed.");
      return;
    }
    if (loginEmail.toLowerCase() === "rpm6105@gmail.com") {
      router.push("/admin");
    } else {
      router.push("/dashboard");
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setSignupError("");
    if (!signupName || !signupEmail || !signupPassword || !signupConfirm) {
      setSignupError("Please fill in all fields.");
      return;
    }
    if (signupPassword !== signupConfirm) {
      setSignupError("Passwords do not match.");
      return;
    }
    if (signupPassword.length < 6) {
      setSignupError("Password must be at least 6 characters.");
      return;
    }
    setSignupLoading(true);
    const result = await signUp(signupName, signupEmail, signupPassword);
    setSignupLoading(false);
    if (!result.ok) {
      setSignupError(result.error ?? "Sign up failed.");
      return;
    }
    setSignupSuccess(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm shadow-indigo-500/30 ring-1 ring-white/10">
            <span className="text-base font-extrabold">CX</span>
          </div>
          <div className="text-center">
            <div className="text-sm font-semibold text-gray-900 dark:text-white">CX App</div>
            <div className="text-xs text-gray-500 dark:text-white/60">Retention engine</div>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-gray-200 bg-white shadow-sm shadow-slate-900/5 dark:border-white/10 dark:bg-white/5">
          <div className="flex border-b border-gray-200 dark:border-white/10">
            <button
              onClick={() => { setTab("login"); setLoginError(""); }}
              className={`flex-1 px-5 py-4 text-sm font-semibold transition ${tab === "login" ? "border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400" : "text-gray-500 hover:text-gray-900 dark:text-white/50 dark:hover:text-white"}`}
            >
              Sign in
            </button>
            <button
              onClick={() => { setTab("signup"); setSignupError(""); setSignupSuccess(false); }}
              className={`flex-1 px-5 py-4 text-sm font-semibold transition ${tab === "signup" ? "border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400" : "text-gray-500 hover:text-gray-900 dark:text-white/50 dark:hover:text-white"}`}
            >
              Create account
            </button>
          </div>

          {/* Login */}
          {tab === "login" && (
            <form onSubmit={handleLogin} className="space-y-4 p-5">
              <div className="space-y-1.5">
                <label htmlFor="login-email" className="text-xs font-semibold text-gray-700 dark:text-white/70">Email address</label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm outline-none placeholder:text-gray-400 focus:border-gray-300 focus:outline-none focus:ring-4 focus:ring-indigo-600/15 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/30 dark:focus:border-white/20"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="login-password" className="text-xs font-semibold text-gray-700 dark:text-white/70">Password</label>
                  <Link href="/reset-password" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
                    Forgot password?
                  </Link>
                </div>
                <input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm outline-none placeholder:text-gray-400 focus:border-gray-300 focus:outline-none focus:ring-4 focus:ring-indigo-600/15 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/30 dark:focus:border-white/20"
                />
              </div>
              {loginError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
                  {loginError}
                </div>
              )}
              <button
                type="submit"
                disabled={loginLoading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-600/20 disabled:opacity-60"
              >
                {loginLoading ? (
                  <><svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z" /></svg>Signing in…</>
                ) : "Sign in"}
              </button>
            </form>
          )}

          {/* Signup */}
          {tab === "signup" && (
            <div className="p-5">
              {signupSuccess ? (
                <div className="space-y-4 text-center">
                  <div className="grid h-12 w-12 mx-auto place-items-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6"><path fillRule="evenodd" d="M16.704 4.296a1 1 0 0 1 0 1.414l-7.5 7.5a1 1 0 0 1-1.414 0l-3.5-3.5a1 1 0 0 1 1.414-1.414l2.793 2.793 6.793-6.793a1 1 0 0 1 1.414 0Z" clipRule="evenodd" /></svg>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">Request submitted!</div>
                    <div className="mt-1 text-xs text-gray-500 dark:text-white/60">
                      Your account for <span className="font-semibold">{signupEmail}</span> is pending approval. You'll be notified once approved.
                    </div>
                  </div>
                  <button
                    onClick={() => { setTab("login"); setSignupSuccess(false); }}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-600/20"
                  >
                    Go to sign in
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="signup-name" className="text-xs font-semibold text-gray-700 dark:text-white/70">Full name</label>
                    <input id="signup-name" type="text" autoComplete="name" placeholder="Jane Smith" value={signupName} onChange={(e) => setSignupName(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm outline-none placeholder:text-gray-400 focus:border-gray-300 focus:outline-none focus:ring-4 focus:ring-indigo-600/15 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/30 dark:focus:border-white/20" />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="signup-email" className="text-xs font-semibold text-gray-700 dark:text-white/70">Email address</label>
                    <input id="signup-email" type="email" autoComplete="email" placeholder="you@company.com" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm outline-none placeholder:text-gray-400 focus:border-gray-300 focus:outline-none focus:ring-4 focus:ring-indigo-600/15 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/30 dark:focus:border-white/20" />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="signup-password" className="text-xs font-semibold text-gray-700 dark:text-white/70">Password</label>
                    <input id="signup-password" type="password" autoComplete="new-password" placeholder="Min. 6 characters" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm outline-none placeholder:text-gray-400 focus:border-gray-300 focus:outline-none focus:ring-4 focus:ring-indigo-600/15 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/30 dark:focus:border-white/20" />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="signup-confirm" className="text-xs font-semibold text-gray-700 dark:text-white/70">Confirm password</label>
                    <input id="signup-confirm" type="password" autoComplete="new-password" placeholder="••••••••" value={signupConfirm} onChange={(e) => setSignupConfirm(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm outline-none placeholder:text-gray-400 focus:border-gray-300 focus:outline-none focus:ring-4 focus:ring-indigo-600/15 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/30 dark:focus:border-white/20" />
                  </div>
                  {signupError && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">{signupError}</div>
                  )}
                  <button type="submit" disabled={signupLoading} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-600/20 disabled:opacity-60">
                    {signupLoading ? (
                      <><svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z" /></svg>Creating account…</>
                    ) : "Create account"}
                  </button>
                  <p className="text-center text-xs text-gray-500 dark:text-white/40">By signing up you agree to our terms of service.</p>
                </form>
              )}
            </div>
          )}
        </div>

        <div className="mt-5 text-center">
          <Link href="/" className="text-xs font-semibold text-gray-500 transition hover:text-gray-900 dark:text-white/40 dark:hover:text-white">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
