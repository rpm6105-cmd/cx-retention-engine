"use client";

import { useEffect, useRef, useState } from "react";
import { getWorkspaceProfile, loadAssignments, saveAssignments, type AssignmentMap } from "@/lib/workspace";

export type Assignments = AssignmentMap;

export function useAssignments(): [Assignments, React.Dispatch<React.SetStateAction<Assignments>>] {
  const [assignments, setAssignments] = useState<Assignments>({});
  const [profileId, setProfileId] = useState<string | null>(null);
  const hydratedRef = useRef(false);

  useEffect(() => {
    let active = true;

    async function load() {
      const profile = await getWorkspaceProfile();
      if (!profile || !active) return;
      setProfileId(profile.id);
      const workspaceAssignments = await loadAssignments(profile);
      if (!active) return;
      setAssignments(workspaceAssignments);
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
      await saveAssignments(profile, assignments);
    }

    sync();
  }, [assignments, profileId]);

  return [assignments, setAssignments];
}
