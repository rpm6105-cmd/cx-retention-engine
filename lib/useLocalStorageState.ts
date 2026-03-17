"use client";

import { useEffect, useState } from "react";
import { readJson, writeJson } from "@/lib/storage";

export function useLocalStorageState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setValue(readJson(key, initialValue));
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (!hydrated) return;
    writeJson(key, value);
  }, [hydrated, key, value]);

  return [value, setValue] as const;
}

