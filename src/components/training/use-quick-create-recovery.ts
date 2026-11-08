"use client";

import { usePlanningRecovery } from "./use-planning-recovery";
import { QUICK_CREATE_RECOVERY_KEY, quickCreateRecoverySchema, type QuickCreateRecovery } from "./quick-create-recovery";

export function useQuickCreateRecovery(value: unknown, onRestore: (value: QuickCreateRecovery) => void) {
  return usePlanningRecovery(QUICK_CREATE_RECOVERY_KEY, quickCreateRecoverySchema, value, onRestore);
}
