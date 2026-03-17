"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { calculateHealth, riskFlag } from "@/lib/healthScore";
import { useCustomers } from "@/lib/useCustomers";
import { useAssignments } from "@/lib/useAssignments";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";

export default function DashboardPage() {
  const router = useRouter();
  const [customers] = useCustomers();
  const [assignments, setAssignments] = useAssignments();

  const [assignModal, setAssignModal] = useState<{
    open: boolean;
    customerId?: string;
    customerName?: string;
  }>({ open: false });
  const [selectedCsm, setSelectedCsm] = useState("John");

  const [reportOpen, setReportOpen] = useState(false);

  const customersWithSignals = useMemo(() => {
    return customers.map((c) => {
      const score = Math.round(calculateHealth(c));
      const risk = riskFlag(score);
      const riskLevel: "High" | "Medium" | "Low" = risk.startsWith("High")
        ? "High"
        : risk.startsWith("Medium")
          ? "Medium"
          : "Low";
      return { ...c, healthScore: score, risk, riskLevel };
    });
  }, [customers]);

  const totalCustomers = customersWithSignals.length;
  const highRisk = customersWithSignals.filter((c) => c.riskLevel === "High").length;
  const mediumRisk = customersWithSignals.filter((c) => c.riskLevel === "Medium").length;
  const lowRisk = customersWithSignals.filter((c) => c.riskLevel === "Low").length;

  const atRisk = highRisk + mediumRisk;
  const healthy = lowRisk;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white">
      <div className="mx-auto max-w-6xl space-y-6 px-1 py-2 sm:px-3 sm:py-6">
        <header className="rounded-2xl border border-gray-200 bg-white/80 p-4 shadow-sm backdrop-blur sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
                Dashboard
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Overview of customer health and retention risk.
              </p>
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
              <div className="relative w-full sm:w-96">
                <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-4 w-4"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.5 3.5a5 5 0 1 0 3.846 8.19l2.732 2.732a.75.75 0 1 0 1.06-1.06l-2.732-2.732A5 5 0 0 0 8.5 3.5ZM5 8.5a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <input
                  placeholder="Search customers…"
                  className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-900 shadow-sm outline-none ring-0 placeholder:text-gray-400 focus:border-gray-300 focus:outline-none focus:ring-4 focus:ring-indigo-600/15"
                />
              </div>

              <Button variant="primary" onClick={() => setReportOpen(true)}>
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path d="M10.75 3.5a.75.75 0 0 0-1.5 0v5.75H3.5a.75.75 0 0 0 0 1.5h5.75v5.75a.75.75 0 0 0 1.5 0v-5.75h5.75a.75.75 0 0 0 0-1.5h-5.75V3.5Z" />
                </svg>
                Create report
              </Button>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <KpiCard
            title="Total Customers"
            value={totalCustomers}
            subtitle="Active accounts tracked"
            tone="neutral"
            icon={
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path d="M10 9a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm6.5 9a.75.75 0 0 1-.75-.75 4.75 4.75 0 0 0-9.5 0 .75.75 0 0 1-1.5 0 6.25 6.25 0 0 1 12.5 0 .75.75 0 0 1-.75.75Z" />
              </svg>
            }
          />
          <KpiCard
            title="At Risk"
            value={atRisk}
            subtitle="Needs attention this week"
            tone="danger"
            icon={
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
            }
          />
          <KpiCard
            title="Healthy"
            value={healthy}
            subtitle="Stable and engaged"
            tone="success"
            icon={
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M16.704 4.296a1 1 0 0 1 0 1.414l-7.5 7.5a1 1 0 0 1-1.414 0l-3.5-3.5a1 1 0 0 1 1.414-1.414l2.793 2.793 6.793-6.793a1 1 0 0 1 1.414 0Z"
                  clipRule="evenodd"
                />
              </svg>
            }
          />
        </section>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-col gap-3 border-b border-gray-200 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Customers</h2>
              <p className="mt-0.5 text-xs text-gray-600">
                Customer health overview with assignments.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm">
                Export
              </Button>
              <Button variant="secondary" size="sm">
                Filters
              </Button>
            </div>
          </CardHeader>

          <div className="max-h-[520px] overflow-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="sticky top-0 z-10 bg-gray-50/80 text-xs font-semibold tracking-wide text-gray-600 backdrop-blur">
                <tr>
                  <th scope="col" className="px-5 py-3.5">
                    Customer
                  </th>
                  <th scope="col" className="px-5 py-3.5">
                    Plan
                  </th>
                  <th scope="col" className="px-5 py-3.5">
                    MRR
                  </th>
                  <th scope="col" className="px-5 py-3.5">
                    Health
                  </th>
                  <th scope="col" className="px-5 py-3.5">
                    Risk
                  </th>
                  <th scope="col" className="px-5 py-3.5">
                    Last activity
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-right" aria-label="Actions" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customersWithSignals.map((c) => (
                  <tr key={c.id} className="group transition-colors hover:bg-gray-50/80">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-xs font-semibold text-white shadow-sm shadow-indigo-600/20 ring-1 ring-indigo-600/15">
                          {c.name
                            .split(" ")
                            .slice(0, 2)
                            .map((p) => p[0])
                            .join("")}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-medium text-gray-900">{c.name}</div>
                          <div className="text-xs text-gray-500">
                            {c.id}
                            {assignments[c.id] ? (
                              <span className="text-gray-400">
                                {" "}
                                · Assigned to {assignments[c.id]}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-700">{c.plan}</td>
                    <td className="px-5 py-4 whitespace-nowrap tabular-nums text-gray-900">
                      ${c.mrr.toLocaleString()}
                      <span className="text-gray-500">/mo</span>
                    </td>
                    <td className="px-5 py-4">
                      <Badge
                        tone={
                          c.healthScore < 40
                            ? "danger"
                            : c.healthScore < 70
                              ? "warning"
                              : "success"
                        }
                      >
                        {c.healthScore}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <Badge
                        tone={
                          c.riskLevel === "High"
                            ? "danger"
                            : c.riskLevel === "Medium"
                              ? "warning"
                              : "neutral"
                        }
                      >
                        {c.risk}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-gray-700">
                      {c.lastActivity}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex items-center justify-end gap-2">
                        <button
                          className="rounded-lg px-2 py-1 text-xs font-semibold text-gray-700 opacity-0 transition hover:bg-gray-100 hover:text-gray-900 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-4 focus:ring-indigo-600/15"
                          onClick={() => router.push(`/customers/${c.id}`)}
                        >
                          View
                        </button>
                        <button
                          className="rounded-lg px-2 py-1 text-xs font-semibold text-gray-700 opacity-0 transition hover:bg-gray-100 hover:text-gray-900 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-4 focus:ring-indigo-600/15"
                          onClick={() => {
                            setSelectedCsm(assignments[c.id] ?? "John");
                            setAssignModal({ open: true, customerId: c.id, customerName: c.name });
                          }}
                        >
                          Assign
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {assignModal.open && assignModal.customerId && (
        <AssignCsmModal
          customerName={assignModal.customerName ?? assignModal.customerId}
          value={selectedCsm}
          onChange={setSelectedCsm}
          onClose={() => setAssignModal({ open: false })}
          onSave={() => {
            setAssignments((prev) => ({ ...prev, [assignModal.customerId!]: selectedCsm }));
            setAssignModal({ open: false });
          }}
        />
      )}

      {reportOpen && (
        <ReportModal
          total={totalCustomers}
          high={highRisk}
          medium={mediumRisk}
          low={lowRisk}
          onClose={() => setReportOpen(false)}
        />
      )}
    </div>
  );
}

function KpiCard({
  title,
  value,
  subtitle,
  tone,
  icon,
}: {
  title: string;
  value: number;
  subtitle: string;
  tone: "neutral" | "danger" | "success";
  icon: React.ReactNode;
}) {
  const toneStyles: Record<
    typeof tone,
    { ring: string; icon: string; iconRing: string }
  > = {
    neutral: {
      ring: "ring-indigo-600/10",
      icon: "bg-indigo-600 text-white",
      iconRing: "ring-indigo-600/20",
    },
    danger: {
      ring: "ring-rose-600/10",
      icon: "bg-rose-600 text-white",
      iconRing: "ring-rose-600/20",
    },
    success: {
      ring: "ring-emerald-600/10",
      icon: "bg-emerald-600 text-white",
      iconRing: "ring-emerald-600/20",
    },
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm shadow-gray-900/5 ring-1 transition-shadow hover:shadow-md hover:shadow-gray-900/10 ${toneStyles[tone].ring}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-gray-700">{title}</div>
          <div className="mt-2 text-3xl font-semibold tracking-tight text-gray-900 tabular-nums">
            {value}
          </div>
          <div className="mt-1 text-xs text-gray-500">{subtitle}</div>
        </div>
        <div
          className={`rounded-2xl p-3 shadow-sm shadow-gray-900/10 ring-1 ${toneStyles[tone].icon} ${toneStyles[tone].iconRing}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function AssignCsmModal({
  customerName,
  value,
  onChange,
  onClose,
  onSave,
}: {
  customerName: string;
  value: string;
  onChange: (v: string) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const csms = ["John", "Sarah", "Alex"];
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Assign CSM"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-lg shadow-slate-900/15">
        <div className="border-b border-gray-200 p-4 sm:p-5">
          <div className="text-sm font-semibold text-gray-900">Assign CSM</div>
          <div className="mt-0.5 text-xs text-gray-600">{customerName}</div>
        </div>

        <div className="space-y-2 p-4 sm:p-5">
          <label className="text-xs font-semibold text-gray-700">CSM</label>
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-900 shadow-sm outline-none focus:border-gray-300 focus:outline-none focus:ring-4 focus:ring-indigo-600/15"
          >
            {csms.map((csm) => (
              <option key={csm} value={csm}>
                {csm}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-gray-200 p-4 sm:p-5">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={onSave}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

function ReportModal({
  total,
  high,
  medium,
  low,
  onClose,
}: {
  total: number;
  high: number;
  medium: number;
  low: number;
  onClose: () => void;
}) {
  const downloadCsv = () => {
    const rows = [
      ["Metric", "Count"],
      ["Total customers", String(total)],
      ["High risk accounts", String(high)],
      ["Medium risk accounts", String(medium)],
      ["Low risk accounts", String(low)],
    ];
    const csv = rows.map((r) => r.map(escapeCsv).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cx-report.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Create report"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-lg shadow-slate-900/15">
        <div className="border-b border-gray-200 p-4 sm:p-5">
          <div className="text-sm font-semibold text-gray-900">Report summary</div>
          <div className="mt-0.5 text-xs text-gray-600">
            Snapshot of current customer risk distribution.
          </div>
        </div>

        <div className="space-y-3 p-4 sm:p-5">
          <div className="grid grid-cols-2 gap-3">
            <SummaryRow label="Total customers" value={total} tone="neutral" />
            <SummaryRow label="High risk" value={high} tone="danger" />
            <SummaryRow label="Medium risk" value={medium} tone="warning" />
            <SummaryRow label="Low risk" value={low} tone="success" />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-gray-200 p-4 sm:p-5">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" onClick={downloadCsv}>
            Download Report (CSV)
          </Button>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "neutral" | "success" | "warning" | "danger";
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className="mt-2 flex items-center justify-between gap-3">
        <div className="text-2xl font-semibold tabular-nums text-gray-900">
          {value}
        </div>
        <Badge tone={tone}>{tone === "neutral" ? "Info" : tone}</Badge>
      </div>
    </div>
  );
}

function escapeCsv(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replaceAll('"', '""')}"`;
  return value;
}

