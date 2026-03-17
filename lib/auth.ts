import { supabase } from "@/lib/supabase";

export type Plan = "Starter" | "Pro" | "Business";

export interface Profile {
  id: string;
  name: string;
  email: string;
  plan: Plan;
  is_owner: boolean;
  created_at: string;
}

export interface Session {
  id: string;
  email: string;
  name: string;
  plan: Plan;
  isOwner: boolean;
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
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: error.message };
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
  };
}

export async function assignPlan(email: string, plan: Plan) {
  await supabase
    .from("profiles")
    .update({ plan })
    .eq("email", email.toLowerCase());
}

export async function getAllUsers(): Promise<Profile[]> {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []) as Profile[];
}
