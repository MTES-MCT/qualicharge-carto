import type { QualichargeEVSEPdc } from "@/types/irve";

import { ACTIVE_STATION_MAX_STATUS_AGE_DAYS } from "../config";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export function hasRecentDynamicStatus(pdcs: QualichargeEVSEPdc[], at: Date) {
  const cutoff = at.getTime() - ACTIVE_STATION_MAX_STATUS_AGE_DAYS * DAY_IN_MS;

  return pdcs.some((pdc) => {
    const timestamp = Date.parse(pdc.dynamic?.horodatage ?? "");

    return Number.isFinite(timestamp) && timestamp > cutoff;
  });
}
