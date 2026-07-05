import type { QualichargeEVSEPdc } from "@/types/irve";

import { isRecentDynamicStatus } from "@/lib/irve/dynamic-status";

export { getLatestDynamicStatusTimestamp } from "@/lib/irve/dynamic-status";

export function hasRecentDynamicStatus(pdcs: QualichargeEVSEPdc[], at: Date) {
  return pdcs.some((pdc) => isRecentDynamicStatus(pdc.dynamic, at));
}
