"use client";

import { useLocalStorageState } from "@/lib/useLocalStorageState";
import { STORAGE_KEYS } from "@/lib/storageKeys";

export type Priority = "High" | "Medium" | "Low";
export type Status = "Open" | "In Progress" | "Done";

export type Task = {
  id: string;
  title: string;
  description: string;
  customerId: string;
  customerName: string;
  priority: Priority;
  dueDate: string; // YYYY-MM-DD
  status: Status;
};

const DEFAULT_TASKS: Task[] = [
  {
    id: "TASK-2001",
    title: "Schedule QBR",
    description: "Align on outcomes, adoption, and renewal timeline for next quarter.",
    customerId: "CUST-1024",
    customerName: "Acme Co",
    priority: "Medium",
    dueDate: "2026-03-21",
    status: "Open",
  },
  {
    id: "TASK-2002",
    title: "Escalation review with Support",
    description: "Review escalations, identify root causes, and confirm remediation plan.",
    customerId: "CUST-1025",
    customerName: "Northwind",
    priority: "High",
    dueDate: "2026-03-17",
    status: "In Progress",
  },
  {
    id: "TASK-2003",
    title: "Share adoption playbook",
    description: "Send best-practice playbook and recommend weekly success milestones.",
    customerId: "CUST-1024",
    customerName: "Acme Co",
    priority: "Low",
    dueDate: "2026-03-24",
    status: "Done",
  },
];

export function useTasks() {
  return useLocalStorageState<Task[]>(STORAGE_KEYS.tasks, DEFAULT_TASKS);
}

