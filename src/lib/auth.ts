import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthState = {
  user: User | null;
  isAdmin: boolean;
  ready: boolean;
};

let state: AuthState = { user: null, isAdmin: false, ready: false };
const listeners = new Set<(s: AuthState) => void>();
let initialized = false;

function notify() {
  for (const l of listeners) l(state);
}

async function refreshAdmin(user: User | null) {
  if (!user) return false;
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: user.id,
    _role: "admin",
  });
  if (error) {
    console.error("has_role check failed", error);
    return false;
  }
  return Boolean(data);
}

async function init() {
  if (initialized) return;
  initialized = true;
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user ?? null;
  const isAdmin = await refreshAdmin(user);
  state = { user, isAdmin, ready: true };
  notify();
  supabase.auth.onAuthStateChange(async (_event, session) => {
    const u = session?.user ?? null;
    const admin = await refreshAdmin(u);
    state = { user: u, isAdmin: admin, ready: true };
    notify();
  });
}

export function useAuth() {
  const [s, setS] = useState<AuthState>(state);
  useEffect(() => {
    const cb = (next: AuthState) => setS({ ...next });
    listeners.add(cb);
    init();
    if (state.ready) cb(state);
    return () => {
      listeners.delete(cb);
    };
  }, []);
  return s;
}

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUp(email: string, password: string) {
  return supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: window.location.origin },
  });
}

export async function signOut() {
  return supabase.auth.signOut();
}
