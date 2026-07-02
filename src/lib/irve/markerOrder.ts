import type { IRVEMapStation } from "@/types/irve-runtime";

export function getStationRecencyRanks(stations: IRVEMapStation[]) {
  const sortedStations = [...stations].sort((a, b) => {
    const timestampDifference =
      (a.dynamic_summary.latest_status_timestamp ?? Number.NEGATIVE_INFINITY) -
      (b.dynamic_summary.latest_status_timestamp ?? Number.NEGATIVE_INFINITY);

    return timestampDifference || a.station_key.localeCompare(b.station_key);
  });

  return new Map(sortedStations.map((station, index) => [station.station_key, index + 1]));
}
