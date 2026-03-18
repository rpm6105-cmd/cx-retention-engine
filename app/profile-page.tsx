"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";

type Plan = "Starter" | "Pro" | "Business";

export default function ProfilePage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState<Plan>("Starter");
  const [createdAt, setCreatedAt] = useState("");
  const [loading, setLoading] = useState(true);

  const [editName, setEditName] = useState("");
  const [nameLoading, setNameLoading] = useState(false);
  const [nameSuccess, setNameSuccess] = useState(false);
  const [nameError, setNameError] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError] = useState("");

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/login"); return; }

      setUserId(session.user.id);

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("name, email, plan, created_at")
        .eq("id", session.user.id)
        .single();

      if (error || !profile) {
        setLoading(false);
        return;
      }

      setName(profile.name);
      setEditName(profile.name);
      setEmail(profile.email);
      setPlan(profile.plan as Plan);
      setCreatedAt(profile.created_at);
      setLoading(false);
    }
    load();
  }, [router]);

  async function handleUpdateName(e: React.FormEvent) {
    e.preventDefault();
    setNameError("");
    setNameSuccess(false);
    if (!editName.trim()) { setNameError("Name cannot be empty."); return; }
    if (!userId) { setNameError("Not logged in."); return; }
    setNameLoading(true);

    const { error } = await supabase
      .from("profiles")
      .update({ name: editName.trim() })
      .eq("id", userId);

    setNameLoading(false);
    if (error) { setNameError("Failed to update name: " + error.message); return; }
    setName(editName.trim());
    setNameSuccess(true);
    setTimeout(() => setNameSuccess(false), 3000);
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError("");
    setPwSuccess(false);
    if (!newPassword || !confirmPassword) { setPwError("Please fill in all fields."); return; }
    if (newPassword !== confirmPassword) { setPwError("Passwords do not match."); return; }
    if (newPassword.length < 6) { setPwError("Password must be at least 6 characters."); return; }
    setPwLoading(true);

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    setPwLoading(false);
    if (error) { setPwError(error.message); return; }
    setPwSuccess(true);
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => setPwSuccess(false), 3000);
  }

  function planTone(p: Plan): "neutral" | "warning" | "success" {
    if (p === "Business") return "success";
    if (p === "Pro") return "warning";
    return "neutral";
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <svg className="h-5 w-5 animate-spin text-indigo-600" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white">
      <div className="mx-auto max-w-2xl space-y-6 px-1 py-2 sm:px-3 sm:py-6">

        <header className="rounded-2xl border border-gray-200 bg-white/80 p-4 shadow-sm backdrop-blur sm:p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Profile</h1>
              <p className="mt-0.5 text-sm text-gray-600">Manage your account details and password.</p>
            </div>
            <Badge tone={planTone(plan)}>{plan}</Badge>
          </div>
        </header>

        {/* Account info */}
        <Card>
          <CardHeader className="border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900">Account</h2>
            <p className="mt-0.5 text-xs text-gray-600">Your plan and account details.</p>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Email</div>
                <div className="text-sm font-semibold text-gray-900">{email}</div>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Plan</div>
                <Badge tone={planTone(plan)}>{plan}</Badge>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Member since</div>
                <div className="text-sm font-semibold text-gray-900">
                  {createdAt ? new Date(createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—"}
                </div>
              </div>
            </div>

            {plan === "Starter" && (
              <div className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-indigo-600 text-white shadow-sm">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z" clipRule="evenodd" /></svg>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-indigo-900">Upgrade to Pro</div>
                    <p className="mt-0.5 text-xs text-indigo-700">Unlock AI Copilot, CSV exports, and advanced health scoring. Contact your admin to upgrade.</p>
                  </div>
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Update name */}
        <Card>
          <CardHeader className="border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900">Display name</h2>
            <p className="mt-0.5 text-xs text-gray-600">Update how your name appears in the app.</p>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleUpdateName} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="name" className="text-xs font-semibold text-gray-700">Full name</label>
                <input
                  id="name"
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm outline-none placeholder:text-gray-400 focus:border-gray-300 focus:outline-none focus:ring-4 focus:ring-indigo-600/15"
                />
              </div>
              {nameError && <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-700">{nameError}</div>}
              {nameSuccess && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-semibold text-emerald-700">✓ Name updated successfully.</div>}
              <Button type="submit" variant="primary" disabled={nameLoading}>
                {nameLoading ? "Saving…" : "Save name"}
              </Button>
            </form>
          </CardBody>
        </Card>

        {/* Change password */}
        <Card>
          <CardHeader className="border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900">Change password</h2>
            <p className="mt-0.5 text-xs text-gray-600">Update your password to keep your account secure.</p>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="new-password" className="text-xs font-semibold text-gray-700">New password</label>
                <input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Min. 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm outline-none placeholder:text-gray-400 focus:border-gray-300 focus:outline-none focus:ring-4 focus:ring-indigo-600/15"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="confirm-password" className="text-xs font-semibold text-gray-700">Confirm new password</label>
                <input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm outline-none placeholder:text-gray-400 focus:border-gray-300 focus:outline-none focus:ring-4 focus:ring-indigo-600/15"
                />
              </div>
              {pwError && <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-700">{pwError}</div>}
              {pwSuccess && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-semibold text-emerald-700">✓ Password updated successfully.</div>}
              <Button type="submit" variant="primary" disabled={pwLoading}>
                {pwLoading ? "Updating…" : "Update password"}
              </Button>
            </form>
          </CardBody>
        </Card>

      </div>
    </div>
  );
}
