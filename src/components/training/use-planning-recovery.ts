"use client";

import { useEffect, useRef, useState } from "react";
import type { z } from "zod";
import { createPlanningSnapshot, readPlanningSnapshot, MAX_RECOVERY_SIZE, type PlanningSnapshot } from "./planning-recovery";

export function usePlanningRecovery<T>(key: string, schema: z.ZodType<T>, value: unknown, onRestore: (value: T) => void) {
  const serialized = JSON.stringify(value);
  const last = useRef(serialized);
  const [storedSerialized, setStoredSerialized] = useState(serialized);
  const [initialized, setInitialized] = useState(false);
  const [pending, setPending] = useState<PlanningSnapshot<T> | null>(null);
  const [status, setStatus] = useState<"idle" | "stored" | "restored" | "unavailable">("idle");
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const snapshot = readPlanningSnapshot(schema, raw);
          if (snapshot) setPending(snapshot);
          else { localStorage.removeItem(key); setStatus("unavailable"); }
        }
      } catch { setStatus("unavailable"); }
      setInitialized(true);
    }, 0);
    return () => clearTimeout(timer);
  }, [key, schema]);
  useEffect(() => {
    if (!initialized || pending || serialized === last.current) return;
    const timer = setTimeout(() => {
      if (serialized === last.current) return;
      try {
        const snapshot = createPlanningSnapshot(schema, JSON.parse(serialized));
        if (!snapshot) { setStatus("unavailable"); return; }
        const raw = JSON.stringify(snapshot);
        if (raw.length > MAX_RECOVERY_SIZE) { setStatus("unavailable"); return; }
        localStorage.setItem(key, raw);
        last.current = serialized;
        setStoredSerialized(serialized);
        setStatus("stored");
      } catch { setStatus("unavailable"); }
    }, 300);
    return () => clearTimeout(timer);
  }, [initialized, key, pending, schema, serialized]);
  function clear() {
    try { localStorage.removeItem(key); setStatus("idle"); } catch { setStatus("unavailable"); }
    last.current = serialized;
    setStoredSerialized(serialized);
    setPending(null);
  }
  function restore() {
    if (!pending) return;
    onRestore(pending.value);
    last.current = JSON.stringify(pending.value);
    setStoredSerialized(last.current);
    setPending(null);
    setStatus("restored");
  }
  const displayStatus: "idle" | "stored" | "restored" | "unavailable" | "saving" = status !== "unavailable" && !pending && serialized !== storedSerialized ? "saving" : status;
  return { pending, status: displayStatus, restore, clear };
}
