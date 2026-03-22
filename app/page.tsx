"use client";

import Link from "next/link";
export default function LandingPage() {
  const plans = [
    {
      name: "Starter",
      description: "Perfect for small CS teams getting started.",
      features: [
        "Up to 50 customers",
        "Health score tracking",
        "Basic risk alerts",
        "Task management",
        "Email support",
      ],
      tone: "neutral" as const,
      cta: "Get started",
    },
    {
      name: "Pro",
      description: "For growing teams that need deeper insights.",
      features: [
        "Up to 500 customers",
        "Advanced health scoring",
        "AI Copilot actions",
        "CSM assignments",
        "Priority support",
      ],
      tone: "primary" as const,
      cta: "Start free trial",
    },
    {
      name: "Business",
      description: "Enterprise-grade retention at scale.",
      features: [
        "Unlimited customers",
        "Custom health models",
        "Full AI Copilot suite",
        "Advanced analytics",
        "Dedicated CSM",
      ],
      tone: "neutral" as const,
      cta: "Contact sales",
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-gray-200 bg-white/80 px-6 py-4 backdrop-blur dark:border-white/10 dark:bg-slate-950/80">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm shadow-indigo-500/30 ring-1 ring-white/10">
            <span className="text-sm font-extrabold">CX</span>
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white">CX App</div>
            <div className="text-xs text-gray-500 dark:text-white/60">Retention engine</div>
          </div>
        </div>
        <div className="hidden items-center gap-6 sm:flex">
          <a href="#features" className="text-sm font-semibold text-gray-600 transition hover:text-gray-900 dark:text-white/70 dark:hover:text-white">Features</a>
          <a href="#pricing" className="text-sm font-semibold text-gray-600 transition hover:text-gray-900 dark:text-white/70 dark:hover:text-white">Pricing</a>
          <a href="#about" className="text-sm font-semibold text-gray-600 transition hover:text-gray-900 dark:text-white/70 dark:hover:text-white">About</a>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login" className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-indigo-600/15 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10">
            Log in
          </Link>
          <Link href="/login" className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-600/20">
            Get started
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="mx-auto max-w-5xl px-6 pb-20 pt-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
          Now with AI Copilot
        </div>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-5xl lg:text-6xl">
          Retain customers.<br />
          <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            Before it&apos;s too late.
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 dark:text-white/60">
          CX App gives your customer success team real-time health scores, churn risk signals, and AI-powered actions — so you can focus on the right customers at the right time.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/login" className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-600/20">
            Start for free
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" /></svg>
          </Link>
          <Link href="/dashboard" className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-900 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-indigo-600/15 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10">
            View live demo
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { value: "94%", label: "Retention rate improvement" },
            { value: "3×", label: "Faster churn detection" },
            { value: "2 hrs", label: "Saved per CSM per day" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm shadow-gray-900/5 dark:border-white/10 dark:bg-white/5">
              <div className="text-3xl font-semibold tabular-nums tracking-tight text-gray-900 dark:text-white">{stat.value}</div>
              <div className="mt-1 text-sm text-gray-500 dark:text-white/60">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="border-t border-gray-200 bg-gray-50 py-20 dark:border-white/10 dark:bg-slate-900/50">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center">
            <div className="text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">Features</div>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-4xl">Everything your CS team needs</h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-gray-600 dark:text-white/60">From health scoring to AI-powered email drafts — CX App covers the full retention workflow in one place.</p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5"><path d="M10 9a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm6.5 9a.75.75 0 0 1-.75-.75 4.75 4.75 0 0 0-9.5 0 .75.75 0 0 1-1.5 0 6.25 6.25 0 0 1 12.5 0 .75.75 0 0 1-.75.75Z" /></svg>, title: "Health Scoring", description: "Automatic health scores based on usage, support tickets, and engagement signals — updated in real time." },
              { icon: <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.721-1.36 3.486 0l6.1 10.845c.75 1.334-.214 3.006-1.743 3.006H3.9c-1.53 0-2.493-1.672-1.743-3.006l6.1-10.845ZM10 6a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V6.75A.75.75 0 0 1 10 6Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" /></svg>, title: "Churn Risk Alerts", description: "Get notified when a customer shows early churn signals so your team can intervene before it's too late." },
              { icon: <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5"><path d="M3 10a7 7 0 1 1 14 0v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5Zm7-4a.75.75 0 0 1 .75.75V10a.75.75 0 0 1-1.5 0V6.75A.75.75 0 0 1 10 6Z" /></svg>, title: "AI Copilot", description: "Summarize accounts, suggest next actions, and draft outreach emails — all powered by AI in one click." },
              { icon: <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5"><path fillRule="evenodd" d="M16.704 4.296a1 1 0 0 1 0 1.414l-7.5 7.5a1 1 0 0 1-1.414 0l-3.5-3.5a1 1 0 0 1 1.414-1.414l2.793 2.793 6.793-6.793a1 1 0 0 1 1.414 0Z" clipRule="evenodd" /></svg>, title: "Task Management", description: "Assign and track follow-up tasks per customer account so nothing falls through the cracks." },
              { icon: <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5"><path d="M10 18a2 2 0 0 0 2-2H8a2 2 0 0 0 2 2Zm6-5.5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1c0-.6.4-1.1 1-1.4V9a5 5 0 1 1 10 0v2.1c.6.3 1 .8 1 1.4Z" /></svg>, title: "Smart Alerts", description: "Configurable alerts for inactivity, high ticket volume, and MRR changes — delivered where your team works." },
              { icon: <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5"><path fillRule="evenodd" d="M3 3.5A1.5 1.5 0 0 1 4.5 2h6.879a1.5 1.5 0 0 1 1.06.44l4.122 4.12A1.5 1.5 0 0 1 17 7.622V16.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 3 16.5v-13Zm10.857 5.857a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 0 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" /></svg>, title: "Retention Reports", description: "Export CSV reports with risk distribution summaries to share with leadership in seconds." },
            ].map((feature) => (
              <div key={feature.title} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm shadow-gray-900/5 dark:border-white/10 dark:bg-white/5">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-600/20 ring-1 ring-indigo-600/20">{feature.icon}</div>
                <div className="mt-4 text-sm font-semibold text-gray-900 dark:text-white">{feature.title}</div>
                <div className="mt-1 text-sm text-gray-600 dark:text-white/60">{feature.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center">
            <div className="text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">How it works</div>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-4xl">Up and running in minutes</h2>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              { step: "01", title: "Connect your data", description: "Sync your CRM or import customers via CSV. Health scores are calculated automatically." },
              { step: "02", title: "Monitor risk signals", description: "The dashboard surfaces at-risk accounts in real time — no manual tracking required." },
              { step: "03", title: "Act with AI", description: "Use the AI Copilot to draft emails, suggest next steps, and close the loop faster." },
            ].map((item) => (
              <div key={item.step} className="relative rounded-2xl border border-gray-200 bg-white p-5 shadow-sm shadow-gray-900/5 dark:border-white/10 dark:bg-white/5">
                <div className="text-3xl font-semibold tabular-nums tracking-tight text-indigo-100 dark:text-indigo-900">{item.step}</div>
                <div className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">{item.title}</div>
                <div className="mt-1 text-sm text-gray-600 dark:text-white/60">{item.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="border-t border-gray-200 bg-gray-50 py-20 dark:border-white/10 dark:bg-slate-900/50">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center">
            <div className="text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">Pricing</div>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-4xl">Simple, transparent pricing</h2>
            <p className="mt-4 text-base text-gray-600 dark:text-white/60">Start free. Scale as your team grows.</p>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {plans.map((plan) => (
              <div key={plan.name} className={`relative rounded-2xl border bg-white p-6 shadow-sm dark:bg-white/5 ${plan.tone === "primary" ? "border-indigo-600 shadow-indigo-600/10 ring-1 ring-indigo-600/20 dark:border-indigo-500 dark:ring-indigo-500/20" : "border-gray-200 shadow-gray-900/5 dark:border-white/10"}`}>
                {plan.tone === "primary" && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white shadow-sm shadow-indigo-600/20">Most popular</span>
                  </div>
                )}
                <div className="text-sm font-semibold text-gray-900 dark:text-white">{plan.name}</div>
                <div className="mt-3 flex items-end gap-1">
                  <span className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">Coming Soon</span>
                </div>
                <div className="mt-1 text-xs text-gray-500 dark:text-white/60">{plan.description}</div>
                <Link href="/login" className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm transition focus:outline-none focus:ring-4 ${plan.tone === "primary" ? "bg-indigo-600 text-white shadow-indigo-600/20 hover:bg-indigo-700 focus:ring-indigo-600/20" : "border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 focus:ring-indigo-600/15 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"}`}>
                  {plan.cta}
                </Link>
                <ul className="mt-5 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600 dark:text-white/60">
                      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400"><path fillRule="evenodd" d="M16.704 4.296a1 1 0 0 1 0 1.414l-7.5 7.5a1 1 0 0 1-1.414 0l-3.5-3.5a1 1 0 0 1 1.414-1.414l2.793 2.793 6.793-6.793a1 1 0 0 1 1.414 0Z" clipRule="evenodd" /></svg>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── About ── */}
      <section id="about" className="py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">About</div>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-4xl">Built for customer success teams</h2>
              <p className="mt-4 text-base text-gray-600 dark:text-white/60">CX App was built by a team that experienced churn the hard way. We spent years watching customers silently disengage while our CS teams scrambled to react. So we built the tool we always wished we had.</p>
              <p className="mt-4 text-base text-gray-600 dark:text-white/60">Our mission is simple: give every customer success team the clarity and speed to retain customers before they decide to leave.</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/login" className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-600/20">Get started free</Link>
                <Link href="/dashboard" className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-900 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-indigo-600/15 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10">Explore the app</Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: "500+", label: "CS teams using CX App" },
                { value: "12M+", label: "Customers tracked" },
                { value: "98%", label: "Uptime SLA" },
                { value: "4.9★", label: "Average rating" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm shadow-gray-900/5 dark:border-white/10 dark:bg-white/5">
                  <div className="text-2xl font-semibold tabular-nums tracking-tight text-gray-900 dark:text-white">{stat.value}</div>
                  <div className="mt-1 text-xs text-gray-500 dark:text-white/60">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-200 py-8 dark:border-white/10">
        <div className="mx-auto max-w-5xl px-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-3">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
              <span className="text-xs font-extrabold">CX</span>
            </div>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">CX App</span>
          </div>
          <div className="text-xs text-gray-500 dark:text-white/40">© 2026 CX App. All rights reserved.</div>
          <div className="flex items-center gap-4">
            <a href="#features" className="text-xs text-gray-500 transition hover:text-gray-900 dark:text-white/40 dark:hover:text-white">Features</a>
            <a href="#pricing" className="text-xs text-gray-500 transition hover:text-gray-900 dark:text-white/40 dark:hover:text-white">Pricing</a>
            <a href="#about" className="text-xs text-gray-500 transition hover:text-gray-900 dark:text-white/40 dark:hover:text-white">About</a>
            <Link href="/login" className="text-xs text-gray-500 transition hover:text-gray-900 dark:text-white/40 dark:hover:text-white">Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
