"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();
  const items = [
    { href: "/dashboard", label: "Dashboard", icon: DashboardIcon },
    { href: "/customers", label: "Customers", icon: UsersIcon },
    { href: "/tasks", label: "Tasks", icon: CheckIcon },
    { href: "/alerts", label: "Alerts", icon: BellIcon },
  ] as const;

  return (
    <aside className="sticky top-0 h-screen w-64 border-r border-white/10 bg-gradient-to-b from-slate-950 to-slate-900 px-4 py-6 text-white">
      <div className="flex items-center gap-3 px-2">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm shadow-indigo-500/30 ring-1 ring-white/10">
          <span className="text-sm font-extrabold">CX</span>
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">CX App</div>
          <div className="truncate text-xs text-white/60">Retention engine</div>
        </div>
      </div>

      <nav className="mt-8 space-y-1">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname?.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                active
                  ? "bg-white/10 text-white ring-1 ring-white/10"
                  : "text-white/80 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span
                className={`grid h-8 w-8 place-items-center rounded-lg transition ${
                  active ? "bg-indigo-500/20 text-indigo-200" : "text-white/70 group-hover:text-white"
                }`}
                aria-hidden="true"
              >
                <Icon />
              </span>
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-white/60">
          Workspace
        </div>
        <div className="mt-1 text-sm font-semibold">Customer Success</div>
        <div className="mt-2 text-xs text-white/60">
          Monitor risk, prioritize follow-ups, drive retention.
        </div>
      </div>
    </aside>
  );
}

function DashboardIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path d="M3 10a7 7 0 1 1 14 0v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5Zm7-4a.75.75 0 0 1 .75.75V10a.75.75 0 0 1-1.5 0V6.75A.75.75 0 0 1 10 6Z" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path d="M10 9a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm6.5 9a.75.75 0 0 1-.75-.75 4.75 4.75 0 0 0-9.5 0 .75.75 0 0 1-1.5 0 6.25 6.25 0 0 1 12.5 0 .75.75 0 0 1-.75.75Z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path
        fillRule="evenodd"
        d="M16.704 5.296a1 1 0 0 1 0 1.414l-7 7a1 1 0 0 1-1.414 0l-3-3A1 1 0 0 1 6.704 9.296l2.293 2.293 6.293-6.293a1 1 0 0 1 1.414 0Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path d="M10 18a2 2 0 0 0 2-2H8a2 2 0 0 0 2 2Zm6-5.5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1c0-.6.4-1.1 1-1.4V9a5 5 0 1 1 10 0v2.1c.6.3 1 .8 1 1.4Z" />
    </svg>
  );
}
