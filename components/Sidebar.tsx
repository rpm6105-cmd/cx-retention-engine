"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { logout } from "@/lib/auth";

const SIDEBAR_KEY = "cx.sidebar.collapsed";
const THEME_KEY = "cx.theme";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(SIDEBAR_KEY) === "true";
  });
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === "undefined") return false;
    const savedTheme = localStorage.getItem(THEME_KEY);
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return savedTheme === "dark" || (!savedTheme && prefersDark);
  });
  const [userName, setUserName] = useState("");
  const [userPlan, setUserPlan] = useState("Starter");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.classList.toggle("light", !isDark);
  }, [isDark]);

  // Load profile
  useEffect(() => {
    async function loadProfile() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("name, plan")
        .eq("id", session.user.id)
        .single();
      if (profile) { setUserName(profile.name); setUserPlan(profile.plan); }
    }
    loadProfile();
  }, []);

  function toggleCollapse() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(SIDEBAR_KEY, String(next));
  }

  function toggleTheme() {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem(THEME_KEY, next ? "dark" : "light");
    document.documentElement.classList.toggle("dark", next);
    document.documentElement.classList.toggle("light", !next);
  }

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  const items = [
    { href: "/dashboard", label: "Dashboard", icon: DashboardIcon },
    { href: "/customers", label: "Customers", icon: UsersIcon },
    { href: "/tasks", label: "Tasks", icon: CheckIcon },
    { href: "/alerts", label: "Alerts", icon: BellIcon },
  ] as const;

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo + collapse button */}
      <div className="flex items-center gap-3 px-2">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm shadow-indigo-500/30 ring-1 ring-white/10">
          <span className="text-sm font-extrabold">CX</span>
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">CX App</div>
            <div className="truncate text-xs text-white/60">Retention engine</div>
          </div>
        )}
        {/* Desktop collapse toggle */}
        <button
          className="hidden lg:grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition"
          onClick={toggleCollapse}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
            </svg>
          )}
        </button>
        {/* Mobile close button */}
        <button
          className="lg:hidden grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 0 1 1.414 0L10 8.586l4.293-4.293a1 1 0 1 1 1.414 1.414L11.414 10l4.293 4.293a1 1 0 0 1-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 0 1-1.414-1.414L8.586 10 4.293 5.707a1 1 0 0 1 0-1.414Z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Nav */}
      <nav className="mt-8 flex-1 space-y-1">
        {items.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              title={collapsed ? item.label : undefined}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition ${collapsed ? "justify-center" : ""} ${active ? "bg-white/10 text-white ring-1 ring-white/10" : "text-white/80 hover:bg-white/5 hover:text-white"}`}
            >
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg transition ${active ? "bg-indigo-500/20 text-indigo-200" : "text-white/70 group-hover:text-white"}`} aria-hidden="true">
                <Icon />
              </span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Workspace card — hidden when collapsed */}
      {!collapsed && (
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-white/60">Workspace</div>
          <div className="mt-1 text-sm font-semibold">Customer Success</div>
          <div className="mt-2 text-xs text-white/60">Monitor risk, prioritize follow-ups, drive retention.</div>
        </div>
      )}

      {/* Dark mode toggle */}
      <button
        onClick={toggleTheme}
        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        className={`mt-4 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/70 transition hover:bg-white/5 hover:text-white ${collapsed ? "justify-center" : ""}`}
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white/70">
          {isDark ? (
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M10 2a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 2ZM10 15a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 15ZM10 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM15.657 5.404a.75.75 0 1 0-1.06-1.06l-1.061 1.06a.75.75 0 0 0 1.06 1.06l1.06-1.06ZM6.464 14.596a.75.75 0 1 0-1.06-1.06l-1.06 1.06a.75.75 0 0 0 1.06 1.06l1.06-1.061ZM18 10a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 18 10ZM5 10a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 5 10ZM14.596 15.657a.75.75 0 0 0 1.06-1.06l-1.06-1.061a.75.75 0 1 0-1.06 1.06l1.06 1.061ZM5.404 6.464a.75.75 0 0 0 1.06-1.06l-1.06-1.06a.75.75 0 1 0-1.061 1.06l1.06 1.06Z" />
            </svg>
          ) : (
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" d="M7.455 2.004a.75.75 0 0 1 .26.77 7 7 0 0 0 9.958 7.967.75.75 0 0 1 1.067.853A8.5 8.5 0 1 1 6.647 1.921a.75.75 0 0 1 .808.083Z" clipRule="evenodd" />
            </svg>
          )}
        </span>
        {!collapsed && <span>{isDark ? "Light mode" : "Dark mode"}</span>}
      </button>

      {/* User card */}
      <div className={`mt-2 rounded-2xl border border-white/10 bg-white/5 p-3 ${collapsed ? "flex justify-center" : ""}`}>
        {collapsed ? (
          <button onClick={handleLogout} className="grid h-8 w-8 place-items-center rounded-lg text-white/50 transition hover:bg-white/10 hover:text-white" title="Sign out">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 0 1 5.25 2h5.5A2.25 2.25 0 0 1 13 4.25v2a.75.75 0 0 1-1.5 0v-2a.75.75 0 0 0-.75-.75h-5.5a.75.75 0 0 0-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 0 0 .75-.75v-2a.75.75 0 0 1 1.5 0v2A2.25 2.25 0 0 1 10.75 18h-5.5A2.25 2.25 0 0 1 3 15.75V4.25Z" clipRule="evenodd" /><path fillRule="evenodd" d="M6 10a.75.75 0 0 1 .75-.75h9.546l-1.048-.943a.75.75 0 1 1 1.004-1.114l2.5 2.25a.75.75 0 0 1 0 1.114l-2.5 2.25a.75.75 0 1 1-1.004-1.114l1.048-.943H6.75A.75.75 0 0 1 6 10Z" clipRule="evenodd" />
            </svg>
          </button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Link href="/profile" onClick={() => setMobileOpen(false)} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-indigo-500/20 text-xs font-semibold text-indigo-200 transition hover:bg-indigo-500/30" title="View profile">
                {userName ? userName.split(" ").slice(0, 2).map((p) => p[0]).join("") : "?"}
              </Link>
              <Link href="/profile" onClick={() => setMobileOpen(false)} className="min-w-0 flex-1 hover:opacity-80 transition">
                <div className="truncate text-xs font-semibold text-white">{userName || "User"}</div>
                <div className="truncate text-xs text-white/50">{userPlan}</div>
              </Link>
            </div>
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
              aria-label="Sign out"
              title="Sign out"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 0 1 5.25 2h5.5A2.25 2.25 0 0 1 13 4.25v2a.75.75 0 0 1-1.5 0v-2a.75.75 0 0 0-.75-.75h-5.5a.75.75 0 0 0-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 0 0 .75-.75v-2a.75.75 0 0 1 1.5 0v2A2.25 2.25 0 0 1 10.75 18h-5.5A2.25 2.25 0 0 1 3 15.75V4.25Z" clipRule="evenodd" />
                <path fillRule="evenodd" d="M6 10a.75.75 0 0 1 .75-.75h9.546l-1.048-.943a.75.75 0 1 1 1.004-1.114l2.5 2.25a.75.75 0 0 1 0 1.114l-2.5 2.25a.75.75 0 1 1-1.004-1.114l1.048-.943H6.75A.75.75 0 0 1 6 10Z" clipRule="evenodd" />
              </svg>
              <span>Sign out</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between border-b border-white/10 bg-slate-950 px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
            <span className="text-xs font-extrabold">CX</span>
          </div>
          <span className="text-sm font-semibold text-white">CX App</span>
        </div>
        <button className="grid h-9 w-9 place-items-center rounded-xl text-white/70 hover:bg-white/10 hover:text-white" onClick={() => setMobileOpen(true)} aria-label="Open menu">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
            <path fillRule="evenodd" d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75Zm0 10.5a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75ZM2 10a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 10Z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && <div className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} aria-hidden="true" />}

      {/* Mobile drawer */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 border-r border-white/10 bg-gradient-to-b from-slate-950 to-slate-900 px-4 py-6 text-white transition-transform duration-200 lg:hidden ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        {sidebarContent}
      </div>

      {/* Desktop sidebar */}
      <aside className={`sticky top-0 hidden h-screen shrink-0 border-r border-white/10 bg-gradient-to-b from-slate-950 to-slate-900 px-4 py-6 text-white transition-all duration-200 lg:block ${collapsed ? "w-20" : "w-64"}`}>
        {sidebarContent}
      </aside>

      {/* Mobile spacer */}
      <div className="h-14 lg:hidden" aria-hidden="true" />
    </>
  );
}

function DashboardIcon() { return <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path d="M3 10a7 7 0 1 1 14 0v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5Zm7-4a.75.75 0 0 1 .75.75V10a.75.75 0 0 1-1.5 0V6.75A.75.75 0 0 1 10 6Z" /></svg>; }
function UsersIcon() { return <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path d="M10 9a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm6.5 9a.75.75 0 0 1-.75-.75 4.75 4.75 0 0 0-9.5 0 .75.75 0 0 1-1.5 0 6.25 6.25 0 0 1 12.5 0 .75.75 0 0 1-.75.75Z" /></svg>; }
function CheckIcon() { return <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path fillRule="evenodd" d="M16.704 5.296a1 1 0 0 1 0 1.414l-7 7a1 1 0 0 1-1.414 0l-3-3A1 1 0 0 1 6.704 9.296l2.293 2.293 6.293-6.293a1 1 0 0 1 1.414 0Z" clipRule="evenodd" /></svg>; }
function BellIcon() { return <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path d="M10 18a2 2 0 0 0 2-2H8a2 2 0 0 0 2 2Zm6-5.5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1c0-.6.4-1.1 1-1.4V9a5 5 0 1 1 10 0v2.1c.6.3 1 .8 1 1.4Z" /></svg>; }
