"use client";

import { useEffect, useRef, useState } from "react";
import {
  getWorkspaceProfile,
  loadWorkspaceTasks,
  persistTasks,
  type WorkspaceTask,
} from "@/lib/workspace";

export type Priority = WorkspaceTask["priority"];
export type Status = WorkspaceTask["status"];
export type Task = WorkspaceTask;

export function useTasks(): [Task[], React.Dispatch<React.SetStateAction<Task[]>>] {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [profileId, setProfileId] = useState<string | null>(null);
  const hydratedRef = useRef(false);

  useEffect(() => {
    let active = true;

    async function load() {
      const profile = await getWorkspaceProfile();
      if (!profile || !active) return;
      setProfileId(profile.id);
      const workspaceTasks = await loadWorkspaceTasks(profile);
      if (!active) return;
      setTasks(workspaceTasks);
      hydratedRef.current = true;
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hydratedRef.current || !profileId) return;

    async function sync() {
      const profile = await getWorkspaceProfile();
      if (!profile) return;
      await persistTasks(profile, tasks);
    }

    sync();
  }, [tasks, profileId]);

  return [tasks, setTasks];
}
