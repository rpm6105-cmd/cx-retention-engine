"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export type Assignments = Record<string, string>;

export function useAssignments(): [Assignments, React.Dispatch<React.SetStateAction<Assignments>>] {
  const [assignments, setAssignments] = useState<Assignments>({});
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
        .from("assignments")
        .select("customer_id, csm_name")
        .eq("user_id", userId);

      if (data) {
        const map: Assignments = {};
        data.forEach((r) => { map[r.customer_id] = r.csm_name; });
        setAssignments(map);
      }
    }

    load();
  }, [userId]);

  // Persist to Supabase whenever assignments change
  useEffect(() => {
    if (!userId || Object.keys(assignments).length === 0) return;

    async function persist() {
      const rows = Object.entries(assignments).map(([customer_id, csm_name]) => ({
        user_id: userId,
        customer_id,
        csm_name,
      }));
      await supabase
        .from("assignments")
        .upsert(rows, { onConflict: "user_id,customer_id" });
    }

    persist();
  }, [assignments, userId]);

  return [assignments, setAssignments];
}
