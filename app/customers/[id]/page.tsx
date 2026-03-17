"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { calculateHealth, riskFlag } from "@/lib/healthScore";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { useCustomers } from "@/lib/useCustomers";

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";

  const [customers] = useCustomers();
  const base = useMemo(() => customers.find((c) => c.id === id), [customers, id]);
  const customer = base ?? {
    id,
    name: `Customer ${id}`,
    plan: "Starter" as const,
    mrr: 499,
    lastActivity: "—",
    logins_last_30_days: 12,
    support_tickets: 2,
    plan_value: 499,
    usageTrend: [55, 57, 60, 62, 61, 64, 66, 68, 67, 70, 72, 71],
    tasks: [
      { id: "T-NEW-1", title: "Intro call", due: "Fri", status: "Open" as const },
      { id: "T-NEW-2", title: "Send onboarding checklist", due: "Mon", status: "Open" as const },
    ],
  };

  const arr = customer.mrr * 12;
  const healthScore = Math.round(calculateHealth(customer));
  const risk = riskFlag(healthScore);
  const riskLevel: "High" | "Medium" | "Low" = risk.startsWith("High")
    ? "High"
    : risk.startsWith("Medium")
      ? "Medium"
      : "Low";

  const breakdown = {
    usage: Math.round((clamp(customer.logins_last_30_days * 2, 0, 40) / 40) * 100),
    support: Math.round((clamp(customer.support_tickets * 5, 0, 30) / 30) * 100),
    engagement: Math.round((clamp(customer.plan_value / 50, 0, 30) / 30) * 100),
  };

  const riskIndicators = indicatorsForRisk(riskLevel);

  const daysSinceActivity = useMemo(
    () => parseLastActivityDays(customer.lastActivity),
    [customer.lastActivity],
  );

  const keyIssues = useMemo(() => {
    const issues: string[] = [];
    if (customer.logins_last_30_days < 10) {
      issues.push("Low usage");
    }
    if (customer.support_tickets >= 5) {
      issues.push("High support tickets");
    }
    if (Number.isFinite(daysSinceActivity) && daysSinceActivity >= 7) {
      issues.push("Recent inactivity");
    }
    return issues;
  }, [customer.logins_last_30_days, customer.support_tickets, daysSinceActivity]);

  const [copilotOutput, setCopilotOutput] = useState<string>(
    "Select an action to generate a summary, recommendation, or email draft.",
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white">
      <div className="mx-auto max-w-6xl space-y-6 px-1 py-2 sm:px-3 sm:py-6">
        <header className="rounded-2xl border border-gray-200 bg-white/80 p-4 shadow-sm backdrop-blur sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Customer
              </div>
              <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                <h1 className="truncate text-2xl font-semibold tracking-tight text-gray-900">
                  {customer.name}
                </h1>
                <Badge
                  tone={
                    healthScore < 40 ? "danger" : healthScore < 70 ? "warning" : "success"
                  }
                >
                  Health · {healthScore}
                </Badge>
                <Badge
                  tone={
                    riskLevel === "High"
                      ? "danger"
                      : riskLevel === "Medium"
                        ? "warning"
                        : "neutral"
                  }
                >
                  {risk}
                </Badge>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-gray-700">
                <MetaPill label="Plan" value={customer.plan} />
                <MetaPill label="MRR" value={`$${customer.mrr.toLocaleString()}/mo`} />
                <MetaPill label="ARR" value={`$${arr.toLocaleString()}/yr`} />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link href="/customers">
                <Button variant="secondary">Back</Button>
              </Link>
              <Button variant="primary">
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path d="M10.75 3.5a.75.75 0 0 0-1.5 0v5.75H3.5a.75.75 0 0 0 0 1.5h5.75v5.75a.75.75 0 0 0 1.5 0v-5.75h5.75a.75.75 0 0 0 0-1.5h-5.75V3.5Z" />
                </svg>
                Create task
              </Button>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <main className="space-y-6 lg:col-span-8">
            <Card>
              <CardBody>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">
                    Health Overview
                  </h2>
                  <p className="mt-0.5 text-xs text-gray-600">
                    Breakdown of signals contributing to the health score.
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Overall
                  </div>
                  <div className="mt-1 text-2xl font-semibold tabular-nums text-gray-900">
                    {healthScore}
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <MetricBar label="Usage" value={breakdown.usage} tone="neutral" />
                <MetricBar
                  label="Support"
                  value={breakdown.support}
                  tone={breakdown.support >= 70 ? "danger" : "warning"}
                />
                <MetricBar
                  label="Engagement"
                  value={breakdown.engagement}
                  tone={breakdown.engagement >= 70 ? "success" : "warning"}
                />
              </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Usage</h2>
                <p className="mt-0.5 text-xs text-gray-600">
                  Mock usage trend (last 12 weeks).
                </p>
              </div>

              <div className="mt-4 rounded-2xl border border-gray-200 bg-gradient-to-b from-gray-50 to-white p-4">
                <UsageSparkline values={customer.usageTrend} />
                <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
                  <span>12w ago</span>
                  <span>Today</span>
                </div>
              </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">
                  Risk Indicators
                </h2>
                <p className="mt-0.5 text-xs text-gray-600">
                  Drivers behind churn risk and required follow-ups.
                </p>
              </div>

              <div className="mt-4 space-y-3">
                {riskIndicators.map((r) => (
                  <div
                    key={r.title}
                    className="flex items-start justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-semibold text-gray-900">
                          {r.title}
                        </div>
                        <SeverityPill severity={r.severity} />
                      </div>
                      <div className="mt-1 text-sm text-gray-600">{r.detail}</div>
                    </div>
                    <div className="pt-0.5 text-gray-400">
                      <svg
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="h-5 w-5"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M7.21 14.77a.75.75 0 0 1 .02-1.06L10.94 10 7.23 6.29a.75.75 0 1 1 1.06-1.06l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.08-.02Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
              </CardBody>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="border-b border-gray-200">
                <h2 className="text-sm font-semibold text-gray-900">Tasks</h2>
                <p className="mt-0.5 text-xs text-gray-600">
                  Work items tied to this account.
                </p>
              </CardHeader>

              <div className="divide-y divide-gray-100">
                {customer.tasks.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between gap-3 px-4 py-4 transition-colors hover:bg-gray-50/70 sm:px-5"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-gray-900">
                        {t.title}
                      </div>
                      <div className="mt-0.5 text-xs text-gray-600">
                        Due {t.due}
                      </div>
                    </div>
                    <Badge tone={t.status === "Done" ? "success" : "neutral"}>
                      {t.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          </main>

          <aside className="lg:col-span-4">
            <div className="sticky top-4 space-y-4">
              <Card>
                <CardBody>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900">
                      AI Copilot
                    </h2>
                    <p className="mt-0.5 text-xs text-gray-600">
                      Quick actions for CS workflows.
                    </p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700 ring-1 ring-inset ring-gray-200">
                    Beta
                  </span>
                </div>

                <div className="mt-4 space-y-2">
                  <CopilotButton
                    label="Summarize account"
                    onClick={() => {
                      const issues =
                        keyIssues.length > 0 ? keyIssues.join(", ") : "No major issues detected";
                      const inactivity =
                        Number.isFinite(daysSinceActivity) && daysSinceActivity !== Number.POSITIVE_INFINITY
                          ? `${daysSinceActivity}d`
                          : "—";
                      setCopilotOutput(
                        [
                          `Summary for ${customer.name}`,
                          `- Health score: ${healthScore}`,
                          `- Risk level: ${risk}`,
                          `- Key issues: ${issues}`,
                          "",
                          "Key drivers",
                          `- Usage (logins last 30d): ${customer.logins_last_30_days}`,
                          `- Support tickets: ${customer.support_tickets}`,
                          `- Inactivity: ${inactivity} since last activity`,
                        ].join("\n"),
                      );
                    }}
                  />
                  <CopilotButton
                    label="Suggest next action"
                    onClick={() => {
                      const actions: string[] = [];

                      if (riskLevel === "High") {
                        actions.push("Schedule urgent check-in");
                      }
                      if (customer.support_tickets >= 5) {
                        actions.push("Review support issues");
                      }
                      if (customer.logins_last_30_days < 10) {
                        actions.push("Run adoption recovery plan");
                      }
                      if (Number.isFinite(daysSinceActivity) && daysSinceActivity >= 7) {
                        actions.push("Re-engage champion / stakeholders");
                      }

                      if (actions.length === 0) {
                        actions.push("Upsell / expansion opportunity");
                      } else if (riskLevel === "Medium") {
                        actions.push("Increase engagement (lightweight success plan)");
                      }

                      setCopilotOutput(
                        [
                          `Next actions (${risk})`,
                          ...actions.map((a) => `- ${a}`),
                        ].join("\n"),
                      );
                    }}
                  />
                  <CopilotButton
                    label="Draft email"
                    onClick={() => {
                      const status =
                        riskLevel === "High"
                          ? "we’re concerned about recent signals"
                          : riskLevel === "Medium"
                            ? "we’ve noticed a few signals worth addressing"
                            : "things are looking strong";
                      const suggested =
                        riskLevel === "High"
                          ? "schedule an urgent check-in and review open support issues"
                          : riskLevel === "Medium"
                            ? "set up a quick check-in to increase engagement"
                            : "discuss an expansion opportunity based on your usage";
                      const issuesLine =
                        keyIssues.length > 0
                          ? `Noted: ${keyIssues.join(", ")} (logins: ${customer.logins_last_30_days}, tickets: ${customer.support_tickets}).`
                          : `Signals: logins last 30d = ${customer.logins_last_30_days}, tickets = ${customer.support_tickets}.`;

                      setCopilotOutput(
                        [
                          `Subject: Quick check-in with ${customer.name}`,
                          "",
                          `Hi ${customer.name} team,`,
                          "",
                          `I wanted to reach out because ${status}. Your current health score is ${healthScore} (${risk}).`,
                          issuesLine,
                          "",
                          `Next step: Let’s ${suggested}.`,
                          "",
                          "Thanks,",
                          "Customer Success",
                        ]
                          .filter(Boolean)
                          .join("\n"),
                      );
                    }}
                  />
                </div>

                <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-3">
                  <div className="text-xs font-semibold text-gray-700">
                    Output
                  </div>
                  <pre className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                    {copilotOutput}
                  </pre>
                </div>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                <h3 className="text-sm font-semibold text-gray-900">
                  Account snapshot
                </h3>
                <div className="mt-3 space-y-2 text-sm text-gray-700">
                  <SnapshotRow label="Plan" value={customer.plan} />
                  <SnapshotRow label="MRR" value={`$${customer.mrr.toLocaleString()}`} />
                  <SnapshotRow label="ARR" value={`$${arr.toLocaleString()}`} />
                  <SnapshotRow label="Health" value={`${healthScore}`} />
                </div>
                </CardBody>
              </Card>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function MetricBar({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "neutral" | "warning" | "danger" | "success";
}) {
  const bars: Record<typeof tone, { fill: string; bg: string }> = {
    neutral: { fill: "bg-indigo-600", bg: "bg-indigo-100/70" },
    warning: { fill: "bg-amber-500", bg: "bg-amber-100" },
    danger: { fill: "bg-rose-500", bg: "bg-rose-100" },
    success: { fill: "bg-emerald-500", bg: "bg-emerald-100" },
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-gray-900">{label}</div>
        <div className="text-sm font-semibold tabular-nums text-gray-900">
          {value}
        </div>
      </div>
      <div className={`mt-3 h-2 w-full rounded-full ${bars[tone].bg}`}>
        <div
          className={`h-2 rounded-full ${bars[tone].fill}`}
          style={{ width: `${clamp(value, 0, 100)}%` }}
          aria-hidden="true"
        />
      </div>
      <div className="mt-2 text-xs text-gray-600">Score</div>
    </div>
  );
}

function UsageSparkline({ values }: { values: number[] }) {
  const safe = values.length >= 2 ? values : [0, 0];
  const max = Math.max(...safe, 1);
  const min = Math.min(...safe, 0);
  const range = Math.max(max - min, 1);

  const w = 560;
  const h = 120;
  const pad = 10;
  const innerW = w - pad * 2;
  const innerH = h - pad * 2;

  const points = safe
    .map((v, i) => {
      const x = pad + (innerW * i) / (safe.length - 1);
      const y = pad + innerH - ((v - min) / range) * innerH;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-gray-700">Weekly usage</div>
        <div className="text-xs text-gray-600">
          Avg{" "}
          <span className="font-semibold tabular-nums text-gray-900">
            {Math.round(safe.reduce((a, b) => a + b, 0) / safe.length)}
          </span>
        </div>
      </div>
      <svg
        className="mt-3 h-32 w-full"
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        role="img"
        aria-label="Usage trend"
      >
        <defs>
          <linearGradient id="usageFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(17 24 39)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="rgb(17 24 39)" stopOpacity="0" />
          </linearGradient>
        </defs>

        <path
          d={`M ${points.replaceAll(" ", " L ")} L ${w - pad},${h - pad} L ${pad},${h - pad} Z`}
          fill="url(#usageFill)"
        />
        <polyline
          points={points}
          fill="none"
          stroke="rgb(17 24 39)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function CopilotButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-left text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-indigo-600/15"
    >
      {label}
    </button>
  );
}

function SnapshotRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className="text-sm font-semibold text-gray-900">{value}</div>
    </div>
  );
}

function MetaPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-gray-50 px-3 py-1.5 text-sm ring-1 ring-inset ring-gray-200">
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </span>
      <span className="font-semibold text-gray-900">{value}</span>
    </div>
  );
}

function SeverityPill({ severity }: { severity: "low" | "medium" | "high" }) {
  const map: Record<typeof severity, { label: string; tone: "neutral" | "warning" | "danger" }> =
    {
      low: { label: "Low", tone: "neutral" },
      medium: { label: "Medium", tone: "warning" },
      high: { label: "High", tone: "danger" },
    };
  return <Badge tone={map[severity].tone}>{map[severity].label}</Badge>;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function parseLastActivityDays(value: string): number {
  const v = value.trim().toLowerCase();
  if (v === "today") return 0;
  const m = v.match(/^(\d+)\s*d\s*ago$/);
  if (m) return Number(m[1]);
  return Number.POSITIVE_INFINITY;
}

function indicatorsForRisk(riskLevel: "High" | "Medium" | "Low") {
  if (riskLevel === "High") {
    return [
      {
        title: "Low usage",
        detail: "Product activity is significantly below baseline; prioritize adoption recovery.",
        severity: "high" as const,
      },
      {
        title: "High support tickets",
        detail: "Ticket volume indicates friction; align on root cause and resolution plan.",
        severity: "high" as const,
      },
      {
        title: "Recent inactivity",
        detail: "Stakeholder engagement has dropped; schedule an urgent check-in.",
        severity: "medium" as const,
      },
    ];
  }

  if (riskLevel === "Medium") {
    return [
      {
        title: "Adoption dip",
        detail: "Usage is trending down; identify the workflow with the biggest drop-off.",
        severity: "medium" as const,
      },
      {
        title: "Support load",
        detail: "Moderate ticket volume; confirm SLA and prevent repeat issues.",
        severity: "medium" as const,
      },
      {
        title: "Engagement gaps",
        detail: "Stakeholder touches are inconsistent; propose a lightweight success plan.",
        severity: "low" as const,
      },
    ];
  }

  return [
    {
      title: "Strong usage",
      detail: "Usage levels are healthy and consistent across recent weeks.",
      severity: "low" as const,
    },
    {
      title: "Low support friction",
      detail: "Ticket volume is low; keep monitoring and share best practices.",
      severity: "low" as const,
    },
    {
      title: "Positive engagement",
      detail: "Engagement signals look stable; maintain cadence with periodic check-ins.",
      severity: "low" as const,
    },
  ];
}

 

