import { toIsoString, toRequiredString } from "../coerce";
import { readParquetRows, readParquetSourceBuffer } from "../parquet";
import { parseTariffRaw, stringifyTariffRaw } from "./tariff-raw";
import type { ConsolidatedTariffParquetRow, IndexedTariff } from "./types";

function parseJsonStringArray(value: unknown) {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(String(value));
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export async function loadConsolidatedTariffs(source: string) {
  const file = await readParquetSourceBuffer(source);
  const rows = await readParquetRows<ConsolidatedTariffParquetRow>(file);

  return rows.flatMap((row, rowIndex): IndexedTariff[] => {
    const id = toRequiredString(row.id);
    if (!id) {
      return [];
    }

    return [{
      id,
      original_id: row.original_id == null ? null : toRequiredString(row.original_id),
      original_last_updated: toIsoString(row.original_last_updated),
      raw: stringifyTariffRaw(row.raw),
      parsed: parseTariffRaw(row.raw),
      start: toIsoString(row.start),
      end: toIsoString(row.end),
      id_pdc_itinerance: parseJsonStringArray(row.id_pdc_itinerance),
      rowIndex,
    }];
  });
}
