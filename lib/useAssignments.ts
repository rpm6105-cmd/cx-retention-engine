"use client";

import { useLocalStorageState } from "@/lib/useLocalStorageState";
import { STORAGE_KEYS } from "@/lib/storageKeys";

export type Assignments = Record<string, string>; // customerId -> CSM name

export function useAssignments() {
  return useLocalStorageState<Assignments>(STORAGE_KEYS.assignments, {});
}

