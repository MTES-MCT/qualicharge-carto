import { toIsoString, toRequiredString } from "../coerce";
import { readParquetRows, readRemoteParquetBuffer } from "../parquet";
import { parseTariffRaw, stringifyTariffRaw } from "./tariff-raw";
import type { ConsolidatedTariffParquetRow, IndexedTariff } from "./types";

function getTariffIdentity(raw: IndexedTariff["parsed"]) {
  const countryCode = toRequiredString(raw?.country_code);
  const partyId = toRequiredString(raw?.party_id);
  const rawId = toRequiredString(raw?.id);
  const lastUpdated = toIsoString(raw?.last_updated);

  if (!countryCode || !partyId || !rawId || !lastUpdated) {
    return null;
  }

  const originalId = `${countryCode}${partyId}${rawId}`;

  return {
    id: `${originalId}::${lastUpdated}`,
    originalId,
    lastUpdated,
  };
}

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

export async function loadConsolidatedTariffs(url: string) {
  const file = await readRemoteParquetBuffer(url);
  const rows = await readParquetRows<ConsolidatedTariffParquetRow>(file);

  return rows.flatMap((row): IndexedTariff[] => {
    const parsed = parseTariffRaw(row.raw);
    const identity = getTariffIdentity(parsed);
    if (!identity) {
      return [];
    }

    return [{
      id: identity.id,
      original_id: identity.originalId,
      original_last_updated: identity.lastUpdated,
      raw: stringifyTariffRaw(row.raw),
      parsed,
      start: toIsoString(row.start),
      end: toIsoString(row.end),
      id_pdc_itinerance: parseJsonStringArray(row.id_pdc_itinerance),
    }];
  });
}
