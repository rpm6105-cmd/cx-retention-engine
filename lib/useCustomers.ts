"use client";

import { useEffect, useState } from "react";
import type { CustomerRow } from "@/lib/customersData";
import { getWorkspaceProfile, loadWorkspaceCustomers } from "@/lib/workspace";

export function useCustomers(): [CustomerRow[], React.Dispatch<React.SetStateAction<CustomerRow[]>>] {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);

  useEffect(() => {
    let active = true;

    async function load() {
      const profile = await getWorkspaceProfile();
      if (!profile || !active) return;
      const workspaceCustomers = await loadWorkspaceCustomers(profile);
      if (!active) return;
      setCustomers(workspaceCustomers);
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  return [customers, setCustomers];
}
