import { describe, expect, it } from "vitest";

import { getStationRecencyRanks } from "./markerOrder";
import type { IRVEMapStation } from "@/types/irve-runtime";

function station(stationKey: string, timestamp: number | null): IRVEMapStation {
  return {
    station_key: stationKey,
    dynamic_summary: { latest_status_timestamp: timestamp },
  } as IRVEMapStation;
}

describe("getStationRecencyRanks", () => {
  it("gives the highest rank to the most recently updated station", () => {
    const ranks = getStationRecencyRanks([
      station("recent", 300),
      station("old", 100),
      station("middle", 200),
    ]);

    expect(ranks.get("old")).toBe(1);
    expect(ranks.get("middle")).toBe(2);
    expect(ranks.get("recent")).toBe(3);
  });

  it("puts a station without a valid timestamp at the bottom", () => {
    const ranks = getStationRecencyRanks([station("recent", 300), station("missing", null)]);

    expect(ranks.get("missing")).toBe(1);
    expect(ranks.get("recent")).toBe(2);
  });
});
