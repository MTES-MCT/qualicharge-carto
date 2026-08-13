export const DEFAULT_TARIFF_PARQUET_DIR = "data/tariffs";
export const DEFAULT_TARIFFS_PARQUET_URL = "http://localhost:8020/d/tariffs.parquet";
export const DEFAULT_IRVE_DATA_SOURCE = "opendata";

export const MIN_DISPLAYED_POWER_KW = 50;
export const ACTIVE_STATION_MAX_STATUS_AGE_DAYS = 30;
export const DYNAMIC_STATUS_FRESHNESS_MAX_AGE_HOURS = 24;
export const cacheOptions: RequestInit = { cache: "no-store" };

export type IRVEDataSource = "datagouv" | "opendata";
export type TariffSourceMode = "local-files" | "consolidated";

export function getIRVEDataSource(): IRVEDataSource {
  const source = process.env.IRVE_DATA_SOURCE || DEFAULT_IRVE_DATA_SOURCE;
  if (source === "datagouv" || source === "opendata") {
    return source;
  }

  throw new Error(`Invalid IRVE_DATA_SOURCE "${source}". Expected "opendata" or "datagouv".`);
}

export function getTariffParquetDir() {
  return process.env.TARIFF_PARQUET_DIR || DEFAULT_TARIFF_PARQUET_DIR;
}

export function getTariffSourceMode(): TariffSourceMode {
  return process.env.TARIFF_SOURCE_MODE === "consolidated" ? "consolidated" : "local-files";
}

export function getConsolidatedTariffUrl() {
  return process.env.TARIFFS_PARQUET_URL || DEFAULT_TARIFFS_PARQUET_URL;
}
