import type { QualichargeEVSEPdc } from "@/types/irve";

import { ACTIVE_STATION_MAX_STATUS_AGE_DAYS } from "../config";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export function getLatestDynamicStatusTimestamp(pdcs: QualichargeEVSEPdc[]) {
  let latestTimestamp: number | null = null;

  for (const pdc of pdcs) {
    const timestamp = Date.parse(pdc.dynamic?.horodatage ?? "");
    if (Number.isFinite(timestamp) && (latestTimestamp === null || timestamp > latestTimestamp)) {
      latestTimestamp = timestamp;
    }
  }

  return latestTimestamp;
}

export function hasRecentDynamicStatus(pdcs: QualichargeEVSEPdc[], at: Date) {
  const cutoff = at.getTime() - ACTIVE_STATION_MAX_STATUS_AGE_DAYS * DAY_IN_MS;
  const latestTimestamp = getLatestDynamicStatusTimestamp(pdcs);

  return latestTimestamp !== null && latestTimestamp > cutoff;
}
