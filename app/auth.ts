import { supabase } from "@/lib/supabase.ts";

export type Plan = "Starter" | "Pro" | "Business";

export interface Profile {
  id: string;
  name: string;
  email: string;
  plan: Plan;
  is_owner: boolean;
  is_approved: boolean;
  created_at: string;
}

export interface Session {
  id: string;
  email: string;
  name: string;
  plan: Plan;
  isOwner: boolean;
  isApproved: boolean;
}

export async function signUp(
  name: string,
  email: string,
  password: string,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function login(
  email: string,
  password: string,
): Promise<{ ok: boolean; error?: string; pendingApproval?: boolean }> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: error.message };

  // Check approval status
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { ok: false, error: "Session error." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_approved, is_owner")
    .eq("id", session.user.id)
    .single();

  // Owner is always approved
  if (profile?.is_owner) return { ok: true };

  // Not approved yet
  if (!profile?.is_approved) {
    // Sign them out so they can't access protected routes
    await supabase.auth.signOut();
    return { ok: false, pendingApproval: true };
  }

  return { ok: true };
}

export async function logout() {
  await supabase.auth.signOut();
}

export async function getSession(): Promise<Session | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .single();

  if (!profile) return null;

  return {
    id: session.user.id,
    email: session.user.email ?? "",
    name: profile.name,
    plan: profile.plan as Plan,
    isOwner: profile.is_owner,
    isApproved: profile.is_approved,
  };
}

export async function assignPlan(email: string, plan: Plan) {
  await supabase
    .from("profiles")
    .update({ plan })
    .eq("email", email.toLowerCase());
}

export async function approveUser(email: string) {
  await supabase
    .from("profiles")
    .update({ is_approved: true })
    .eq("email", email.toLowerCase());
}

export async function getAllUsers(): Promise<Profile[]> {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []) as Profile[];
}
