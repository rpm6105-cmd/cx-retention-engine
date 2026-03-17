import { readJson, writeJson } from "@/lib/storage";

export type Plan = "Starter" | "Pro" | "Business";

export interface AppUser {
  email: string;
  name: string;
  passwordHash: string;
  plan: Plan;
  createdAt: string;
}

export interface Session {
  email: string;
  name: string;
  plan: Plan;
  isOwner: boolean;
}

const OWNER_EMAIL = "rpm6105@gmail.com";
const USERS_KEY = "cx.users.v1";
const SESSION_KEY = "cx.session.v1";

// Simple hash — not cryptographic, sufficient for localStorage demo
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return String(hash);
}

export function getUsers(): AppUser[] {
  return readJson<AppUser[]>(USERS_KEY, []);
}

function saveUsers(users: AppUser[]) {
  writeJson(USERS_KEY, users);
}

export function getSession(): Session | null {
  return readJson<Session | null>(SESSION_KEY, null);
}

export function saveSession(session: Session) {
  writeJson(SESSION_KEY, session);
}

export function clearSession() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(SESSION_KEY);
  }
}

export function signUp(
  name: string,
  email: string,
  password: string,
): { ok: boolean; error?: string } {
  const users = getUsers();
  const exists = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (exists) return { ok: false, error: "An account with this email already exists." };

  const newUser: AppUser = {
    email: email.toLowerCase(),
    name,
    passwordHash: simpleHash(password),
    plan: "Starter",
    createdAt: new Date().toISOString(),
  };

  saveUsers([...users, newUser]);

  saveSession({
    email: newUser.email,
    name: newUser.name,
    plan: newUser.plan,
    isOwner: newUser.email === OWNER_EMAIL,
  });

  return { ok: true };
}

export function login(
  email: string,
  password: string,
): { ok: boolean; error?: string } {
  // Owner account — auto-create if first time
  if (email.toLowerCase() === OWNER_EMAIL) {
    const users = getUsers();
    let owner = users.find((u) => u.email === OWNER_EMAIL);
    if (!owner) {
      owner = {
        email: OWNER_EMAIL,
        name: "Owner",
        passwordHash: simpleHash(password),
        plan: "Business",
        createdAt: new Date().toISOString(),
      };
      saveUsers([...users, owner]);
    }
    if (owner.passwordHash !== simpleHash(password)) {
      return { ok: false, error: "Incorrect password." };
    }
    saveSession({ email: OWNER_EMAIL, name: "Owner", plan: "Business", isOwner: true });
    return { ok: true };
  }

  const users = getUsers();
  const user = users.find((u) => u.email === email.toLowerCase());
  if (!user) return { ok: false, error: "No account found with this email." };
  if (user.passwordHash !== simpleHash(password)) {
    return { ok: false, error: "Incorrect password." };
  }

  saveSession({
    email: user.email,
    name: user.name,
    plan: user.plan,
    isOwner: false,
  });

  return { ok: true };
}

export function assignPlan(email: string, plan: Plan) {
  const users = getUsers();
  const updated = users.map((u) =>
    u.email === email.toLowerCase() ? { ...u, plan } : u,
  );
  saveUsers(updated);
}

export function isOwner(): boolean {
  const session = getSession();
  return session?.isOwner === true;
}
