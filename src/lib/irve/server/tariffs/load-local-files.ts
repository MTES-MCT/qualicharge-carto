import { readParquetRows, readParquetSourceBuffer } from "../parquet";
import { toIsoString, toRequiredString } from "../coerce";
import { parseTariffRaw, stringifyTariffRaw } from "./tariff-raw";
import type { IndexedTariff, LocalTariffParquetRow, LocalTariffPdcParquetRow } from "./types";

function indexTariffs(rows: LocalTariffParquetRow[]) {
  const tariffs: IndexedTariff[] = [];
  const tariffsByReference = new Map<string, IndexedTariff[]>();

  rows.forEach((row, rowIndex) => {
    const originalId = toRequiredString(row.original_id);
    if (!originalId) {
      return;
    }

    const originalLastUpdated = toIsoString(row.original_last_updated);
    const tariff: IndexedTariff = {
      id: `${originalId}::${originalLastUpdated ?? "unknown"}::${rowIndex}`,
      original_id: originalId,
      original_last_updated: originalLastUpdated,
      raw: stringifyTariffRaw(row.raw),
      parsed: parseTariffRaw(row.raw),
      start: toIsoString(row.start),
      end: toIsoString(row.end),
      id_pdc_itinerance: [],
      rowIndex,
    };

    tariffs.push(tariff);
    tariffsByReference.set(originalId, [...(tariffsByReference.get(originalId) ?? []), tariff]);
  });

  return { tariffs, tariffsByReference };
}

function attachPdcReferences(rows: LocalTariffPdcParquetRow[], tariffsByReference: Map<string, IndexedTariff[]>) {
  for (const row of rows) {
    const idPdcItinerance = toRequiredString(row.id_pdc_itinerance);
    const idTariff = toRequiredString(row.id_tariff);
    const tariffs = tariffsByReference.get(idTariff) ?? [];

    if (!idPdcItinerance || tariffs.length === 0) {
      continue;
    }

    for (const tariff of tariffs) {
      if (!tariff.id_pdc_itinerance.includes(idPdcItinerance)) {
        tariff.id_pdc_itinerance.push(idPdcItinerance);
      }
    }
  }
}

export async function loadLocalTariffFiles(tariffSource: string, tariffPdcSource: string) {
  const [tariffFile, tariffPdcFile] = await Promise.all([
    readParquetSourceBuffer(tariffSource),
    readParquetSourceBuffer(tariffPdcSource),
  ]);
  const [tariffRows, tariffPdcRows] = await Promise.all([
    readParquetRows<LocalTariffParquetRow>(tariffFile),
    readParquetRows<LocalTariffPdcParquetRow>(tariffPdcFile),
  ]);
  const { tariffs, tariffsByReference } = indexTariffs(tariffRows);

  attachPdcReferences(tariffPdcRows, tariffsByReference);

  return tariffs;
}
