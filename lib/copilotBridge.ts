import type { CustomerRow } from "@/lib/customersData";
import type { AssignmentMap } from "@/lib/workspace";
import type { Profile } from "@/lib/auth";
import { calculateHealth } from "@/lib/healthScore";

export const COPILOT_EXPORT_COLUMNS = [
  "Account_Name",
  "Customer_ID",
  "CSM_Owner",
  "ARR",
  "Active_Users",
  "Monthly_Logins",
  "Feature_Usage_Score",
  "Support_Tickets_Last_30_Days",
  "CSAT",
  "NPS",
  "Last_Login_Days_Ago",
  "Renewal_Date",
  "Plan_Type",
] as const;

export type CopilotExportRow = Record<(typeof COPILOT_EXPORT_COLUMNS)[number], string | number>;

export function copilotOwnerLabel(customer: CustomerRow, assignments: AssignmentMap, users: Profile[]) {
  const assignedId = assignments[customer.id];
  if (assignedId) {
    const matched = users.find((user) => user.id === assignedId);
    if (matched?.name) return matched.name;
    if (matched?.email) return matched.email;
  }
  return customer.assignedCsmName ?? customer.assignedCsmEmail ?? "Unassigned";
}

export function toCopilotExportRow(customer: CustomerRow, assignments: AssignmentMap, users: Profile[]): CopilotExportRow {
  const arr = Math.round(customer.arr ?? customer.mrr * 12);
  const health = customer.healthScore ?? calculateHealth(customer);
  const defaultCsat = customer.csat ?? Math.max(4.5, Math.min(10, Number((health / 10).toFixed(1))));
  const defaultNps = customer.nps ?? Math.max(-20, Math.min(80, Math.round((health - 50) * 1.5)));

  return {
    Account_Name: customer.name,
    Customer_ID: customer.id,
    CSM_Owner: copilotOwnerLabel(customer, assignments, users),
    ARR: arr,
    Active_Users: Math.round(customer.active_users ?? Math.max(10, (customer.monthly_logins ?? customer.logins_last_30_days) / 2)),
    Monthly_Logins: Math.round(customer.monthly_logins ?? customer.logins_last_30_days),
    Feature_Usage_Score: Number((customer.feature_usage_score ?? health).toFixed(1)),
    Support_Tickets_Last_30_Days: Math.round(customer.support_tickets_last_30_days ?? customer.support_tickets),
    CSAT: Number(defaultCsat.toFixed(1)),
    NPS: defaultNps,
    Last_Login_Days_Ago: Math.round(customer.last_login_days_ago ?? 0),
    Renewal_Date: customer.renewal_date ?? "",
    Plan_Type: customer.plan,
  };
}

function escapeCsvCell(value: string | number) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function buildCopilotCsv(customers: CustomerRow[], assignments: AssignmentMap, users: Profile[]) {
  const rows = customers.map((customer) => toCopilotExportRow(customer, assignments, users));
  const header = COPILOT_EXPORT_COLUMNS.join(",");
  const body = rows
    .map((row) => COPILOT_EXPORT_COLUMNS.map((column) => escapeCsvCell(row[column])).join(","))
    .join("\n");
  return `${header}\n${body}`;
}
