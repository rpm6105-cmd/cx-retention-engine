"use client";

import { useLocalStorageState } from "@/lib/useLocalStorageState";
import { STORAGE_KEYS } from "@/lib/storageKeys";
import { DEFAULT_CUSTOMERS, type CustomerRow } from "@/lib/customersData";

export function useCustomers() {
  return useLocalStorageState<CustomerRow[]>(STORAGE_KEYS.customers, DEFAULT_CUSTOMERS);
}

