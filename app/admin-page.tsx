"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAllUsers, assignPlan, approveUser, logout, type Profile, type Plan } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";

const PLANS: Plan[] = ["Starter", "Pro", "Business"];

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<Profile[]>([]);
  const [search, setSearch] = useState("");
  const [assigningUser, setAssigningUser] = useState<Profile | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan>("Starter");
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // Invite modal state
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePlan, setInvitePlan] = useState<Plan>("Starter");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [inviteError, setInviteError] = useState("");

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/login"); return; }
      if (session.user.email !== "rpm6105@gmail.com") {
        const { data: profile } = await supabase.from("profiles").select("is_owner").eq("id", session.user.id).single();
        if (!profile?.is_owner) { router.replace("/dashboard"); return; }
      }
      const all = await getAllUsers();
      setUsers(all);
      setLoading(false);
    }
    init();
  }, [router]);

  async function handleApprove(user: Profile) {
    setApprovingId(user.email);
    await approveUser(user.email);
    setUsers((prev) => prev.map((u) => u.email === user.email ? { ...u, is_approved: true } : u));
    setApprovingId(null);
  }

  async function handleAssign() {
    if (!assigningUser) return;
    await assignPlan(assigningUser.email, selectedPlan);
    setUsers((prev) => prev.map((u) => u.email === assigningUser.email ? { ...u, plan: selectedPlan } : u));
    setAssigningUser(null);
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteError("");
    setInviteSuccess(false);
    if (!inviteEmail) { setInviteError("Please enter an email address."); return; }
    setInviteLoading(true);
    const { error } = await supabase.auth.admin.inviteUserByEmail(inviteEmail, {
      data: { plan: invitePlan },
      redirectTo: "https://cx-retention-engine.vercel.app/dashboard",
    });
    setInviteLoading(false);
    if (error) {
      setInviteError("Direct invite requires a server-side key. Share this link instead: https://cx-retention-engine.vercel.app/login");
      return;
    }
    setInviteSuccess(true);
    setInviteEmail("");
    const all = await getAllUsers();
    setUsers(all);
  }

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  const pendingUsers = users.filter((u) => !u.is_approved && !u.is_owner);
  const filtered = users.filter(
    (u) => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()),
  );

  const totalUsers = users.filter((u) => !u.is_owner).length;
  const pendingCount = pendingUsers.length;
  const starterCount = users.filter((u) => u.plan === "Starter" && u.is_approved).length;
  const proCount = users.filter((u) => u.plan === "Pro").length;
  const businessCount = users.filter((u) => u.plan === "Business").length;

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

        {/* Header */}
        <header className="rounded-2xl border border-gray-200 bg-white/80 p-4 shadow-sm backdrop-blur sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm shadow-indigo-500/30 ring-1 ring-white/10">
                <span className="text-sm font-extrabold">CX</span>
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Owner Dashboard</h1>
                <p className="mt-0.5 text-sm text-gray-600">Manage all signed-up users and their plans.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone="success">Owner</Badge>
              <Button variant="primary" onClick={() => { setInviteOpen(true); setInviteSuccess(false); setInviteError(""); }}>
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path d="M3 4a2 2 0 0 0-2 2v1.161l8.441 4.221a1.25 1.25 0 0 0 1.118 0L19 7.162V6a2 2 0 0 0-2-2H3Z" /><path d="m19 8.839-7.77 3.885a2.75 2.75 0 0 1-2.46 0L1 8.839V14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.839Z" /></svg>
                Invite user
              </Button>
              <Button variant="secondary" onClick={handleLogout}>
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 0 1 5.25 2h5.5A2.25 2.25 0 0 1 13 4.25v2a.75.75 0 0 1-1.5 0v-2a.75.75 0 0 0-.75-.75h-5.5a.75.75 0 0 0-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 0 0 .75-.75v-2a.75.75 0 0 1 1.5 0v2A2.25 2.25 0 0 1 10.75 18h-5.5A2.25 2.25 0 0 1 3 15.75V4.25Z" clipRule="evenodd" /><path fillRule="evenodd" d="M6 10a.75.75 0 0 1 .75-.75h9.546l-1.048-.943a.75.75 0 1 1 1.004-1.114l2.5 2.25a.75.75 0 0 1 0 1.114l-2.5 2.25a.75.75 0 1 1-1.004-1.114l1.048-.943H6.75A.75.75 0 0 1 6 10Z" clipRule="evenodd" /></svg>
                Sign out
              </Button>
            </div>
          </div>
        </header>

        {/* Pending approvals banner */}
        {pendingCount > 0 && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-500 text-white">
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5"><path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" /></svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-amber-900">{pendingCount} user{pendingCount > 1 ? "s" : ""} waiting for approval</div>
                <div className="text-xs text-amber-700">Review and approve their accounts in the table below.</div>
              </div>
            </div>
          </div>
        )}

        {/* KPI Cards */}
        <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Total users", value: totalUsers },
            { label: "Pending", value: pendingCount },
            { label: "Pro", value: proCount },
            { label: "Business", value: businessCount },
          ].map((kpi) => (
            <div key={kpi.label} className={`rounded-2xl border bg-white p-5 shadow-sm shadow-gray-900/5 ${kpi.label === "Pending" && pendingCount > 0 ? "border-amber-200 bg-amber-50" : "border-gray-200"}`}>
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">{kpi.label}</div>
              <div className={`mt-2 text-3xl font-semibold tabular-nums tracking-tight ${kpi.label === "Pending" && pendingCount > 0 ? "text-amber-700" : "text-gray-900"}`}>{kpi.value}</div>
            </div>
          ))}
        </section>

        {/* Users Table */}
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-col gap-3 border-b border-gray-200 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">All Users</h2>
              <p className="mt-0.5 text-xs text-gray-600">Approve accounts and assign plans.</p>
            </div>
            <div className="relative w-full sm:w-72">
              <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path fillRule="evenodd" d="M8.5 3.5a5 5 0 1 0 3.846 8.19l2.732 2.732a.75.75 0 1 0 1.06-1.06l-2.732-2.732A5 5 0 0 0 8.5 3.5ZM5 8.5a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0Z" clipRule="evenodd" /></svg>
              </div>
              <input placeholder="Search users…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-900 shadow-sm outline-none placeholder:text-gray-400 focus:border-gray-300 focus:outline-none focus:ring-4 focus:ring-indigo-600/15" />
            </div>
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
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-gray-400">No users found.</td></tr>
                )}
                {filtered.map((u) => (
                  <tr key={u.email} className={`group transition-colors hover:bg-gray-50/80 ${!u.is_approved && !u.is_owner ? "bg-amber-50/50" : ""}`}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-xs font-semibold text-white shadow-sm shadow-indigo-600/20 ring-1 ring-indigo-600/15">
                          {u.name.split(" ").slice(0, 2).map((p) => p[0]).join("")}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-medium text-gray-900">{u.name}</div>
                          {u.is_owner && <div className="text-xs font-semibold text-indigo-600">Owner</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-700">{u.email}</td>
                    <td className="px-5 py-4">
                      {u.is_owner ? (
                        <Badge tone="success">Owner</Badge>
                      ) : u.is_approved ? (
                        <Badge tone="success">Approved</Badge>
                      ) : (
                        <Badge tone="warning">Pending</Badge>
                      )}
                    </td>
                    <td className="px-5 py-4"><Badge tone={planTone(u.plan)}>{u.plan}</Badge></td>
                    <td className="px-5 py-4 whitespace-nowrap text-gray-700">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="px-5 py-4 text-right">
                      {!u.is_owner && (
                        <div className="inline-flex items-center gap-2">
                          {!u.is_approved && (
                            <button
                              disabled={approvingId === u.email}
                              onClick={() => handleApprove(u)}
                              className="rounded-lg px-2 py-1 text-xs font-semibold text-white bg-indigo-600 transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-600/15 disabled:opacity-60"
                            >
                              {approvingId === u.email ? "Approving…" : "Approve"}
                            </button>
                          )}
                          <button
                            className="rounded-lg px-2 py-1 text-xs font-semibold text-gray-700 opacity-0 transition hover:bg-gray-100 hover:text-gray-900 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-4 focus:ring-indigo-600/15"
                            onClick={() => { setAssigningUser(u); setSelectedPlan(u.plan); }}
                          >
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

      {/* Invite Modal */}
      {inviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget) setInviteOpen(false); }}>
          <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white shadow-lg shadow-slate-900/15">
            <div className="border-b border-gray-200 p-4 sm:p-5">
              <div className="text-sm font-semibold text-gray-900">Invite user</div>
              <div className="mt-0.5 text-xs text-gray-600">Send an invite link to a new user.</div>
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
                  <input id="invite-email" type="email" placeholder="user@company.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm outline-none placeholder:text-gray-400 focus:border-gray-300 focus:outline-none focus:ring-4 focus:ring-indigo-600/15" />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="invite-plan" className="text-xs font-semibold text-gray-700">Assign plan</label>
                  <select id="invite-plan" value={invitePlan} onChange={(e) => setInvitePlan(e.target.value as Plan)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-900 shadow-sm outline-none focus:border-gray-300 focus:outline-none focus:ring-4 focus:ring-indigo-600/15">
                    {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <div className="text-xs font-semibold text-gray-700 mb-1.5">Or share signup link directly</div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 truncate rounded-lg bg-white border border-gray-200 px-2 py-1.5 text-xs text-gray-700">https://cx-retention-engine.vercel.app/login</code>
                    <button type="button" onClick={() => navigator.clipboard.writeText("https://cx-retention-engine.vercel.app/login")} className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50">Copy</button>
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

      {/* Assign Plan Modal */}
      {assigningUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget) setAssigningUser(null); }}>
          <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white shadow-lg shadow-slate-900/15">
            <div className="border-b border-gray-200 p-4 sm:p-5">
              <div className="text-sm font-semibold text-gray-900">Assign Plan</div>
              <div className="mt-0.5 text-xs text-gray-600">{assigningUser.name} · {assigningUser.email}</div>
            </div>
            <div className="space-y-2 p-4 sm:p-5">
              <label className="text-xs font-semibold text-gray-700">Plan</label>
              <select value={selectedPlan} onChange={(e) => setSelectedPlan(e.target.value as Plan)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-900 shadow-sm outline-none focus:border-gray-300 focus:outline-none focus:ring-4 focus:ring-indigo-600/15">
                {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-gray-200 p-4 sm:p-5">
              <Button variant="secondary" onClick={() => setAssigningUser(null)}>Cancel</Button>
              <Button variant="primary" onClick={handleAssign}>Save</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
