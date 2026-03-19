"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { calculateHealth, riskFlag } from "@/lib/healthScore";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { usePlan } from "@/lib/usePlan";
import type { CustomerRow } from "@/lib/customersData";
import {
  buildRetentionTemplateCsv,
  getCompanyUsers,
  getWorkspaceProfile,
  loadAssignments,
  loadWorkspaceCustomers,
  saveAssignments,
  type AssignmentMap,
  type WorkspaceProfile,
} from "@/lib/workspace";
import type { Profile } from "@/lib/auth";
import { buildCopilotCsv } from "@/lib/copilotBridge";

const COPILOT_URL = process.env.NEXT_PUBLIC_COPILOT_URL ?? "https://customer-success-ai-copilot.streamlit.app";

type CustomerWithSignals = CustomerRow & {
  healthScore: number;
  risk: string;
  riskLevel: "High" | "Medium" | "Low";
};

export default function DashboardPage() {
  const router = useRouter();
  const { canExport } = usePlan();
  const [profile, setProfile] = useState<WorkspaceProfile | null>(null);
  const [users, setUsers] = useState<Profile[]>([]);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [assignments, setAssignments] = useState<AssignmentMap>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [exportFeedback, setExportFeedback] = useState("");
  const [assignModal, setAssignModal] = useState<{
    open: boolean;
    customerId?: string;
    customerName?: string;
  }>({ open: false });
  const [selectedCsm, setSelectedCsm] = useState("");

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      const workspaceProfile = await getWorkspaceProfile();
      if (!workspaceProfile) {
        router.replace("/login");
        return;
      }

      const [workspaceCustomers, workspaceAssignments, companyUsers] = await Promise.all([
        loadWorkspaceCustomers(workspaceProfile),
        loadAssignments(workspaceProfile),
        getCompanyUsers(workspaceProfile),
      ]);

      if (!active) return;
      setProfile(workspaceProfile);
      setCustomers(workspaceCustomers);
      setAssignments(workspaceAssignments);
      setUsers(companyUsers);
      setLoading(false);
    }

    bootstrap();
    return () => {
      active = false;
    };
  }, [router]);

  const customersWithSignals = useMemo<CustomerWithSignals[]>(() => {
    return customers.map((customer) => {
      const score = Math.round(customer.healthScore ?? calculateHealth(customer));
      const risk = customer.churnRisk ?? riskFlag(score);
      const riskLevel: "High" | "Medium" | "Low" = risk.startsWith("High")
        ? "High"
        : risk.startsWith("Medium")
          ? "Medium"
          : "Low";
      return { ...customer, healthScore: score, risk, riskLevel };
    });
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return customersWithSignals;
    return customersWithSignals.filter((customer) => {
      const assignedLabel = assignmentLabel(customer.id, assignments, users).toLowerCase();
      return [customer.name, customer.id, customer.plan, customer.lastActivity, assignedLabel]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [assignments, customersWithSignals, search, users]);

  const totalCustomers = filteredCustomers.length;
  const highRisk = filteredCustomers.filter((c) => c.riskLevel === "High").length;
  const mediumRisk = filteredCustomers.filter((c) => c.riskLevel === "Medium").length;
  const lowRisk = filteredCustomers.filter((c) => c.riskLevel === "Low").length;
  const atRisk = highRisk + mediumRisk;
  const healthy = lowRisk;

  const csmOptions = useMemo(() => {
    return users
      .filter((user) => !user.is_owner)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [users]);

  function downloadTemplate() {
    const blob = new Blob([buildRetentionTemplateCsv()], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "cx-retention-master-template.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function downloadCopilotFeed() {
    if (!canExport) return;
    const csv = buildCopilotCsv(filteredCustomers, assignments, users);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "customer-success-ai-copilot-feed.csv";
    anchor.click();
    URL.revokeObjectURL(url);
    setExportFeedback("AI Copilot feed downloaded.");
    window.setTimeout(() => setExportFeedback(""), 3000);
  }

  async function handleAssignmentSave() {
    if (!profile || !assignModal.customerId || !selectedCsm) {
      setAssignModal({ open: false });
      return;
    }

    const nextAssignments = {
      ...assignments,
      [assignModal.customerId]: selectedCsm,
    };

    await saveAssignments(profile, nextAssignments);
    setAssignments(nextAssignments);
    setAssignModal({ open: false });
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 via-white to-white">
        <svg className="h-5 w-5 animate-spin text-indigo-600" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z" />
        </svg>
      </div>
    );
  }

  if (customers.length === 0) {
    const isAdmin = profile?.is_owner;

    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white">
        <div className="mx-auto max-w-6xl space-y-6 px-1 py-2 sm:px-3 sm:py-6">
          <header className="rounded-2xl border border-gray-200 bg-white/80 p-4 shadow-sm backdrop-blur sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Dashboard</h1>
                <p className="mt-1 text-sm text-gray-600">Overview of customer health and retention risk.</p>
              </div>
            </div>
          </header>

          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm shadow-gray-900/5">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm shadow-indigo-500/30">
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-8 w-8" aria-hidden="true">
                <path d="M10 9a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm6.5 9a.75.75 0 0 1-.75-.75 4.75 4.75 0 0 0-9.5 0 .75.75 0 0 1-1.5 0 6.25 6.25 0 0 1 12.5 0 .75.75 0 0 1-.75.75Z" />
              </svg>
            </div>
            <h2 className="mt-5 text-lg font-semibold text-gray-900">
              {isAdmin ? "Upload your company master dataset" : "No assigned customers yet"}
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-gray-600">
              {isAdmin
                ? "Start the shared workspace by uploading the company master CSV from the Admin page. Once it lands, assignments, dashboards, and Copilot exports will all use the same company dataset."
                : "Your company master dataset is either still empty or your accounts have not been assigned yet. Once an admin uploads the company CSV and assigns customers, your dashboard will populate automatically."}
            </p>

            <div className="mx-auto mt-8 flex max-w-xl flex-col items-center justify-center gap-3 sm:flex-row">
              {isAdmin ? (
                <>
                  <Button variant="primary" onClick={() => router.push("/admin")}>Open Admin Panel</Button>
                  <Button variant="secondary" onClick={downloadTemplate}>Download master CSV template</Button>
                </>
              ) : (
                <Button variant="secondary" onClick={() => router.push("/profile")}>Open profile</Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white">
      <div className="mx-auto max-w-6xl space-y-6 px-1 py-2 sm:px-3 sm:py-6">
        <header className="rounded-2xl border border-gray-200 bg-white/80 p-4 shadow-sm backdrop-blur sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Dashboard</h1>
              <p className="mt-1 text-sm text-gray-600">Shared company view of customer health, retention risk, and AI handoff readiness.</p>
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
              <div className="relative w-full sm:w-96">
                <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                    <path fillRule="evenodd" d="M8.5 3.5a5 5 0 1 0 3.846 8.19l2.732 2.732a.75.75 0 1 0 1.06-1.06l-2.732-2.732A5 5 0 0 0 8.5 3.5ZM5 8.5a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0Z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  placeholder="Search customers or owners…"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-900 shadow-sm outline-none ring-0 placeholder:text-gray-400 focus:border-gray-300 focus:outline-none focus:ring-4 focus:ring-indigo-600/15"
                />
              </div>
              <Button variant="secondary" onClick={() => window.open(COPILOT_URL, "_blank", "noopener,noreferrer")}>Open AI Copilot</Button>
              <Button variant="primary" onClick={() => setReportOpen(true)}>Create report</Button>
            </div>
          </div>
        </header>

        {exportFeedback && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            {exportFeedback}
          </div>
        )}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <KpiCard title="Total Customers" value={totalCustomers} subtitle="Active accounts in current scope" tone="neutral"
            icon={<svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5"><path d="M10 9a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm6.5 9a.75.75 0 0 1-.75-.75 4.75 4.75 0 0 0-9.5 0 .75.75 0 0 1-1.5 0 6.25 6.25 0 0 1 12.5 0 .75.75 0 0 1-.75.75Z" /></svg>}
          />
          <KpiCard title="At Risk" value={atRisk} subtitle="High + medium risk accounts" tone="danger"
            icon={<svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.721-1.36 3.486 0l6.1 10.845c.75 1.334-.214 3.006-1.743 3.006H3.9c-1.53 0-2.493-1.672-1.743-3.006l6.1-10.845ZM10 6a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V6.75A.75.75 0 0 1 10 6Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" /></svg>}
          />
          <KpiCard title="Healthy" value={healthy} subtitle="Low risk accounts" tone="success"
            icon={<svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5"><path fillRule="evenodd" d="M16.704 4.296a1 1 0 0 1 0 1.414l-7.5 7.5a1 1 0 0 1-1.414 0l-3.5-3.5a1 1 0 0 1 1.414-1.414l2.793 2.793 6.793-6.793a1 1 0 0 1 1.414 0Z" clipRule="evenodd" /></svg>}
          />
        </section>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-col gap-3 border-b border-gray-200 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Customers</h2>
              <p className="mt-0.5 text-xs text-gray-600">Company portfolio with assignment-aware retention signals.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {canExport ? (
                <Button variant="secondary" size="sm" onClick={downloadCopilotFeed}>Download AI Copilot feed</Button>
              ) : (
                <div className="group relative">
                  <Button variant="secondary" size="sm" disabled className="cursor-not-allowed opacity-50">Download AI Copilot feed</Button>
                  <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-lg opacity-0 transition group-hover:opacity-100">
                    Upgrade to Pro to export shared data
                  </div>
                </div>
              )}
              <Button variant="secondary" size="sm" onClick={downloadTemplate}>Template</Button>
            </div>
          </CardHeader>

          <div className="max-h-[520px] overflow-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="sticky top-0 z-10 bg-gray-50/80 text-xs font-semibold tracking-wide text-gray-600 backdrop-blur">
                <tr>
                  <th scope="col" className="px-5 py-3.5">Customer</th>
                  <th scope="col" className="px-5 py-3.5">Plan</th>
                  <th scope="col" className="px-5 py-3.5">ARR</th>
                  <th scope="col" className="px-5 py-3.5">Health</th>
                  <th scope="col" className="px-5 py-3.5">Risk</th>
                  <th scope="col" className="px-5 py-3.5">Assigned owner</th>
                  <th scope="col" className="px-5 py-3.5 text-right" aria-label="Actions" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="group transition-colors hover:bg-gray-50/80">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-xs font-semibold text-white shadow-sm shadow-indigo-600/20 ring-1 ring-indigo-600/15">
                          {customer.name.split(" ").slice(0, 2).map((part) => part[0]).join("")}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-medium text-gray-900">{customer.name}</div>
                          <div className="text-xs text-gray-500">{customer.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-700">{customer.plan}</td>
                    <td className="px-5 py-4 whitespace-nowrap tabular-nums text-gray-900">
                      ${(customer.arr ?? customer.mrr * 12).toLocaleString()}
                      <span className="text-gray-500">/yr</span>
                    </td>
                    <td className="px-5 py-4">
                      <Badge tone={customer.healthScore < 40 ? "danger" : customer.healthScore < 70 ? "warning" : "success"}>{customer.healthScore}</Badge>
                    </td>
                    <td className="px-5 py-4">
                      <Badge tone={customer.riskLevel === "High" ? "danger" : customer.riskLevel === "Medium" ? "warning" : "neutral"}>{customer.risk}</Badge>
                    </td>
                    <td className="px-5 py-4 text-gray-700">{assignmentLabel(customer.id, assignments, users)}</td>
                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex items-center justify-end gap-2">
                        <button className="rounded-lg px-2 py-1 text-xs font-semibold text-gray-700 opacity-0 transition hover:bg-gray-100 hover:text-gray-900 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-4 focus:ring-indigo-600/15" onClick={() => router.push(`/customers/${customer.id}`)}>View</button>
                        {profile?.is_owner && (
                          <button
                            className="rounded-lg px-2 py-1 text-xs font-semibold text-gray-700 opacity-0 transition hover:bg-gray-100 hover:text-gray-900 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-4 focus:ring-indigo-600/15"
                            onClick={() => {
                              const currentAssignment = assignments[customer.id];
                              setSelectedCsm(currentAssignment || csmOptions[0]?.id || "");
                              setAssignModal({ open: true, customerId: customer.id, customerName: customer.name });
                            }}
                          >
                            Assign
                          </button>
                        )}
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
          csms={csmOptions}
          onChange={setSelectedCsm}
          onClose={() => setAssignModal({ open: false })}
          onSave={handleAssignmentSave}
        />
      )}

      {reportOpen && (
        <ReportModal total={totalCustomers} high={highRisk} medium={mediumRisk} low={lowRisk} onClose={() => setReportOpen(false)} />
      )}
    </div>
  );
}

function assignmentLabel(customerId: string, assignments: AssignmentMap, users: Profile[]) {
  const assigned = assignments[customerId];
  if (!assigned) return "Unassigned";
  const matched = users.find((user) => user.id === assigned || user.email === assigned || user.name === assigned);
  return matched?.name || matched?.email || assigned;
}

function KpiCard({ title, value, subtitle, tone, icon }: { title: string; value: number; subtitle: string; tone: "neutral" | "danger" | "success"; icon: React.ReactNode }) {
  const toneStyles = {
    neutral: { ring: "ring-indigo-600/10", icon: "bg-indigo-600 text-white", iconRing: "ring-indigo-600/20" },
    danger: { ring: "ring-rose-600/10", icon: "bg-rose-600 text-white", iconRing: "ring-rose-600/20" },
    success: { ring: "ring-emerald-600/10", icon: "bg-emerald-600 text-white", iconRing: "ring-emerald-600/20" },
  };
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm shadow-gray-900/5 ring-1 transition-shadow hover:shadow-md hover:shadow-gray-900/10 ${toneStyles[tone].ring}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-gray-700">{title}</div>
          <div className="mt-2 text-3xl font-semibold tracking-tight text-gray-900 tabular-nums">{value}</div>
          <div className="mt-1 text-xs text-gray-500">{subtitle}</div>
        </div>
        <div className={`rounded-2xl p-3 shadow-sm shadow-gray-900/10 ring-1 ${toneStyles[tone].icon} ${toneStyles[tone].iconRing}`}>{icon}</div>
      </div>
    </div>
  );
}

function AssignCsmModal({
  customerName,
  value,
  csms,
  onChange,
  onClose,
  onSave,
}: {
  customerName: string;
  value: string;
  csms: Profile[];
  onChange: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-lg shadow-slate-900/15">
        <div className="border-b border-gray-200 p-4 sm:p-5">
          <div className="text-sm font-semibold text-gray-900">Assign CSM</div>
          <div className="mt-0.5 text-xs text-gray-600">{customerName}</div>
        </div>
        <div className="space-y-2 p-4 sm:p-5">
          <label className="text-xs font-semibold text-gray-700">CSM</label>
          <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-900 shadow-sm outline-none focus:border-gray-300 focus:outline-none focus:ring-4 focus:ring-indigo-600/15">
            {csms.length === 0 ? (
              <option value="">No approved CSM users</option>
            ) : (
              csms.map((csm) => (
                <option key={csm.id} value={csm.id}>{csm.name} · {csm.email}</option>
              ))
            )}
          </select>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-gray-200 p-4 sm:p-5">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={onSave} disabled={!value}>Save</Button>
        </div>
      </div>
    </div>
  );
}

function ReportModal({ total, high, medium, low, onClose }: { total: number; high: number; medium: number; low: number; onClose: () => void }) {
  const downloadCsv = () => {
    const rows = [["Metric", "Count"], ["Total customers", String(total)], ["High risk accounts", String(high)], ["Medium risk accounts", String(medium)], ["Low risk accounts", String(low)]];
    const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "cx-report.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-lg shadow-slate-900/15">
        <div className="border-b border-gray-200 p-4 sm:p-5">
          <div className="text-sm font-semibold text-gray-900">Report summary</div>
          <div className="mt-0.5 text-xs text-gray-600">Snapshot of current customer risk distribution.</div>
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
          <Button variant="secondary" onClick={onClose}>Close</Button>
          <Button variant="primary" onClick={downloadCsv}>Download Report (CSV)</Button>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, tone }: { label: string; value: number; tone: "neutral" | "success" | "warning" | "danger" }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</div>
      <div className="mt-2 flex items-center justify-between gap-3">
        <div className="text-2xl font-semibold tabular-nums text-gray-900">{value}</div>
        <Badge tone={tone}>{tone === "neutral" ? "Info" : tone}</Badge>
      </div>
    </div>
  );
}

function escapeCsv(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replaceAll('"', '""')}"`;
  return value;
}
