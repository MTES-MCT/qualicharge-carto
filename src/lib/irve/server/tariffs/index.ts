import { getConsolidatedTariffUrl, getTariffParquetDir, getTariffSourceMode } from "../config";
import { selectApplicableTariffs } from "./applicable";
import { loadConsolidatedTariffs } from "./load-consolidated";
import { loadLocalTariffFiles } from "./load-local-files";
import type { ApplicableTariffsByPdc, IndexedTariff } from "./types";

async function loadTariffs() {
  if (getTariffSourceMode() === "consolidated") {
    return loadConsolidatedTariffs(getConsolidatedTariffUrl());
  }

  return loadLocalTariffFiles(getTariffParquetDir());
}

export async function loadApplicableTariffs(at: Date) {
  const tariffs = await loadTariffs();
  return selectApplicableTariffs(tariffs, at);
}

export async function loadApplicableTariffsSafely(at: Date): Promise<ApplicableTariffsByPdc> {
  try {
    return await loadApplicableTariffs(at);
  } catch (error) {
    console.error("Failed to load IRVE tariffs", error);

    return new Map<string, IndexedTariff>();
  }
}

export function toPublicTariff(tariff: IndexedTariff | undefined) {
  if (!tariff) {
    return undefined;
  }

  return {
    id: tariff.id,
    original_id: tariff.original_id,
    original_last_updated: tariff.original_last_updated,
    raw: tariff.raw,
    parsed: tariff.parsed,
    start: tariff.start,
    end: tariff.end,
    id_pdc_itinerance: tariff.id_pdc_itinerance,
  };
}
