import type { QualichargeTariff } from "@/types/irve";

export type IndexedTariff = QualichargeTariff;

export type ApplicableTariffsByPdc = Map<string, IndexedTariff>;

export type ConsolidatedTariffParquetRow = {
  raw?: unknown;
  start?: unknown;
  end?: unknown;
  id_pdc_itinerance?: unknown;
};

export type LocalTariffParquetRow = {
  original_id?: unknown;
  original_last_updated?: unknown;
  raw?: unknown;
  start?: unknown;
  end?: unknown;
};

export type LocalTariffPdcParquetRow = {
  id_pdc_itinerance?: unknown;
  id_tariff?: unknown;
};
