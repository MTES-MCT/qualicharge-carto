export const DEFAULT_STATIC_PARQUET_URL =
  "https://object.files.data.gouv.fr/hydra-parquet/hydra-parquet/8bb0a6e2-1016-42ba-aaee-f72f55c82e9f.parquet";
export const DEFAULT_DYNAMIC_PARQUET_URL =
  "https://object.files.data.gouv.fr/hydra-parquet/hydra-parquet/411443b1-6667-473f-8217-1c57c167408f.parquet";
export const DEFAULT_TARIFF_PARQUET_SOURCE = "qualicharge_tariff.parquet";
export const DEFAULT_TARIFF_PDC_PARQUET_SOURCE = "qualicharge_tariffpdc.parquet";

export const ROW_BATCH_SIZE = 20_000;
export const MIN_DISPLAYED_POWER_KW = 50;
export const cacheOptions: RequestInit = { cache: "no-store" };

export type TariffSourceMode = "local-files" | "consolidated";

export function getStaticParquetUrl() {
  return process.env.STATIC_PARQUET_URL || DEFAULT_STATIC_PARQUET_URL;
}

export function getDynamicParquetUrl() {
  return process.env.DYNAMIC_PARQUET_URL || DEFAULT_DYNAMIC_PARQUET_URL;
}

export function getTariffSourceMode(): TariffSourceMode {
  const mode = process.env.TARIFF_SOURCE_MODE;
  if (mode === "consolidated" || mode === "local-files") {
    return mode;
  }

  return process.env.TARIFFS_PARQUET_URL ? "consolidated" : "local-files";
}

export function getLocalTariffSources() {
  return {
    tariffSource: process.env.TARIFF_PARQUET_SOURCE || DEFAULT_TARIFF_PARQUET_SOURCE,
    tariffPdcSource: process.env.TARIFF_PDC_PARQUET_SOURCE || DEFAULT_TARIFF_PDC_PARQUET_SOURCE,
  };
}

export function getConsolidatedTariffSource() {
  return process.env.TARIFFS_PARQUET_URL || "http://localhost:8020/d/tariffs.parquet";
}
