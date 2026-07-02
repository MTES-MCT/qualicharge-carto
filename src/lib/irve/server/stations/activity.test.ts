import { describe, expect, it } from "vitest";
import type { QualichargeEVSEPdc } from "@/types/irve";

import { ACTIVE_STATION_MAX_STATUS_AGE_DAYS } from "../config";
import { hasRecentDynamicStatus } from "./activity";

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const NOW = new Date("2026-07-02T12:00:00.000Z");

function pdc(horodatage?: string): QualichargeEVSEPdc {
  return {
    dynamic: horodatage ? { horodatage } : undefined,
  } as QualichargeEVSEPdc;
}

describe("hasRecentDynamicStatus", () => {
  it("keeps a station when at least one PDC has a recent status", () => {
    const oldTimestamp = new Date(NOW.getTime() - (ACTIVE_STATION_MAX_STATUS_AGE_DAYS + 1) * DAY_IN_MS);
    const recentTimestamp = new Date(NOW.getTime() - (ACTIVE_STATION_MAX_STATUS_AGE_DAYS - 1) * DAY_IN_MS);

    expect(
      hasRecentDynamicStatus([pdc(oldTimestamp.toISOString()), pdc(recentTimestamp.toISOString())], NOW)
    ).toBe(true);
  });

  it("rejects a station without a dynamic status", () => {
    expect(hasRecentDynamicStatus([pdc()], NOW)).toBe(false);
  });

  it("rejects invalid and expired timestamps", () => {
    const cutoff = new Date(NOW.getTime() - ACTIVE_STATION_MAX_STATUS_AGE_DAYS * DAY_IN_MS);

    expect(hasRecentDynamicStatus([pdc("invalid"), pdc(cutoff.toISOString())], NOW)).toBe(false);
  });
});
