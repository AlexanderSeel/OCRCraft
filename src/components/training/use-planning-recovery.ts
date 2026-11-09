"use client";

import { useEffect, useRef, useState } from "react";
import type { z } from "zod";
import { createPlanningSnapshot, readPlanningSnapshot, MAX_RECOVERY_SIZE, type PlanningSnapshot } from "./planning-recovery";

function persistSnapshot<T>(key: string, schema: z.ZodType<T>, serialized: string): boolean {
  try {
    const snapshot = createPlanningSnapshot(schema, JSON.parse(serialized));
    if (!snapshot) return false;
    const raw = JSON.stringify(snapshot);
    if (raw.length > MAX_RECOVERY_SIZE) return false;
    localStorage.setItem(key, raw);
    return true;
  } catch { return false; }
}

export function usePlanningRecovery<T>(key: string, schema: z.ZodType<T>, value: unknown, onRestore: (value: T) => void) {
  const serialized = JSON.stringify(value);
  const last = useRef(serialized);
  const [storedSerialized, setStoredSerialized] = useState(serialized);
  const [initialized, setInitialized] = useState(false);
  const [pending, setPending] = useState<PlanningSnapshot<T> | null>(null);
  const [status, setStatus] = useState<"idle" | "stored" | "restored" | "unavailable">("idle");
  const committed = useRef<{ key: string; serialized: string; allowed: boolean } | null>(null);
  useEffect(() => { committed.current = { key, serialized, allowed: initialized && !pending }; });
  useEffect(() => {
    const flush = (updateUi = false) => {
      const value = committed.current;
      if (value?.key === key && value.allowed && value.serialized !== last.current) {
        if (persistSnapshot(key, schema, value.serialized)) {
          last.current = value.serialized;
          if (updateUi) { setStoredSerialized(value.serialized); setStatus("stored"); }
        }
      }
    };
    const onPageHide = () => flush(true);
    window.addEventListener("pagehide", onPageHide);
    return () => { window.removeEventListener("pagehide", onPageHide); flush(); };
  }, [key, schema]);
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
      if (persistSnapshot(key, schema, serialized)) {
        last.current = serialized;
        setStoredSerialized(serialized);
        setStatus("stored");
      } else { setStatus("unavailable"); }
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
