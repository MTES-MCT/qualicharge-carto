import {
  cacheOptions,
  DATA_GOUV_DATASET_SLUG,
  DYNAMIC_PARQUET_RESOURCE_ID,
  FALLBACK_DYNAMIC_PARQUET_URL,
  FALLBACK_STATIC_PARQUET_URL,
  STATIC_PARQUET_RESOURCE_ID,
} from "./config";

type DataGouvResource = {
  extras?: Record<string, unknown>;
};

async function resolveDataGouvParquetUrl(resourceId: string, fallbackUrl: string) {
  const apiUrl = `https://www.data.gouv.fr/api/1/datasets/${DATA_GOUV_DATASET_SLUG}/resources/${resourceId}/`;

  try {
    const response = await fetch(apiUrl, cacheOptions);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const resource = (await response.json()) as DataGouvResource;
    const parquetUrl = resource.extras?.["analysis:parsing:parquet_url"];

    if (typeof parquetUrl === "string" && parquetUrl.length > 0) {
      return parquetUrl;
    }

    throw new Error("missing analysis:parsing:parquet_url");
  } catch (error) {
    console.warn(`Unable to resolve data.gouv.fr parquet resource ${resourceId}, using fallback URL`, error);

    return fallbackUrl;
  }
}

export async function getStaticParquetUrl() {
  if (process.env.STATIC_PARQUET_URL) {
    return process.env.STATIC_PARQUET_URL;
  }

  return resolveDataGouvParquetUrl(STATIC_PARQUET_RESOURCE_ID, FALLBACK_STATIC_PARQUET_URL);
}

export async function getDynamicParquetUrl() {
  if (process.env.DYNAMIC_PARQUET_URL) {
    return process.env.DYNAMIC_PARQUET_URL;
  }

  return resolveDataGouvParquetUrl(DYNAMIC_PARQUET_RESOURCE_ID, FALLBACK_DYNAMIC_PARQUET_URL);
}
