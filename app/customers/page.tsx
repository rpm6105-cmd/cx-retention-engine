"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { calculateHealth, riskFlag } from "@/lib/healthScore";
import type { CustomerRow } from "@/lib/customersData";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { useCustomers } from "@/lib/useCustomers";

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useCustomers();
  const [query, setQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<"All" | "High" | "Medium" | "Low">(
    "All",
  );
  const [uploadError, setUploadError] = useState<string | null>(null);

  const customersWithSignals = useMemo(() => {
    return (customers as CustomerRow[]).map((c) => {
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return customersWithSignals.filter((c) => {
      const matchesQuery =
        q.length === 0 ||
        c.name.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q);
      const matchesRisk = riskFilter === "All" || c.riskLevel === riskFilter;
      return matchesQuery && matchesRisk;
    });
  }, [customersWithSignals, query, riskFilter]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white">
      <div className="mx-auto max-w-6xl space-y-6 px-1 py-2 sm:px-3 sm:py-6">
        <header className="rounded-2xl border border-gray-200 bg-white/80 p-4 shadow-sm backdrop-blur sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
                Customers
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage and monitor all customer accounts
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
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search customers…"
                  className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-900 shadow-sm outline-none ring-0 placeholder:text-gray-400 focus:border-gray-300 focus:outline-none focus:ring-4 focus:ring-indigo-600/15"
                />
              </div>

              <label className="w-full sm:w-auto">
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploadError(null);
                    try {
                      const text = await file.text();
                      const next = customersFromCsv(text);
                      if (next.length === 0) {
                        throw new Error("No rows found in CSV.");
                      }
                      setCustomers(next);
                    } catch (err) {
                      setUploadError(
                        err instanceof Error ? err.message : "Failed to parse CSV.",
                      );
                    } finally {
                      e.target.value = "";
                    }
                  }}
                />
                <Button variant="secondary" className="w-full sm:w-auto">
                  Upload CSV
                </Button>
              </label>
            </div>
          </div>

          {uploadError && (
            <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 ring-1 ring-rose-600/10">
              {uploadError}
            </div>
          )}
        </header>

        <Card>
          <CardBody>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <div className="text-sm font-semibold text-gray-900">Filters</div>
                <span className="text-xs text-gray-500">
                  {filtered.length} result{filtered.length === 1 ? "" : "s"}
                </span>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <label className="text-xs font-semibold text-gray-700">
                  Risk level
                </label>
                <select
                  value={riskFilter}
                  onChange={(e) =>
                    setRiskFilter(e.target.value as typeof riskFilter)
                  }
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-900 shadow-sm outline-none focus:border-gray-300 focus:outline-none focus:ring-4 focus:ring-indigo-600/15 sm:w-56"
                >
                  <option value="All">All</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>
          </CardBody>
        </Card>

        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm shadow-gray-900/5">
          <div className="max-h-[620px] overflow-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="sticky top-0 z-10 bg-gray-50/80 text-xs font-semibold tracking-wide text-gray-600 backdrop-blur">
                <tr>
                  <th scope="col" className="px-5 py-3.5">
                    Customer Name
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
                    Last Activity
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    className="group cursor-pointer transition-colors hover:bg-gray-50/80"
                    onClick={() => router.push(`/customers/${c.id}`)}
                    onMouseEnter={() => router.prefetch(`/customers/${c.id}`)}
                    role="link"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        router.push(`/customers/${c.id}`);
                      }
                    }}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-xs font-semibold text-white shadow-sm shadow-indigo-600/20 ring-1 ring-indigo-600/15">
                          {c.name
                            .split(" ")
                            .slice(0, 2)
                            .map((p) => p[0])
                            .join("")}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {c.name}
                          </div>
                          <div className="text-xs text-gray-500">{c.id}</div>
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
                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td className="px-5 py-10 text-center text-sm text-gray-600" colSpan={6}>
                      No customers match your search/filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function customersFromCsv(text: string): CustomerRow[] {
  const lines = text
    .replaceAll("\r\n", "\n")
    .replaceAll("\r", "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) return [];

  const header = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const idx = (name: string) => header.indexOf(name);

  const nameIdx = idx("customer_name");
  const loginsIdx = idx("logins_last_30_days");
  const ticketsIdx = idx("support_tickets");
  const planValueIdx = idx("plan_value");

  if (nameIdx === -1 || loginsIdx === -1 || ticketsIdx === -1 || planValueIdx === -1) {
    throw new Error(
      "CSV must include headers: customer_name, logins_last_30_days, support_tickets, plan_value",
    );
  }

  const out: CustomerRow[] = [];
  let n = 0;

  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvLine(lines[i]);
    const name = (row[nameIdx] ?? "").trim();
    if (!name) continue;

    const logins = toNumber(row[loginsIdx]);
    const tickets = toNumber(row[ticketsIdx]);
    const planValue = toNumber(row[planValueIdx]);

    out.push({
      id: `CUST-CSV-${++n}`,
      name,
      plan: "Starter",
      mrr: Math.round(planValue),
      lastActivity: "Today",
      logins_last_30_days: Math.round(logins),
      support_tickets: Math.round(tickets),
      plan_value: planValue,
      usageTrend: [],
      tasks: [],
    });
  }

  return out;
}

function toNumber(v: string | undefined) {
  const n = Number(String(v ?? "").trim());
  return Number.isFinite(n) ? n : 0;
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      const next = line[i + 1];
      if (inQuotes && next === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out;
}

