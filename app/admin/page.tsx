"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { assignPlan, approveUser, logout, type Plan, type Profile } from "@/lib/auth";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import {
  buildRetentionTemplateCsv,
  getCompanyUsers,
  getWorkspaceProfile,
  importCustomersFromCsv,
  loadAssignments,
  loadUploadHistory,
  loadWorkspaceCustomers,
  saveAssignments,
  type AssignmentMap,
  type WorkspaceProfile,
  type WorkspaceUpload,
} from "@/lib/workspace";
import type { CustomerRow } from "@/lib/customersData";

const PLANS: Plan[] = ["Starter", "Pro", "Business"];
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://cx-retention-engine.vercel.app";

export default function AdminPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<WorkspaceProfile | null>(null);
  const [users, setUsers] = useState<Profile[]>([]);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [assignments, setAssignments] = useState<AssignmentMap>({});
  const [uploads, setUploads] = useState<WorkspaceUpload[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");
  const [assignmentError, setAssignmentError] = useState("");
  const [assignmentSuccess, setAssignmentSuccess] = useState("");
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [assigningUser, setAssigningUser] = useState<Profile | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan>("Starter");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedAssigneeId, setSelectedAssigneeId] = useState("");

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePlan, setInvitePlan] = useState<Plan>("Starter");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [inviteError, setInviteError] = useState("");

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      const workspaceProfile = await getWorkspaceProfile();
      if (!workspaceProfile) {
        router.replace("/login");
        return;
      }
      if (!workspaceProfile.is_owner) {
        router.replace("/dashboard");
        return;
      }

      const [companyUsers, workspaceCustomers, workspaceAssignments, uploadHistory] = await Promise.all([
        getCompanyUsers(workspaceProfile),
        loadWorkspaceCustomers(workspaceProfile),
        loadAssignments(workspaceProfile),
        loadUploadHistory(workspaceProfile),
      ]);

      if (!active) return;
      setProfile(workspaceProfile);
      setUsers(companyUsers);
      setCustomers(workspaceCustomers);
      setAssignments(workspaceAssignments);
      setUploads(uploadHistory);
      setSelectedCustomerId(workspaceCustomers[0]?.id ?? "");
      const defaultAssignee = companyUsers.find((user) => !user.is_owner)?.id ?? "";
      setSelectedAssigneeId(defaultAssignee);
      setLoading(false);
    }

    bootstrap();
    return () => {
      active = false;
    };
  }, [router]);

  const pendingUsers = users.filter((user) => !user.is_approved && !user.is_owner);
  const filteredUsers = users.filter((user) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return `${user.name} ${user.email}`.toLowerCase().includes(query);
  });

  const csmUsers = useMemo(() => users.filter((user) => !user.is_owner), [users]);

  async function refreshWorkspace() {
    if (!profile) return;
    const [companyUsers, workspaceCustomers, workspaceAssignments, uploadHistory] = await Promise.all([
      getCompanyUsers(profile),
      loadWorkspaceCustomers(profile),
      loadAssignments(profile),
      loadUploadHistory(profile),
    ]);
    setUsers(companyUsers);
    setCustomers(workspaceCustomers);
    setAssignments(workspaceAssignments);
    setUploads(uploadHistory);
    setSelectedCustomerId((current) => current || workspaceCustomers[0]?.id || "");
    setSelectedAssigneeId((current) => current || companyUsers.find((user) => !user.is_owner)?.id || "");
  }

  function downloadTemplate() {
    const blob = new Blob([buildRetentionTemplateCsv()], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "cx-retention-master-template.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function handleApprove(user: Profile) {
    setApprovingId(user.id);
    await approveUser(user.id);
    await refreshWorkspace();
    setApprovingId(null);
  }

  async function handleAssignPlan() {
    if (!assigningUser) return;
    await assignPlan(assigningUser.email, selectedPlan);
    await refreshWorkspace();
    setAssigningUser(null);
  }

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !profile) return;

    setUploading(true);
    setUploadError("");
    setUploadSuccess("");

    const text = await file.text();
    const result = await importCustomersFromCsv(profile, text, file.name);

    if (!result.ok) {
      setUploadError(result.error);
    } else {
      setUploadSuccess(`${result.customers.length} customers uploaded to workspace "${profile.company_id}" from ${file.name}.`);
      await refreshWorkspace();
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleAssignmentSave() {
    if (!profile || !selectedCustomerId || !selectedAssigneeId) return;
    setAssignmentError("");
    setAssignmentSuccess("");
    const nextAssignments = {
      ...assignments,
      [selectedCustomerId]: selectedAssigneeId,
    };
    try {
      await saveAssignments(profile, nextAssignments);
      setAssignments(nextAssignments);
      await refreshWorkspace();
      const customer = customers.find((item) => item.id === selectedCustomerId);
      const assignee = users.find((user) => user.id === selectedAssigneeId);
      setAssignmentSuccess(
        `${customer?.name ?? "Customer"} assigned to ${assignee?.name ?? assignee?.email ?? "selected CSM"}.`,
      );
    } catch (error) {
      setAssignmentError(error instanceof Error ? error.message : "Assignment could not be saved.");
    }
  }

  async function handleInvite(event: React.FormEvent) {
    event.preventDefault();
    setInviteLoading(true);
    setInviteSuccess(false);
    setInviteError("");

    try {
      const response = await fetch("/api/admin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail,
          plan: invitePlan,
          redirectTo: `${APP_URL}/dashboard`,
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setInviteError(payload.error ?? "Failed to send invite.");
      } else {
        setInviteSuccess(true);
        setInviteEmail("");
      }
    } catch {
      setInviteError("Failed to send invite. Please try again.");
    }

    setInviteLoading(false);
  }

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  function assignedLabel(customerId: string) {
    const assigned = assignments[customerId];
    if (!assigned) {
      const customer = customers.find((c) => c.id === customerId);
      return customer?.assignedCsmName || "Unassigned";
    }
    const matched = users.find((user) => user.id === assigned || user.email === assigned || user.name === assigned);
    return matched?.name || matched?.email || assigned;
  }

  function planTone(plan: Plan): "neutral" | "warning" | "success" {
    if (plan === "Business") return "success";
    if (plan === "Pro") return "warning";
    return "neutral";
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <svg className="h-5 w-5 animate-spin text-indigo-600" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white">
      <div className="mx-auto max-w-6xl space-y-6 px-1 py-2 sm:px-3 sm:py-6">
        <header className="rounded-2xl border border-gray-200 bg-white/80 p-4 shadow-sm backdrop-blur sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm shadow-indigo-500/30 ring-1 ring-white/10">
                <span className="text-sm font-extrabold">CX</span>
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Admin Workspace</h1>
                <p className="mt-0.5 text-sm text-gray-600">Manage the shared company dataset, assignments, approvals, and invites.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone="success">Owner</Badge>
              <Button variant="primary" onClick={() => { setInviteOpen(true); setInviteSuccess(false); setInviteError(""); }}>Invite user</Button>
              <Button variant="secondary" onClick={handleLogout}>Sign out</Button>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Team members", value: users.filter((user) => !user.is_owner).length },
            { label: "Pending approvals", value: pendingUsers.length },
            { label: "Customers", value: customers.length },
            { label: "Uploads", value: uploads.length },
          ].map((kpi) => (
            <div key={kpi.label} className={`rounded-2xl border bg-white p-5 shadow-sm shadow-gray-900/5 ${kpi.label === "Pending approvals" && pendingUsers.length > 0 ? "border-amber-200 bg-amber-50" : "border-gray-200"}`}>
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">{kpi.label}</div>
              <div className={`mt-2 text-3xl font-semibold tabular-nums tracking-tight ${kpi.label === "Pending approvals" && pendingUsers.length > 0 ? "text-amber-700" : "text-gray-900"}`}>{kpi.value}</div>
            </div>
          ))}
        </section>

        <Card>
          <CardHeader className="border-b border-gray-200">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Master dataset</h2>
              <p className="mt-0.5 text-xs text-gray-600">Upload the shared company CSV once, and every approved CSM works from the same account portfolio.</p>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button variant="primary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>{uploading ? "Uploading…" : "Upload master CSV"}</Button>
              <Button variant="secondary" onClick={downloadTemplate}>Download template</Button>
              <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleUpload} />
            </div>
            {uploadError && <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm font-semibold text-rose-700">{uploadError}</div>}
            {uploadSuccess && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-700">{uploadSuccess}</div>}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Latest upload</div>
                <div className="mt-2 text-sm font-semibold text-gray-900">{uploads[0]?.fileName ?? "No uploads yet"}</div>
                <div className="mt-1 text-xs text-gray-600">{uploads[0] ? `${uploads[0].rowCount} rows · ${new Date(uploads[0].uploadedAt).toLocaleString()}` : "Upload the first company master dataset to initialize the workspace."}</div>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Accepted schemas</div>
                <div className="mt-2 text-sm font-semibold text-gray-900">Retention master CSV, AI Copilot CSV, or legacy simplified CSV</div>
                <div className="mt-1 text-xs text-gray-600">The uploader now normalizes all supported schemas into the same shared customer model.</div>
              </div>
            </div>
          </CardBody>
        </Card>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardHeader className="border-b border-gray-200">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Customer assignments</h2>
                <p className="mt-0.5 text-xs text-gray-600">Assign each customer to a CSM so their dashboard view stays scoped correctly.</p>
              </div>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Customer</label>
                  <select value={selectedCustomerId} onChange={(event) => setSelectedCustomerId(event.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-900 shadow-sm outline-none focus:border-gray-300 focus:outline-none focus:ring-4 focus:ring-indigo-600/15">
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>{customer.name} · {customer.id}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Assign to CSM</label>
                  <select value={selectedAssigneeId} onChange={(event) => setSelectedAssigneeId(event.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-900 shadow-sm outline-none focus:border-gray-300 focus:outline-none focus:ring-4 focus:ring-indigo-600/15">
                    {csmUsers.map((user) => (
                      <option key={user.id} value={user.id}>{user.name} · {user.email}</option>
                    ))}
                  </select>
                </div>
              </div>
              {assignmentError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm font-semibold text-rose-700">
                  {assignmentError}
                </div>
              )}
              {assignmentSuccess && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-700">
                  {assignmentSuccess}
                </div>
              )}
              <div>
                <Button variant="primary" onClick={handleAssignmentSave} disabled={!selectedCustomerId || !selectedAssigneeId}>Save assignment</Button>
              </div>
              <div className="max-h-72 overflow-auto rounded-2xl border border-gray-200">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-600">
                    <tr>
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3">Assigned to</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {customers.map((customer) => (
                      <tr key={customer.id}>
                        <td className="px-4 py-3 text-gray-900">{customer.name}</td>
                        <td className="px-4 py-3 text-gray-700">{assignedLabel(customer.id)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader className="border-b border-gray-200">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Upload history</h2>
                <p className="mt-0.5 text-xs text-gray-600">Recent master dataset uploads for this company workspace.</p>
              </div>
            </CardHeader>
            <CardBody className="space-y-3">
              {uploads.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-600">No uploads yet.</div>
              ) : (
                uploads.map((upload) => (
                  <div key={upload.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="text-sm font-semibold text-gray-900">{upload.fileName}</div>
                    <div className="mt-1 text-xs text-gray-600">{upload.rowCount} rows · {new Date(upload.uploadedAt).toLocaleString()}</div>
                    <div className="mt-3"><Badge tone={upload.status === "completed" ? "success" : "warning"}>{upload.status}</Badge></div>
                  </div>
                ))
              )}
            </CardBody>
          </Card>
        </section>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-col gap-3 border-b border-gray-200 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Company users</h2>
              <p className="mt-0.5 text-xs text-gray-600">Approve users and assign plans within this workspace.</p>
            </div>
            <input placeholder="Search users…" value={search} onChange={(event) => setSearch(event.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm outline-none placeholder:text-gray-400 focus:border-gray-300 focus:outline-none focus:ring-4 focus:ring-indigo-600/15 sm:w-72" />
          </CardHeader>

          <div className="max-h-[520px] overflow-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="sticky top-0 z-10 bg-gray-50/80 text-xs font-semibold tracking-wide text-gray-600 backdrop-blur">
                <tr>
                  <th scope="col" className="px-5 py-3.5">User</th>
                  <th scope="col" className="px-5 py-3.5">Email</th>
                  <th scope="col" className="px-5 py-3.5">Status</th>
                  <th scope="col" className="px-5 py-3.5">Plan</th>
                  <th scope="col" className="px-5 py-3.5">Joined</th>
                  <th scope="col" className="px-5 py-3.5 text-right" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className={`group transition-colors hover:bg-gray-50/80 ${!user.is_approved && !user.is_owner ? "bg-amber-50/50" : ""}`}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-xs font-semibold text-white shadow-sm shadow-indigo-600/20 ring-1 ring-indigo-600/15">
                          {user.name.split(" ").slice(0, 2).map((part) => part[0]).join("")}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-medium text-gray-900">{user.name}</div>
                          {user.is_owner && <div className="text-xs font-semibold text-indigo-600">Owner</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-700">{user.email}</td>
                    <td className="px-5 py-4">
                      {user.is_owner ? <Badge tone="success">Owner</Badge> : user.is_approved ? <Badge tone="success">Approved</Badge> : <Badge tone="warning">Pending</Badge>}
                    </td>
                    <td className="px-5 py-4"><Badge tone={planTone(user.plan)}>{user.plan}</Badge></td>
                    <td className="px-5 py-4 whitespace-nowrap text-gray-700">{new Date(user.created_at).toLocaleDateString()}</td>
                    <td className="px-5 py-4 text-right">
                      {!user.is_owner && (
                        <div className="inline-flex items-center gap-2">
                          {!user.is_approved && (
                            <button disabled={approvingId === user.id} onClick={() => handleApprove(user)} className="rounded-lg px-2 py-1 text-xs font-semibold text-white bg-indigo-600 transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-600/15 disabled:opacity-60">
                              {approvingId === user.id ? "Approving…" : "Approve"}
                            </button>
                          )}
                          <button className="rounded-lg px-2 py-1 text-xs font-semibold text-gray-700 opacity-0 transition hover:bg-gray-100 hover:text-gray-900 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-4 focus:ring-indigo-600/15" onClick={() => { setAssigningUser(user); setSelectedPlan(user.plan); }}>
                            Assign plan
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {inviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) setInviteOpen(false); }}>
          <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white shadow-lg shadow-slate-900/15">
            <div className="border-b border-gray-200 p-4 sm:p-5">
              <div className="text-sm font-semibold text-gray-900">Invite user</div>
              <div className="mt-0.5 text-xs text-gray-600">Send a role-free signup invite into this workspace.</div>
            </div>
            {inviteSuccess ? (
              <div className="p-6 text-center">
                <div className="grid h-12 w-12 mx-auto place-items-center rounded-full bg-emerald-100 text-emerald-600">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6"><path fillRule="evenodd" d="M16.704 4.296a1 1 0 0 1 0 1.414l-7.5 7.5a1 1 0 0 1-1.414 0l-3.5-3.5a1 1 0 0 1 1.414-1.414l2.793 2.793 6.793-6.793a1 1 0 0 1 1.414 0Z" clipRule="evenodd" /></svg>
                </div>
                <div className="mt-3 text-sm font-semibold text-gray-900">Invite sent!</div>
                <button onClick={() => { setInviteOpen(false); setInviteSuccess(false); }} className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white">Done</button>
              </div>
            ) : (
              <form onSubmit={handleInvite} className="space-y-4 p-4 sm:p-5">
                <div className="space-y-1.5">
                  <label htmlFor="invite-email" className="text-xs font-semibold text-gray-700">Email address</label>
                  <input id="invite-email" type="email" placeholder="user@company.com" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm outline-none placeholder:text-gray-400 focus:border-gray-300 focus:outline-none focus:ring-4 focus:ring-indigo-600/15" />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="invite-plan" className="text-xs font-semibold text-gray-700">Assign plan</label>
                  <select id="invite-plan" value={invitePlan} onChange={(event) => setInvitePlan(event.target.value as Plan)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-900 shadow-sm outline-none focus:border-gray-300 focus:outline-none focus:ring-4 focus:ring-indigo-600/15">
                    {PLANS.map((plan) => <option key={plan} value={plan}>{plan}</option>)}
                  </select>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <div className="text-xs font-semibold text-gray-700 mb-1.5">Or share signup link directly</div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 truncate rounded-lg bg-white border border-gray-200 px-2 py-1.5 text-xs text-gray-700">{APP_URL}/login</code>
                    <button type="button" onClick={() => navigator.clipboard.writeText(`${APP_URL}/login`)} className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50">Copy</button>
                  </div>
                </div>
                {inviteError && <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">{inviteError}</div>}
                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button variant="secondary" type="button" onClick={() => setInviteOpen(false)}>Cancel</Button>
                  <Button variant="primary" type="submit" disabled={inviteLoading}>{inviteLoading ? "Sending…" : "Send invite"}</Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {assigningUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) setAssigningUser(null); }}>
          <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white shadow-lg shadow-slate-900/15">
            <div className="border-b border-gray-200 p-4 sm:p-5">
              <div className="text-sm font-semibold text-gray-900">Assign Plan</div>
              <div className="mt-0.5 text-xs text-gray-600">{assigningUser.name} · {assigningUser.email}</div>
            </div>
            <div className="space-y-2 p-4 sm:p-5">
              <label className="text-xs font-semibold text-gray-700">Plan</label>
              <select value={selectedPlan} onChange={(event) => setSelectedPlan(event.target.value as Plan)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-900 shadow-sm outline-none focus:border-gray-300 focus:outline-none focus:ring-4 focus:ring-indigo-600/15">
                {PLANS.map((plan) => <option key={plan} value={plan}>{plan}</option>)}
              </select>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-gray-200 p-4 sm:p-5">
              <Button variant="secondary" onClick={() => setAssigningUser(null)}>Cancel</Button>
              <Button variant="primary" onClick={handleAssignPlan}>Save</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
