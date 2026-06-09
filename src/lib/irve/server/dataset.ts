import "server-only";

import { MIN_DISPLAYED_POWER_KW, ROW_BATCH_SIZE } from "./config";
import { getStaticParquetUrl } from "./data-gouv";
import { getParquetRowCount, readParquetRowBatch, readRemoteParquetBuffer } from "./parquet";
import { consolidateStation, createMapStation, getDynamicSummary, getStationKey } from "./stations/consolidate";
import { getDynamicKey, loadDynamicRows } from "./stations/dynamic-rows";
import { toStaticRow, type StaticParquetRow } from "./stations/static-row";
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
  const [dynamicMap, applicableTariffs] = await Promise.all([
    loadDynamicRows(),
    loadApplicableTariffsSafely(now),
  ]);
  const staticFile = await readRemoteParquetBuffer(await getStaticParquetUrl());
  const rowCount = await getParquetRowCount(staticFile);
  const stationMap = new Map<string, QualichargeEVSEPdc[]>();

  for (let rowStart = 0; rowStart < rowCount; rowStart += ROW_BATCH_SIZE) {
    const rowEnd = Math.min(rowStart + ROW_BATCH_SIZE, rowCount);
    const rows = await readParquetRowBatch<StaticParquetRow>(staticFile, rowStart, rowEnd);

    for (const row of rows) {
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
  }

  const stations: IRVEMapStation[] = [];
  const stationsByKey = new Map<string, QualichargeEVSEConsolidated>();
  let nextId = 1;

  for (const [stationKey, stationPdcs] of stationMap) {
    const station = consolidateStation(stationPdcs, now);
    if (!station) {
      continue;
    }

    stationsByKey.set(stationKey, station);

    const mapStation = createMapStation(stationKey, station, getDynamicSummary(station.pdcs), nextId);
    nextId += 1;
    if (mapStation) {
      stations.push(mapStation);
    }
  }

  return { stations, stationsByKey };
}
