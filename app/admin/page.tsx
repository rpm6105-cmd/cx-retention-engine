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
      setLoading(false);
    }
    bootstrap();
    return () => { active = false; };
  }, [router]);

  const filteredUsers = users.filter((user) => {
    const query = search.trim().toLowerCase();
    return !query || `${user.name} ${user.email}`.toLowerCase().includes(query);
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
  }

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !profile) return;
    setUploading(true);
    setUploadError("");
    setUploadSuccess("");
    const result = await importCustomersFromCsv(profile, await file.text(), file.name);
    if (!result.ok) {
      setUploadError(result.error);
    } else {
      setUploadSuccess(`${result.customers.length} customers uploaded to workspace "${profile.company_id}".`);
      await refreshWorkspace();
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleAssignmentSave() {
    if (!profile || !selectedCustomerId || !selectedAssigneeId) return;
    try {
      const nextAssignments = { ...assignments, [selectedCustomerId]: selectedAssigneeId };
      await saveAssignments(profile, nextAssignments);
      setAssignments(nextAssignments);
      setAssignmentSuccess("Assignment saved successfully.");
      await refreshWorkspace();
    } catch (error) {
      setAssignmentError("Failed to save assignment.");
    }
  }

  function assignedLabel(customerId: string) {
    const assigned = assignments[customerId];
    if (!assigned) {
      const customer = customers.find((c) => c.id === customerId);
      return customer?.assignedCsmName || "Unassigned";
    }
    const matched = users.find((u) => u.id === assigned || u.email === assigned || u.name === assigned);
    return matched?.name || matched?.email || assigned;
  }

  if (loading) return <div className="p-10 text-center">Loading Admin Workspace...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm">
          <div>
            <h1 className="text-2xl font-bold">Admin Workspace</h1>
            <p className="text-sm text-slate-500">Manage shared company data and user approvals.</p>
          </div>
          <Button variant="secondary" onClick={() => logout().then(() => router.push("/login"))}>Sign Out</Button>
        </header>

        <Card>
          <CardHeader><h2>Master Dataset</h2></CardHeader>
          <CardBody className="space-y-4">
            <div className="flex gap-4">
              <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>Upload CSV</Button>
              <Button variant="secondary" onClick={() => {
                const blob = new Blob([buildRetentionTemplateCsv()], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url; a.download = "template.csv"; a.click();
              }}>Template</Button>
            </div>
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} />
            {uploadSuccess && <div className="text-emerald-600 font-semibold">{uploadSuccess}</div>}
            <div className="text-sm text-slate-600">Latest: {uploads[0]?.fileName ?? "None"} ({uploads[0]?.rowCount ?? 0} rows)</div>
          </CardBody>
        </Card>

        <section className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><h2>Customer Assignments</h2></CardHeader>
            <CardBody className="space-y-4">
              <div className="grid gap-4">
                <select value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)} className="p-2 border rounded-xl">
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select value={selectedAssigneeId} onChange={(e) => setSelectedAssigneeId(e.target.value)} className="p-2 border rounded-xl">
                  {csmUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
                <Button onClick={handleAssignmentSave}>Save Assignment</Button>
              </div>
              <div className="max-h-60 overflow-auto border rounded-xl">
                <table className="w-full text-sm">
                  <thead><tr className="bg-slate-50"><th className="p-2 text-left">Customer</th><th className="p-2 text-left">Assigned To</th></tr></thead>
                  <tbody>
                    {customers.map(c => <tr key={c.id} className="border-t"><td className="p-2">{c.name}</td><td className="p-2">{assignedLabel(c.id)}</td></tr>)}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader><h2>Team Members</h2></CardHeader>
            <CardBody>
              <table className="w-full text-sm">
                <thead><tr className="bg-slate-50"><th className="p-2 text-left">Name</th><th className="p-2 text-left">Role</th></tr></thead>
                <tbody>
                  {filteredUsers.map(u => <tr key={u.id} className="border-t"><td className="p-2">{u.name}</td><td className="p-2">{u.is_owner ? "Owner" : "CSM"}</td></tr>)}
                </tbody>
              </table>
            </CardBody>
          </Card>
        </section>
      </div>
    </div>
  );
}
