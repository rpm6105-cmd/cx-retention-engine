"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { CustomerRow } from "@/lib/customersData";

export function useCustomers(): [CustomerRow[], React.Dispatch<React.SetStateAction<CustomerRow[]>>] {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.id) setUserId(session.user.id);
    });
  }, []);

  useEffect(() => {
    if (!userId) return;

    async function load() {
      const { data } = await supabase
        .from("customers")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

      // No seeding — new users start with empty dashboard
      if (!data || data.length === 0) {
        setCustomers([]);
      } else {
        setCustomers(
          data.map((r) => ({
            id: r.id,
            name: r.name,
            plan: r.plan,
            mrr: r.mrr,
            lastActivity: r.last_activity,
            logins_last_30_days: r.logins_last_30_days,
            support_tickets: r.support_tickets,
            plan_value: r.plan_value,
            usageTrend: r.usage_trend ?? [],
            tasks: [],
          })),
        );
      }
    }

    load();
  }, [userId]);

  return [customers, setCustomers];
}
