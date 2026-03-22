"use client";

import { calculateHealth, expansionScore, healthCategory, riskFlag } from "@/lib/healthScore";
import { supabase } from "@/lib/supabase";
import type { CustomerPlan, CustomerRow } from "@/lib/customersData";
import type { Plan, Profile } from "@/lib/auth";

export type WorkspaceRole = "admin" | "csm";

export type WorkspaceProfile = Profile & {
  company_id: string | null;
  role: WorkspaceRole;
};

export type AssignmentMap = Record<string, string>;

export type WorkspaceTask = {
  id: string;
  title: string;
  description: string;
  customerId: string;
  customerName: string;
  priority: "High" | "Medium" | "Low";
  dueDate: string;
  status: "Open" | "In Progress" | "Done";
};

export type WorkspaceUpload = {
  id: string;
  fileName: string;
  uploadedBy: string;
  uploadedAt: string;
  rowCount: number;
  status: string;
};

export const RETENTION_REQUIRED_COLUMNS = [
  "Account_Name",
  "Customer_ID",
  "CSM_Owner",
  "ARR",
  "Plan_Type",
  "Active_Users",
  "Monthly_Logins",
  "Feature_Usage_Score",
  "Support_Tickets_Last_30_Days",
  "CSAT",
  "NPS",
  "Last_Login_Days_Ago",
  "Renewal_Date",
] as const;

export const COPILOT_REQUIRED_COLUMNS = [
  "Account_Name",
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

const LEGACY_COLUMNS = [
  "id",
  "name",
  "plan",
  "mrr",
  "last_activity",
  "logins_last_30_days",
  "support_tickets",
  "plan_value",
] as const;

function domainFromEmail(email: string) {
  const [, domain = ""] = email.toLowerCase().split("@");
  return domain;
}

function planFromRaw(value: string | undefined): CustomerPlan {
  const raw = (value ?? "").toLowerCase().trim();
  if (raw === "business" || raw === "enterprise") return "Business";
  if (raw === "pro" || raw === "growth") return "Pro";
  return "Starter";
}

function safeNumber(value: unknown, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function toLastActivity(daysAgo: number) {
  if (daysAgo <= 0) return "Today";
  if (daysAgo === 1) return "1d ago";
  return `${daysAgo}d ago`;
}

function tryParseDate(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function slugifyAccountName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 36);
}

function parseCsvLine(line: string) {
  const out: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      out.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  out.push(current.trim());
  return out;
}

function normalizeCustomer(row: Record<string, string>, companyId: string) {
  const name = (row.Account_Name ?? row.name ?? "").trim();
  const id = (row.Customer_ID ?? row.id ?? "").trim() || `acct-${slugifyAccountName(name || "customer")}`;
  const plan = planFromRaw(row.Plan_Type ?? row.plan);
  const arr = safeNumber(row.ARR, safeNumber(row.mrr, 0) * 12);
  const monthlyLogins = safeNumber(row.Monthly_Logins, safeNumber(row.logins_last_30_days, 0));
  const supportTickets = safeNumber(row.Support_Tickets_Last_30_Days, safeNumber(row.support_tickets, 0));
  const lastLoginDays = safeNumber(row.Last_Login_Days_Ago, 0);
  const featureUsage = safeNumber(row.Feature_Usage_Score, Math.min(monthlyLogins * 4, 100));
  const csat = safeNumber(row.CSAT, 7);
  const nps = safeNumber(row.NPS, 30);
  const activeUsers = safeNumber(row.Active_Users, Math.max(5, Math.round(monthlyLogins / 2)));
  const renewalDate = row.Renewal_Date && tryParseDate(row.Renewal_Date) ? row.Renewal_Date : "";
  const assignedName = (row.CSM_Owner ?? "").trim();

  const customer: CustomerRow = {
    id,
    company_id: companyId,
    name,
    plan,
    mrr: Math.round(arr / 12),
    arr,
    lastActivity: toLastActivity(lastLoginDays),
    logins_last_30_days: monthlyLogins,
    support_tickets: supportTickets,
    plan_value: Math.round(arr / 12),
    active_users: activeUsers,
    monthly_logins: monthlyLogins,
    feature_usage_score: featureUsage,
    support_tickets_last_30_days: supportTickets,
    csat,
    nps,
    last_login_days_ago: lastLoginDays,
    renewal_date: renewalDate || undefined,
    assignedCsmName: assignedName || null,
    usageTrend: [],
    tasks: [],
  };

  const healthScore = calculateHealth(customer);
  customer.healthScore = healthScore;
  customer.healthCategory = healthCategory(healthScore);
  customer.churnRisk = riskFlag(healthScore, customer);

  return customer;
}

function mapCustomerRecord(row: Record<string, unknown>): CustomerRow {
  const customer: CustomerRow = {
    id: String(row.customer_id ?? row.Customer_ID ?? row.id ?? ""),
    company_id: (row.company_id as string | null) ?? null,
    name: String(row.account_name ?? row.Account_Name ?? row.name ?? ""),
    plan: planFromRaw(String(row.plan_type ?? row.Plan_Type ?? row.plan ?? "Starter")),
    mrr: safeNumber(row.mrr, safeNumber(row.arr, 0) / 12),
    arr: safeNumber(row.arr, safeNumber(row.mrr, 0) * 12),
    lastActivity: String(row.last_activity ?? toLastActivity(safeNumber(row.last_login_days_ago, 0))),
    logins_last_30_days: safeNumber(row.logins_last_30_days, safeNumber(row.monthly_logins)),
    support_tickets: safeNumber(row.support_tickets, safeNumber(row.support_tickets_last_30_days)),
    plan_value: safeNumber(row.plan_value, safeNumber(row.mrr)),
    active_users: safeNumber(row.active_users),
    monthly_logins: safeNumber(row.monthly_logins, safeNumber(row.logins_last_30_days)),
    feature_usage_score: safeNumber(row.feature_usage_score),
    support_tickets_last_30_days: safeNumber(row.support_tickets_last_30_days, safeNumber(row.support_tickets)),
    csat: safeNumber(row.csat, 7),
    nps: safeNumber(row.nps, 30),
    last_login_days_ago: safeNumber(row.last_login_days_ago),
    renewal_date: (row.renewal_date as string | undefined) ?? undefined,
    assignedCsmEmail: (row.assigned_csm_email as string | null) ?? null,
    assignedCsmName: (row.assigned_csm_name as string | null) ?? (row.csm_owner as string | null) ?? null,
    usageTrend: Array.isArray(row.usage_trend) ? (row.usage_trend as number[]) : [],
    tasks: [],
  };

  const healthScore = safeNumber(row.health_score, calculateHealth(customer));
  customer.healthScore = healthScore;
  customer.healthCategory = (row.health_category as CustomerRow["healthCategory"]) ?? healthCategory(healthScore);
  customer.churnRisk = (row.churn_risk as CustomerRow["churnRisk"]) ?? riskFlag(healthScore, customer);
  customer.renewalDays = customer.renewal_date ? Math.ceil((new Date(customer.renewal_date).getTime() - Date.now()) / 86400000) : null;
  return customer;
}

export async function getWorkspaceProfile(): Promise<WorkspaceProfile | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return null;

  const expanded = await supabase
    .from("profiles")
    .select("id,name,email,plan,is_owner,is_approved,created_at,company_id,role")
    .eq("id", session.user.id)
    .single();

  const fallback = expanded.error
    ? await supabase
        .from("profiles")
        .select("id,name,email,plan,is_owner,is_approved,created_at")
        .eq("id", session.user.id)
        .single()
    : null;

  const profile = (expanded.data ?? fallback?.data) as Record<string, unknown> | null;
  if (!profile) return null;

  const companyId = (profile.company_id as string | null) || domainFromEmail(String(profile.email || session.user.email || ""));
  
  if (!profile.company_id && session.user.id) {
    // Synchronously try to update the profile so the next fetch works immediately
    const { error: updateError } = await supabase.from("profiles").update({ company_id: companyId }).eq("id", session.user.id);
    if (updateError) console.error("Identity bootstrap failed:", updateError);
  }

  return {
    id: String(profile.id),
    name: String(profile.name ?? session.user.user_metadata?.name ?? "User"),
    email: String(profile.email ?? session.user.email ?? ""),
    plan: (profile.plan as Plan) ?? "Starter",
    is_owner: Boolean(profile.is_owner),
    is_approved: Boolean(profile.is_approved),
    created_at: String(profile.created_at ?? new Date().toISOString()),
    company_id: companyId,
    role: ((profile.role as WorkspaceRole | undefined) ?? (profile.is_owner ? "admin" : "csm")) as WorkspaceRole,
  };
}

export async function getCompanyUsers(profile: WorkspaceProfile): Promise<WorkspaceProfile[]> {
  const baseSelect = "id,name,email,plan,is_owner,is_approved,created_at,company_id,role";
  let query = supabase.from("profiles").select(baseSelect);
  if (profile.company_id) {
    query = query.eq("company_id", profile.company_id);
  }
  const { data, error } = await query.order("created_at", { ascending: false });
  const rows = (!error && data ? data : []) as Record<string, unknown>[];
  if (rows.length > 0) {
    return rows.map((row) => ({
      id: String(row.id),
      name: String(row.name ?? ""),
      email: String(row.email ?? ""),
      plan: (row.plan as Plan) ?? "Starter",
      is_owner: Boolean(row.is_owner),
      is_approved: Boolean(row.is_approved),
      created_at: String(row.created_at ?? ""),
      company_id: (row.company_id as string | null) ?? profile.company_id,
      role: ((row.role as WorkspaceRole | undefined) ?? (row.is_owner ? "admin" : "csm")) as WorkspaceRole,
    }));
  }

  const fallback = await supabase.from("profiles").select("id,name,email,plan,is_owner,is_approved,created_at").ilike("email", `%@${domainFromEmail(profile.email)}`);
  return ((fallback.data ?? []) as Record<string, unknown>[]).map((row) => ({
    id: String(row.id),
    name: String(row.name ?? ""),
    email: String(row.email ?? ""),
    plan: (row.plan as Plan) ?? "Starter",
    is_owner: Boolean(row.is_owner),
    is_approved: Boolean(row.is_approved),
    created_at: String(row.created_at ?? ""),
    company_id: profile.company_id,
    role: row.is_owner ? "admin" : "csm",
  }));
}

export async function loadAssignments(profile: WorkspaceProfile): Promise<AssignmentMap> {
  const companyScoped = await supabase
    .from("assignments")
    .select("customer_id, assigned_profile_id, assigned_csm_email")
    .eq("company_id", profile.company_id ?? "");

  const rows = (!companyScoped.error && companyScoped.data ? companyScoped.data : []) as Record<string, unknown>[];
  if (rows.length > 0) {
    const map: AssignmentMap = {};
    rows.forEach((row) => {
      const assigned = String(row.assigned_profile_id ?? row.assigned_csm_email ?? "");
      if (assigned) map[String(row.customer_id)] = assigned;
    });
    return map;
  }

  const fallback = await supabase
    .from("assignments")
    .select("customer_id, csm_name")
    .eq("user_id", profile.id);

  const legacyRows = (fallback.data ?? []) as Record<string, unknown>[];
  const map: AssignmentMap = {};
  legacyRows.forEach((row) => {
    map[String(row.customer_id)] = String(row.csm_name ?? "");
  });
  return map;
}

export async function saveAssignments(profile: WorkspaceProfile, assignments: AssignmentMap) {
  const assignmentEntries = Object.entries(assignments).filter(([, assigned_profile_id]) => Boolean(assigned_profile_id));
  const assigneeIds = assignmentEntries.map(([, assigned_profile_id]) => assigned_profile_id);
  if (assignmentEntries.length === 0) {
    return supabase.from("assignments").delete().eq("company_id", profile.company_id ?? "").eq("assigned_by", profile.id);
  }

  const { data: companyUsers } = await supabase
    .from("profiles")
    .select("id,name,email")
    .in("id", assigneeIds);

  const userById = new Map(
    ((companyUsers ?? []) as Array<{ id: string; name: string | null; email: string | null }>).map((user) => [user.id, user]),
  );

  const rows = assignmentEntries.map(([customer_id, assigned_profile_id]) => {
    const matchedUser = userById.get(assigned_profile_id);
    return {
      company_id: profile.company_id,
      customer_id,
      assigned_profile_id,
      assigned_csm_email: matchedUser?.email ?? null,
      assigned_by: profile.id,
    };
  });

  const result = await supabase.from("assignments").upsert(rows, { onConflict: "company_id,customer_id" });
  if (!result.error) {
    await Promise.all(
      assignmentEntries.map(async ([customer_id, assigned_profile_id]) => {
        const matchedUser = userById.get(assigned_profile_id);
        await supabase
          .from("customers")
          .update({
            assigned_csm_name: matchedUser?.name ?? matchedUser?.email ?? null,
            assigned_csm_email: matchedUser?.email ?? null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", customer_id)
          .eq("company_id", profile.company_id ?? "");
      }),
    );
    return result;
  }

  const fallback = await supabase
    .from("assignments")
    .upsert(
      assignmentEntries.map(([customer_id, csm_name]) => ({
        user_id: profile.id,
        customer_id,
        csm_name,
      })),
      { onConflict: "user_id,customer_id" },
    );

  if (fallback.error) {
    throw new Error(fallback.error.message);
  }

  return fallback;
}

export async function loadWorkspaceCustomers(profile: WorkspaceProfile): Promise<CustomerRow[]> {
  const shared = await supabase
    .from("customers")
    .select("*")
    .eq("company_id", profile.company_id ?? "")
    .order("account_name", { ascending: true });

  let rows = (!shared.error && shared.data ? shared.data : []) as Record<string, unknown>[];
  if (rows.length === 0 && !profile.company_id) {
    const legacy = await supabase
      .from("customers")
      .select("*")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: true });
    rows = (legacy.data ?? []) as Record<string, unknown>[];
  }

  let customers = rows.map(mapCustomerRecord);
  if (profile.role === "csm") {
    const assignments = await loadAssignments(profile);
    if (Object.keys(assignments).length > 0) {
      customers = customers.filter((customer) => {
        const assigned = assignments[customer.id];
        return assigned === profile.id || assigned === profile.email || assigned === profile.name;
      });
    }
  }
  return customers;
}

export async function loadWorkspaceTasks(profile: WorkspaceProfile): Promise<WorkspaceTask[]> {
  let query = supabase.from("tasks").select("*");
  if (profile.company_id) {
    query = query.eq("company_id", profile.company_id);
  } else {
    query = query.eq("user_id", profile.id);
  }
  const { data } = await query.order("created_at", { ascending: true });

  const rows = ((data ?? []) as Record<string, unknown>[]).filter((row) => {
    if (profile.role === "admin") return true;
    return (
      String(row.owner_profile_id ?? row.user_id ?? "") === profile.id ||
      String(row.owner_email ?? "") === profile.email
    );
  });

  return rows.map((row) => ({
    id: String(row.id),
    title: String(row.title ?? ""),
    description: String(row.description ?? ""),
    customerId: String(row.customer_id ?? ""),
    customerName: String(row.customer_name ?? ""),
    priority: ((row.priority as WorkspaceTask["priority"] | undefined) ?? "Medium"),
    dueDate: String(row.due_date ?? row.due ?? ""),
    status: ((row.status as WorkspaceTask["status"] | undefined) ?? "Open"),
  }));
}

export async function loadUploadHistory(profile: WorkspaceProfile): Promise<WorkspaceUpload[]> {
  const { data, error } = await supabase
    .from("dataset_uploads")
    .select("id,file_name,uploaded_by,uploaded_at,row_count,status")
    .eq("company_id", profile.company_id ?? "")
    .order("uploaded_at", { ascending: false });

  if (error || !data) return [];

  return (data as Record<string, unknown>[]).map((row) => ({
    id: String(row.id ?? ""),
    fileName: String(row.file_name ?? "unknown.csv"),
    uploadedBy: String(row.uploaded_by ?? ""),
    uploadedAt: String(row.uploaded_at ?? new Date().toISOString()),
    rowCount: safeNumber(row.row_count),
    status: String(row.status ?? "completed"),
  }));
}

export async function persistTasks(profile: WorkspaceProfile, tasks: WorkspaceTask[]) {
  const rows = tasks.map((task) => ({
    id: task.id,
    company_id: profile.company_id,
    customer_id: task.customerId,
    customer_name: task.customerName,
    owner_profile_id: profile.id,
    owner_email: profile.email,
    title: task.title,
    description: task.description,
    priority: task.priority,
    due_date: task.dueDate,
    status: task.status,
  }));

  const result = await supabase.from("tasks").upsert(rows, { onConflict: "id" });
  if (!result.error) return result;

  return supabase.from("tasks").upsert(
    rows.map((row) => ({
      id: row.id,
      user_id: profile.id,
      customer_id: row.customer_id,
      title: row.title,
      due: row.due_date,
      status: row.status,
    })),
    { onConflict: "id" },
  );
}

export function buildRetentionTemplateCsv() {
  const headers = [...RETENTION_REQUIRED_COLUMNS];
  const sampleRows = [
    ["Acme Corp", "CX-0001", "John Carter", "24000", "Pro", "85", "320", "78", "2", "8.6", "48", "3", "2026-07-15"],
    ["Northwind Labs", "CX-0002", "Sarah Khan", "54000", "Business", "140", "210", "44", "7", "5.9", "12", "14", "2026-05-01"],
  ];

  return [headers, ...sampleRows].map((row) => row.join(",")).join("\n");
}

export async function importCustomersFromCsv(profile: WorkspaceProfile, text: string, fileName: string) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));

  if (lines.length < 2) {
    return { ok: false as const, error: "CSV must include a header row and at least one data row." };
  }

  const header = parseCsvLine(lines[0]);
  const rows = lines.slice(1).map(parseCsvLine);
  const normalizedHeader = header.map((value) => value.trim());
  const headerSet = new Set(normalizedHeader);

  const hasRetentionSchema = RETENTION_REQUIRED_COLUMNS.every((column) => headerSet.has(column));
  const hasCopilotSchema = COPILOT_REQUIRED_COLUMNS.every((column) => headerSet.has(column));
  const hasLegacySchema = LEGACY_COLUMNS.every((column) => headerSet.has(column));

  if (!hasRetentionSchema && !hasCopilotSchema && !hasLegacySchema) {
    return {
      ok: false as const,
      error:
        "Incorrect CSV format. Upload the retention master CSV format, the AI Copilot CSV format, or the legacy simplified customer CSV template.",
    };
  }

  const parsedRows = rows.map((values) => {
    const row: Record<string, string> = {};
    normalizedHeader.forEach((key, index) => {
      row[key] = values[index] ?? "";
    });
    return row;
  });

  const normalizedCustomers = parsedRows.map((row) => normalizeCustomer(row, profile.company_id ?? domainFromEmail(profile.email)));
  const duplicateIds = normalizedCustomers
    .map((row) => row.id)
    .filter((id, index, arr) => arr.indexOf(id) !== index);

  if (duplicateIds.length > 0) {
    return {
      ok: false as const,
      error: `Duplicate Customer_ID values found: ${Array.from(new Set(duplicateIds)).join(", ")}`,
    };
  }

  const invalidRows = normalizedCustomers.filter((row) => !row.id || !row.name || !row.renewal_date);
  if (invalidRows.length > 0) {
    return {
      ok: false as const,
      error: "Some rows are missing Customer_ID, Account_Name, or a valid Renewal_Date.",
    };
  }

  const payload = normalizedCustomers.map((customer) => ({
    id: customer.id,
    company_id: customer.company_id,
    customer_id: customer.id,
    account_name: customer.name,
    name: customer.name,
    plan_type: customer.plan,
    plan: customer.plan,
    arr: customer.arr,
    mrr: customer.mrr,
    active_users: customer.active_users,
    monthly_logins: customer.monthly_logins,
    logins_last_30_days: customer.logins_last_30_days,
    feature_usage_score: customer.feature_usage_score,
    support_tickets_last_30_days: customer.support_tickets_last_30_days,
    support_tickets: customer.support_tickets,
    csat: customer.csat,
    nps: customer.nps,
    last_login_days_ago: customer.last_login_days_ago,
    last_activity: customer.lastActivity,
    renewal_date: customer.renewal_date,
    health_score: customer.healthScore,
    health_category: customer.healthCategory,
    churn_risk: customer.churnRisk,
    assigned_csm_name: customer.assignedCsmName,
    assigned_csm_email: customer.assignedCsmEmail,
    plan_value: customer.plan_value,
    usage_trend: customer.usageTrend ?? [],
  }));

  // --- NEW: Clear old company data for a clean sync ---
  if (profile.company_id) {
    const { error: deleteError } = await supabase
      .from("customers")
      .delete()
      .eq("company_id", profile.company_id);
    if (deleteError) console.error("Could not clear old customers:", deleteError);
    
    // Also clear old assignments to keep them in sync with the new master list
    await supabase.from("assignments").delete().eq("company_id", profile.company_id);
    await supabase.from("assignments").delete().eq("user_id", profile.id);
  } else {
    // Fallback for personal workspace
    await supabase.from("customers").delete().eq("user_id", profile.id);
    await supabase.from("assignments").delete().eq("user_id", profile.id);
  }

  const upsert = await supabase.from("customers").upsert(payload, { onConflict: "id" });
  if (upsert.error) {
    const fallback = await supabase.from("customers").upsert(
      payload.map((row) => ({
        id: row.id,
        user_id: profile.id,
        company_id: profile.company_id, // Ensure company_id is present even in fallback
        name: row.name,
        plan: row.plan,
        mrr: row.mrr,
        last_activity: row.last_activity,
        logins_last_30_days: row.logins_last_30_days,
        support_tickets: row.support_tickets,
        plan_value: row.plan_value,
        usage_trend: row.usage_trend,
      })),
      { onConflict: "id" },
    );
    if (fallback.error) return { ok: false as const, error: fallback.error.message };
  }

  // --- NEW: Sync Assignments (Added to CX Engine) ---
  try {
    const { data: teamProfiles } = await supabase
      .from("profiles")
      .select("id, name, email")
      .eq("company_id", profile.company_id);

    if (teamProfiles && teamProfiles.length > 0) {
      const assignmentRows: Array<{
        company_id: string | null;
        customer_id: string;
        assigned_profile_id: string;
        assigned_csm_email: string | null;
        assigned_by: string;
      }> = [];
      normalizedCustomers.forEach((customer) => {
        const ownerQuery = (customer.assignedCsmName || "").trim().toLowerCase();
        if (!ownerQuery) return;
        
        // Flexible matching: check name, email, or if query is part of the name/email
        const matchedProfile = teamProfiles.find(
          (p) => 
            p.name?.toLowerCase() === ownerQuery || 
            p.email?.toLowerCase() === ownerQuery ||
            p.name?.toLowerCase().includes(ownerQuery) ||
            ownerQuery.includes(p.name?.toLowerCase() || "___")
        );

        if (matchedProfile) {
          customer.assignedCsmEmail = matchedProfile.email ?? null;
          assignmentRows.push({
            company_id: profile.company_id,
            customer_id: customer.id,
            assigned_profile_id: matchedProfile.id,
            assigned_csm_email: matchedProfile.email ?? null,
            assigned_by: profile.id,
          });
        }
      });

      if (assignmentRows.length > 0) {
        console.log(`Syncing ${assignmentRows.length} assignments...`);
        const { error: assignError } = await supabase.from("assignments").upsert(assignmentRows, { 
          onConflict: "company_id,customer_id" 
        });
        if (assignError) console.error("Assignment upsert error:", assignError);
      }
    }
  } catch (err) {
    console.error("Assignment sync failed:", err);
    // Non-blocking error for main import
  }
  // --- END Sync Assignments ---

  const { error: uploadError } = await supabase.from("dataset_uploads").insert({
    company_id: profile.company_id,
    file_name: fileName,
    uploaded_by: profile.id,
    uploaded_at: new Date().toISOString(),
    row_count: normalizedCustomers.length,
    status: "completed",
  });
  if (uploadError) {
    console.error("Upload history recording failed:", uploadError);
>>>>>>> a07e70d (Fix CSV assignment sync and hide pricing details)
  }

  await supabase.from("dataset_uploads").insert({ company_id: profile.company_id, file_name: fileName, uploaded_by: profile.id, uploaded_at: new Date().toISOString(), row_count: normalizedCustomers.length, status: "completed" });
  return { ok: true as const, customers: normalizedCustomers };
}

export function buildExecutiveSummary(customers: CustomerRow[]) {
  const highRisk = customers.filter((customer) => customer.churnRisk === "High Risk");
  const nearRenewal = customers.filter((customer) => (customer.renewalDays ?? 999) <= 90);
  const expansion = customers.filter((customer) => expansionScore(customer) >= 75);
  const arrExposure = highRisk.reduce((sum, customer) => sum + (customer.arr ?? customer.mrr * 12), 0);
  return `${highRisk.length} accounts show elevated churn risk with ARR exposure of $${arrExposure.toLocaleString()}. ${nearRenewal.length} renewals are due inside 90 days, and ${expansion.length} accounts show clear expansion potential.`;
}
