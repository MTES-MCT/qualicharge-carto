export const DATA_GOUV_DATASET_SLUG =
  "infrastructures-de-recharge-pour-vehicules-electriques-donnees-ouvertes";
export const STATIC_PARQUET_RESOURCE_ID = "8bb0a6e2-1016-42ba-aaee-f72f55c82e9f";
export const DYNAMIC_PARQUET_RESOURCE_ID = "411443b1-6667-473f-8217-1c57c167408f";
export const DEFAULT_TARIFF_PARQUET_DIR = "data/tariffs";
export const DEFAULT_TARIFFS_PARQUET_URL = "http://localhost:8020/d/tariffs.parquet";

export const ROW_BATCH_SIZE = 20_000;
export const MIN_DISPLAYED_POWER_KW = 50;
export const cacheOptions: RequestInit = { cache: "no-store" };

export type TariffSourceMode = "local-files" | "consolidated";

export function getTariffParquetDir() {
  return process.env.TARIFF_PARQUET_DIR || DEFAULT_TARIFF_PARQUET_DIR;
}

export function getTariffSourceMode(): TariffSourceMode {
  return process.env.TARIFF_SOURCE_MODE === "consolidated" ? "consolidated" : "local-files";
}

export function getConsolidatedTariffUrl() {
  return process.env.TARIFFS_PARQUET_URL || DEFAULT_TARIFFS_PARQUET_URL;
}
