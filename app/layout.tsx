"use client";

import Sidebar from "@/components/Sidebar";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { logout } from "@/lib/auth";
import { OnboardingModal } from "@/components/OnboardingModal";
import "./globals.css";

const PUBLIC_ROUTES = ["/", "/login"];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [checking, setChecking] = useState(!PUBLIC_ROUTES.includes(pathname));
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const isPublic = PUBLIC_ROUTES.includes(pathname);
  const isAdmin = pathname.startsWith("/admin");
  const showSidebar = !isPublic && !isAdmin;
  const showOnboarding = !isPublic && !isAdmin;

  // ── Auth check ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isPublic) return;
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace("/login"); return; }
      const { data: profile } = await supabase.from("profiles").select("is_owner").eq("id", session.user.id).single();
      if (isAdmin) {
        if (!profile?.is_owner) { router.replace("/dashboard"); return; }
      }
      setChecking(false);
    });
  }, [pathname, isPublic, isAdmin, router]);

  // ── Back button interception ───────────────────────────────────────────────
  useEffect(() => {
    if (isPublic) return;

    // Push a dummy state so the back button hits it first
    window.history.pushState(null, "", window.location.href);

    function handlePopState() {
      // Re-push so the URL doesn't change
      window.history.pushState(null, "", window.location.href);
      // Show the logout confirmation modal
      setShowLogoutConfirm(true);
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [pathname, isPublic]);

  async function handleConfirmLogout() {
    setLogoutLoading(true);
    await logout();
    setLogoutLoading(false);
    setShowLogoutConfirm(false);
    router.push("/login");
  }

  // ── Loading spinner ────────────────────────────────────────────────────────
  if (!isPublic && checking) {
    return (
      <html lang="en">
        <body className="antialiased flex min-h-screen items-center justify-center bg-[var(--background)]">
          <div className="flex flex-col items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
              <span className="text-sm font-extrabold">CX</span>
            </div>
            <svg className="h-5 w-5 animate-spin text-indigo-600" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z" />
            </svg>
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <body className="antialiased flex min-h-screen bg-[var(--background)]">
        {showSidebar && <Sidebar />}
        <main className={showSidebar ? "flex-1 p-6 lg:p-8" : "w-full"}>
          {children}
        </main>
        {showOnboarding && <OnboardingModal />}
        <SpeedInsights />

        {/* ── Back button logout confirmation modal ── */}
        {showLogoutConfirm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm"
            onMouseDown={(e) => { if (e.target === e.currentTarget) setShowLogoutConfirm(false); }}
          >
            <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white shadow-lg shadow-slate-900/15">
              {/* Icon */}
              <div className="flex flex-col items-center px-6 pt-8 pb-4 text-center">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-100 text-amber-600">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6" aria-hidden="true">
                    <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
                  </svg>
                </div>
                <h2 className="mt-4 text-base font-semibold text-gray-900">Leaving so soon?</h2>
                <p className="mt-2 text-sm text-gray-600">
                  You&apos;re currently signed in. Would you like to sign out, or stay in the app?
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 border-t border-gray-200 p-5">
                <button
                  onClick={handleConfirmLogout}
                  disabled={logoutLoading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-rose-600/20 transition hover:bg-rose-700 focus:outline-none focus:ring-4 focus:ring-rose-600/20 disabled:opacity-60"
                >
                  {logoutLoading ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z" />
                      </svg>
                      Signing out…
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                        <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 0 1 5.25 2h5.5A2.25 2.25 0 0 1 13 4.25v2a.75.75 0 0 1-1.5 0v-2a.75.75 0 0 0-.75-.75h-5.5a.75.75 0 0 0-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 0 0 .75-.75v-2a.75.75 0 0 1 1.5 0v2A2.25 2.25 0 0 1 10.75 18h-5.5A2.25 2.25 0 0 1 3 15.75V4.25Z" clipRule="evenodd" />
                        <path fillRule="evenodd" d="M6 10a.75.75 0 0 1 .75-.75h9.546l-1.048-.943a.75.75 0 1 1 1.004-1.114l2.5 2.25a.75.75 0 0 1 0 1.114l-2.5 2.25a.75.75 0 1 1-1.004-1.114l1.048-.943H6.75A.75.75 0 0 1 6 10Z" clipRule="evenodd" />
                      </svg>
                      Yes, sign me out
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-indigo-600/15"
                >
                  Stay in app
                </button>
              </div>
            </div>
          </div>
        )}
      </body>
    </html>
  );
}
