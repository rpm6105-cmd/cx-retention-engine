"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { calculateHealth, riskFlag } from "@/lib/healthScore";
import { useCustomers } from "@/lib/useCustomers";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";

type Severity = "High" | "Medium" | "Low";
type AlertType = "Usage Drop" | "Low Engagement" | "High Risk" | "Medium Risk";

type Alert = {
  id: string;
  type: AlertType;
  customerId: string;
  customerName: string;
  description: string;
  severity: Severity;
  createdAt: string;
};

export default function AlertsPage() {
  const router = useRouter();
  const [customers] = useCustomers();
  const [severityFilter, setSeverityFilter] = useState<"All" | Severity>("All");
  const [typeFilter, setTypeFilter] = useState<"All" | AlertType>("All");
  const [modal, setModal] = useState<{ open: boolean; customerName?: string; alertType?: AlertType }>({
    open: false,
  });

  const alerts: Alert[] = useMemo(() => {
    const lowLoginsThreshold = 10;
    const highTicketsThreshold = 5;
    const lowActivityDaysThreshold = 7;

    const toSeverity = (risk: string): Severity =>
      risk.startsWith("High") ? "High" : risk.startsWith("Medium") ? "Medium" : "Low";

    const out: Alert[] = [];
    let n = 3000;

    for (const c of customers) {
      const score = Math.round(calculateHealth(c));
      const risk = riskFlag(score);
      const severity = toSeverity(risk);
      const daysSince = parseLastActivityDays(c.lastActivity);

      // Risk alerts derived directly from score thresholds
      if (score < 40) {
        out.push({
          id: `ALERT-${++n}`,
          type: "High Risk",
          customerId: c.id,
          customerName: c.name,
          description: `Health score is ${score}. Immediate follow-up recommended.`,
          severity,
          createdAt: c.lastActivity,
        });
      } else if (score < 70) {
        out.push({
          id: `ALERT-${++n}`,
          type: "Medium Risk",
          customerId: c.id,
          customerName: c.name,
          description: `Health score is ${score}. Monitor and take preventive action.`,
          severity,
          createdAt: c.lastActivity,
        });
      }

      // Usage drop signal
      if (c.logins_last_30_days < lowLoginsThreshold || c.support_tickets >= highTicketsThreshold) {
        const reasons: string[] = [];
        if (c.logins_last_30_days < lowLoginsThreshold) {
          reasons.push(`logins last 30d: ${c.logins_last_30_days}`);
        }
        if (c.support_tickets >= highTicketsThreshold) {
          reasons.push(`support tickets: ${c.support_tickets}`);
        }

        out.push({
          id: `ALERT-${++n}`,
          type: "Usage Drop",
          customerId: c.id,
          customerName: c.name,
          description: `Signal detected (${reasons.join(", ")}).`,
          severity,
          createdAt: c.lastActivity,
        });
      }

      // Low engagement signal
      if (Number.isFinite(daysSince) && daysSince >= lowActivityDaysThreshold) {
        out.push({
          id: `ALERT-${++n}`,
          type: "Low Engagement",
          customerId: c.id,
          customerName: c.name,
          description: `Recent activity is low (${daysSince}d since last activity).`,
          severity,
          createdAt: c.lastActivity,
        });
      }
    }

    return out;
  }, [customers]);

  const filtered = useMemo(() => {
    return alerts.filter((a) => {
      const sOk = severityFilter === "All" || a.severity === severityFilter;
      const tOk = typeFilter === "All" || a.type === typeFilter;
      return sOk && tOk;
    });
  }, [alerts, severityFilter, typeFilter]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white">
      <div className="mx-auto max-w-6xl space-y-6 px-1 py-2 sm:px-3 sm:py-6">
        <header className="rounded-2xl border border-gray-200 bg-white/80 p-4 shadow-sm backdrop-blur sm:p-5">
          <div className="flex flex-col gap-2">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
                Alerts
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Monitor customer risks and important signals
              </p>
            </div>
          </div>
        </header>

        <Card>
          <CardBody>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <div className="text-sm font-semibold text-gray-900">Filters</div>
                <span className="text-xs text-gray-500">
                  {filtered.length} alert{filtered.length === 1 ? "" : "s"}
                </span>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
                  <label className="text-xs font-semibold text-gray-700">
                    Severity
                  </label>
                  <select
                    value={severityFilter}
                    onChange={(e) =>
                      setSeverityFilter(e.target.value as typeof severityFilter)
                    }
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-900 shadow-sm outline-none focus:border-gray-300 focus:outline-none focus:ring-4 focus:ring-indigo-600/15 sm:w-48"
                  >
                    <option value="All">All</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
                  <label className="text-xs font-semibold text-gray-700">
                    Alert type
                  </label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-900 shadow-sm outline-none focus:border-gray-300 focus:outline-none focus:ring-4 focus:ring-indigo-600/15 sm:w-56"
                  >
                    <option value="All">All</option>
                    <option value="Usage Drop">Usage Drop</option>
                    <option value="Low Engagement">Low Engagement</option>
                    <option value="High Risk">High Risk</option>
                    <option value="Medium Risk">Medium Risk</option>
                  </select>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filtered.map((a) => (
            <div
              key={a.id}
              className={`rounded-2xl border bg-white p-4 shadow-sm shadow-gray-900/5 sm:p-5 ${
                a.severity === "High"
                  ? "border-rose-200 ring-1 ring-rose-600/10"
                  : "border-gray-200"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-sm font-semibold text-gray-900">
                      {a.type}
                    </div>
                    <Badge
                      tone={
                        a.severity === "High"
                          ? "danger"
                          : a.severity === "Medium"
                            ? "warning"
                            : "neutral"
                      }
                    >
                      {a.severity}
                    </Badge>
                  </div>

                  <div className="mt-2 text-sm text-gray-700">
                    <span className="font-semibold text-gray-900">
                      {a.customerName}
                    </span>{" "}
                    · {a.description}
                  </div>

                  <div className="mt-2 text-xs text-gray-500">
                    {a.id} · {a.createdAt}
                  </div>
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
                      d="M8.257 3.099c.765-1.36 2.721-1.36 3.486 0l6.1 10.845c.75 1.334-.214 3.006-1.743 3.006H3.9c-1.53 0-2.493-1.672-1.743-3.006l6.1-10.845ZM10 6a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V6.75A.75.75 0 0 1 10 6Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                <Button
                  variant="secondary"
                  onClick={() => setModal({ open: true, customerName: a.customerName, alertType: a.type })}
                >
                  Create Task
                </Button>
                <Button
                  variant="primary"
                  onMouseEnter={() => router.prefetch(`/customers/${a.customerId}`)}
                  onClick={() => router.push(`/customers/${a.customerId}`)}
                >
                  View Customer
                </Button>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-600 lg:col-span-2">
              No alerts match your filters.
            </div>
          )}
        </section>
      </div>

      {modal.open && (
        <CreateTaskModal
          customerName={modal.customerName ?? "Customer"}
          alertType={modal.alertType ?? "Usage Drop"}
          onClose={() => setModal({ open: false })}
        />
      )}
    </div>
  );
}

function CreateTaskModal({
  customerName,
  alertType,
  onClose,
}: {
  customerName: string;
  alertType: AlertType;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(`Follow up: ${alertType}`);
  const [dueDate, setDueDate] = useState("2026-03-21");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Create task"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-lg shadow-slate-900/15">
        <div className="flex items-start justify-between gap-3 border-b border-gray-200 p-4 sm:p-5">
          <div>
            <div className="text-sm font-semibold text-gray-900">Create task</div>
            <div className="mt-0.5 text-xs text-gray-600">
              For <span className="font-semibold text-gray-900">{customerName}</span>
            </div>
          </div>
          <button
            className="grid h-9 w-9 place-items-center rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-4 focus:ring-indigo-600/15"
            onClick={onClose}
            aria-label="Close"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M4.22 4.22a.75.75 0 0 1 1.06 0L10 8.94l4.72-4.72a.75.75 0 1 1 1.06 1.06L11.06 10l4.72 4.72a.75.75 0 1 1-1.06 1.06L10 11.06l-4.72 4.72a.75.75 0 1 1-1.06-1.06L8.94 10 4.22 5.28a.75.75 0 0 1 0-1.06Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700">Task name</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-900 shadow-sm outline-none placeholder:text-gray-400 focus:border-gray-300 focus:outline-none focus:ring-4 focus:ring-indigo-600/15"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700">Due date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-900 shadow-sm outline-none focus:border-gray-300 focus:outline-none focus:ring-4 focus:ring-indigo-600/15"
            />
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
            <span className="font-semibold">Preview:</span> {title} · {customerName} · Due{" "}
            {dueDate}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-gray-200 p-4 sm:p-5">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={onClose}>
            Create
          </Button>
        </div>
      </div>
    </div>
  );
}

function parseLastActivityDays(value: string): number {
  const v = value.trim().toLowerCase();
  if (v === "today") return 0;
  const m = v.match(/^(\d+)\s*d\s*ago$/);
  if (m) return Number(m[1]);
  return Number.POSITIVE_INFINITY;
}

 
