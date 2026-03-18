"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Plan } from "@/lib/auth";

export function usePlan() {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }
      const { data: profile } = await supabase
        .from("profiles")
        .select("plan")
        .eq("id", session.user.id)
        .single();
      if (profile) setPlan(profile.plan as Plan);
      setLoading(false);
    }
    load();
  }, []);

  const isStarter = plan === "Starter";
  const isPro = plan === "Pro";
  const isBusiness = plan === "Business";
  const canUseCopilot = isPro || isBusiness;
  const canExport = isPro || isBusiness;

  return { plan, loading, isStarter, isPro, isBusiness, canUseCopilot, canExport };
}
