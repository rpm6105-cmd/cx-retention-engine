import { supabase } from "@/lib/supabase";

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

function domainFromEmail(email: string) {
  return email.split("@")[1]?.toLowerCase() ?? "workspace.local";
}

async function ensureCompanyForEmail(email: string) {
  const domain = domainFromEmail(email);
  const { error } = await supabase.from("companies").upsert(
    {
      id: domain,
      name: domain,
      domain,
    },
    { onConflict: "id" },
  );
  if (error && !error.message.toLowerCase().includes("relation \"companies\" does not exist")) {
    throw new Error(`Company setup failed: ${error.message}`);
  }
  return domain;
}

async function ensureProfileFromUser(user: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}) {
  const email = user.email?.toLowerCase();
  if (!email) return null;

  const companyId = await ensureCompanyForEmail(email);
  const name =
    typeof user.user_metadata?.name === "string" && user.user_metadata.name.trim()
      ? user.user_metadata.name.trim()
      : email.split("@")[0];

  const richPayload = {
    id: user.id,
    email,
    name,
    plan: "Starter",
    is_owner: false,
    is_approved: false,
    role: "csm",
    company_id: companyId,
  };

  let upsertResult = await supabase.from("profiles").upsert(richPayload, { onConflict: "id" });

  if (upsertResult.error) {
    const message = upsertResult.error.message.toLowerCase();
    const isSchemaDrift =
      message.includes("column") ||
      message.includes("company_id") ||
      message.includes("role") ||
      message.includes("relation \"companies\" does not exist");

    if (!isSchemaDrift) {
      throw new Error(`Profile setup failed: ${upsertResult.error.message}`);
    }

    upsertResult = await supabase.from("profiles").upsert(
      {
        id: user.id,
        email,
        name,
        is_owner: false,
      },
      { onConflict: "id" },
    );

    if (upsertResult.error) {
      throw new Error(`Profile setup failed: ${upsertResult.error.message}`);
    }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_approved, is_owner")
    .eq("id", user.id)
    .single();

  return profile;
}

export async function signUp(
  name: string,
  email: string,
  password: string,
): Promise<{ ok: boolean; error?: string; requiresEmailConfirmation?: boolean; pendingApproval?: boolean; isOwner?: boolean }> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });
  if (error) return { ok: false, error: error.message };

  if (!data.session) {
    return { ok: true, requiresEmailConfirmation: true };
  }

  let { data: profile } = await supabase
    .from("profiles")
    .select("is_approved, is_owner")
    .eq("id", data.session.user.id)
    .single();

  if (!profile) {
    try {
      profile = await ensureProfileFromUser(data.session.user);
    } catch (setupError) {
      await supabase.auth.signOut();
      return {
        ok: false,
        error: setupError instanceof Error ? setupError.message : "Profile setup failed. Please try again.",
      };
    }
  }

  if (!profile) {
    await supabase.auth.signOut();
    return { ok: false, error: "Profile setup failed. Please try again." };
  }

  if (profile.is_owner) {
    return { ok: true, isOwner: true };
  }

  if (!profile.is_approved) {
    await supabase.auth.signOut();
    return { ok: true, pendingApproval: true };
  }

  return { ok: true };
}

export async function login(
  email: string,
  password: string,
): Promise<{ ok: boolean; error?: string; pendingApproval?: boolean }> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: error.message };

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return { ok: false, error: "Session error." };

  let { data: profile } = await supabase
    .from("profiles")
    .select("is_approved, is_owner")
    .eq("id", session.user.id)
    .single();

  if (!profile) {
    try {
      profile = await ensureProfileFromUser(session.user);
    } catch (setupError) {
      await supabase.auth.signOut();
      return {
        ok: false,
        error: setupError instanceof Error ? setupError.message : "Profile setup failed. Please try again.",
      };
    }
  }

  if (!profile) {
    await supabase.auth.signOut();
    return { ok: false, error: "Profile setup failed. Please try again." };
  }

  if (profile.is_owner) return { ok: true };

  if (!profile.is_approved) {
    await supabase.auth.signOut();
    return { ok: false, pendingApproval: true };
  }

  return { ok: true };
}

export async function logout() {
  await supabase.auth.signOut();
}

export async function getSession(): Promise<Session | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return null;

  let { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .single();

  if (!profile) {
    await ensureProfileFromUser(session.user);
    const retry = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();
    profile = retry.data;
  }

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

export async function approveUser(userId: string) {
  await supabase
    .from("profiles")
    .update({ is_approved: true })
    .eq("id", userId);
}

export async function getAllUsers(): Promise<Profile[]> {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []) as Profile[];
}
