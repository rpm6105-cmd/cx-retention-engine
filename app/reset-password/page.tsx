"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();

  // Phase 1 — request reset email
  const [email, setEmail] = useState("");
  const [sendLoading, setSendLoading] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [sendError, setSendError] = useState("");

  // Phase 2 — set new password (when user arrives via email link)
  const [hasSession, setHasSession] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateError, setUpdateError] = useState("");

  // Detect if user arrived via password reset link (has active session)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setHasSession(true);
    });

    // Listen for the PASSWORD_RECOVERY event from Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setHasSession(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSendReset(e: React.FormEvent) {
    e.preventDefault();
    setSendError("");
    if (!email) { setSendError("Please enter your email address."); return; }
    setSendLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://cx-retention-engine.vercel.app/reset-password",
    });
    setSendLoading(false);
    if (error) { setSendError(error.message); return; }
    setSendSuccess(true);
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    setUpdateError("");
    if (!newPassword || !confirmPassword) { setUpdateError("Please fill in both fields."); return; }
    if (newPassword !== confirmPassword) { setUpdateError("Passwords do not match."); return; }
    if (newPassword.length < 6) { setUpdateError("Password must be at least 6 characters."); return; }
    setUpdateLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setUpdateLoading(false);
    if (error) { setUpdateError(error.message); return; }
    setUpdateSuccess(true);
    setTimeout(() => router.push("/login"), 2000);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-12">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm shadow-indigo-500/30 ring-1 ring-white/10">
            <span className="text-base font-extrabold">CX</span>
          </div>
          <div className="text-center">
            <div className="text-sm font-semibold text-gray-900">CX App</div>
            <div className="text-xs text-gray-500">Retention engine</div>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-gray-200 bg-white shadow-sm shadow-slate-900/5">

          {/* Phase 2 — Set new password */}
          {hasSession ? (
            <div className="p-5">
              <h1 className="text-sm font-semibold text-gray-900">Set new password</h1>
              <p className="mt-0.5 text-xs text-gray-500">Enter a new password for your account.</p>

              {updateSuccess ? (
                <div className="mt-4 space-y-3 text-center">
                  <div className="grid h-12 w-12 mx-auto place-items-center rounded-full bg-emerald-100 text-emerald-600">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6"><path fillRule="evenodd" d="M16.704 4.296a1 1 0 0 1 0 1.414l-7.5 7.5a1 1 0 0 1-1.414 0l-3.5-3.5a1 1 0 0 1 1.414-1.414l2.793 2.793 6.793-6.793a1 1 0 0 1 1.414 0Z" clipRule="evenodd" /></svg>
                  </div>
                  <div className="text-sm font-semibold text-gray-900">Password updated!</div>
                  <div className="text-xs text-gray-500">Redirecting you to sign in…</div>
                </div>
              ) : (
                <form onSubmit={handleUpdatePassword} className="mt-4 space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="new-password" className="text-xs font-semibold text-gray-700">New password</label>
                    <input
                      id="new-password"
                      type="password"
                      placeholder="Min. 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm outline-none placeholder:text-gray-400 focus:border-gray-300 focus:outline-none focus:ring-4 focus:ring-indigo-600/15"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="confirm-password" className="text-xs font-semibold text-gray-700">Confirm password</label>
                    <input
                      id="confirm-password"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm outline-none placeholder:text-gray-400 focus:border-gray-300 focus:outline-none focus:ring-4 focus:ring-indigo-600/15"
                    />
                  </div>
                  {updateError && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-700">{updateError}</div>
                  )}
                  <button
                    type="submit"
                    disabled={updateLoading}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-600/20 disabled:opacity-60"
                  >
                    {updateLoading ? (
                      <><svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z" /></svg>Updating…</>
                    ) : "Update password"}
                  </button>
                </form>
              )}
            </div>
          ) : (
            /* Phase 1 — Request reset email */
            <div className="p-5">
              <h1 className="text-sm font-semibold text-gray-900">Reset your password</h1>
              <p className="mt-0.5 text-xs text-gray-500">Enter your email and we&apos;ll send you a reset link.</p>

              {sendSuccess ? (
                <div className="mt-4 space-y-3 text-center">
                  <div className="grid h-12 w-12 mx-auto place-items-center rounded-full bg-emerald-100 text-emerald-600">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6"><path d="M3 4a2 2 0 0 0-2 2v1.161l8.441 4.221a1.25 1.25 0 0 0 1.118 0L19 7.162V6a2 2 0 0 0-2-2H3Z" /><path d="m19 8.839-7.77 3.885a2.75 2.75 0 0 1-2.46 0L1 8.839V14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.839Z" /></svg>
                  </div>
                  <div className="text-sm font-semibold text-gray-900">Check your email</div>
                  <div className="text-xs text-gray-500">We sent a reset link to <span className="font-semibold">{email}</span>. Click it to set a new password.</div>
                  <button
                    onClick={() => { setSendSuccess(false); setEmail(""); }}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    Resend email
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSendReset} className="mt-4 space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="reset-email" className="text-xs font-semibold text-gray-700">Email address</label>
                    <input
                      id="reset-email"
                      type="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm outline-none placeholder:text-gray-400 focus:border-gray-300 focus:outline-none focus:ring-4 focus:ring-indigo-600/15"
                    />
                  </div>
                  {sendError && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-700">{sendError}</div>
                  )}
                  <button
                    type="submit"
                    disabled={sendLoading}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-600/20 disabled:opacity-60"
                  >
                    {sendLoading ? (
                      <><svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z" /></svg>Sending…</>
                    ) : "Send reset link"}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        <div className="mt-5 text-center">
          <Link href="/login" className="text-xs font-semibold text-gray-500 transition hover:text-gray-900">
            ← Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
