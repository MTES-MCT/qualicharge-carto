import "server-only";

import { MIN_DISPLAYED_POWER_KW } from "./config";
import { getIRVESourceLoader } from "./sources";
import { hasRecentDynamicStatus } from "./stations/activity";
import { consolidateStation, createMapStation, getDynamicSummary, getStationKey } from "./stations/consolidate";
import { getDynamicKey, loadDynamicRows } from "./stations/dynamic-rows";
import { toStaticRow } from "./stations/static-row";
import { loadApplicableTariffsSafely, toPublicTariff } from "./tariffs";
import type { QualichargeEVSEConsolidated, QualichargeEVSEPdc } from "@/types/irve";
import type { IRVEMapStation } from "@/types/irve-runtime";

function addPdcToStation(stationMap: Map<string, QualichargeEVSEPdc[]>, pdc: QualichargeEVSEPdc) {
  const stationKey = getStationKey(pdc.id_station_itinerance, pdc.id_pdc_itinerance);
  const stationPdcs = stationMap.get(stationKey);

  if (stationPdcs) {
    stationPdcs.push(pdc);
  } else {
    stationMap.set(stationKey, [pdc]);
  }
}

export async function loadIRVEDataset() {
  const now = new Date();
  const sourceLoader = getIRVESourceLoader();
  const [dynamicMap, applicableTariffs] = await Promise.all([
    loadDynamicRows(sourceLoader),
    loadApplicableTariffsSafely(now),
  ]);
  const stationMap = new Map<string, QualichargeEVSEPdc[]>();

  for await (const row of sourceLoader.streamStaticRows()) {
    const staticRow = toStaticRow(row);
    if (staticRow.puissance_nominale < MIN_DISPLAYED_POWER_KW) {
      continue;
    }

    addPdcToStation(stationMap, {
      ...staticRow,
      dynamic: dynamicMap.get(getDynamicKey(staticRow.id_pdc_itinerance)),
      applicable_tariff: toPublicTariff(applicableTariffs.get(staticRow.id_pdc_itinerance)),
    });
  }

  const stations: IRVEMapStation[] = [];
  const stationsByKey = new Map<string, QualichargeEVSEConsolidated>();
  let nextId = 1;

  for (const [stationKey, stationPdcs] of stationMap) {
    if (!hasRecentDynamicStatus(stationPdcs, now)) {
      continue;
    }

    const station = consolidateStation(stationPdcs, now);
    if (!station) {
      continue;
    }

    stationsByKey.set(stationKey, station);

    const mapStation = createMapStation(stationKey, station, getDynamicSummary(station.pdcs, now), nextId);
    nextId += 1;
    if (mapStation) {
      stations.push(mapStation);
    }
  }

  return { stations, stationsByKey };
}
