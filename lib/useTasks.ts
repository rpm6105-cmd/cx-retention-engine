"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export type Priority = "High" | "Medium" | "Low";
export type Status = "Open" | "In Progress" | "Done";

export type Task = {
  id: string;
  title: string;
  description: string;
  customerId: string;
  customerName: string;
  priority: Priority;
  dueDate: string;
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

export function useTasks(): [Task[], React.Dispatch<React.SetStateAction<Task[]>>] {
  const [tasks, setTasks] = useState<Task[]>([]);
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
        .from("tasks")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

      if (!data || data.length === 0) {
        // Seed default tasks for new users
        const toInsert = DEFAULT_TASKS.map((t) => ({
          id: t.id,
          user_id: userId,
          customer_id: t.customerId,
          title: t.title,
          due: t.dueDate,
          status: t.status,
        }));
        await supabase.from("tasks").insert(toInsert);
        setTasks(DEFAULT_TASKS);
      } else {
        setTasks(
          data.map((r) => ({
            id: r.id,
            title: r.title,
            description: "",
            customerId: r.customer_id ?? "",
            customerName: "",
            priority: "Medium" as Priority,
            dueDate: r.due,
            status: r.status as Status,
          })),
        );
      }
    }

    load();
  }, [userId]);

  return [tasks, setTasks];
}
