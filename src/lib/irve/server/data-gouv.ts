import {
  cacheOptions,
  DATA_GOUV_DATASET_SLUG,
  DYNAMIC_PARQUET_RESOURCE_ID,
  STATIC_PARQUET_RESOURCE_ID,
} from "./config";

type DataGouvResource = {
  latest?: unknown;
  extras?: Record<string, unknown>;
};

async function getDataGouvResource(resourceId: string) {
  const apiUrl = `https://www.data.gouv.fr/api/1/datasets/${DATA_GOUV_DATASET_SLUG}/resources/${resourceId}/`;
  const response = await fetch(apiUrl, cacheOptions);

  if (!response.ok) {
    throw new Error(`Unable to resolve data.gouv.fr resource ${resourceId}: HTTP ${response.status}`);
  }

  return (await response.json()) as DataGouvResource;
}

async function resolveDataGouvParquetUrl(resourceId: string) {
  const resource = await getDataGouvResource(resourceId);
  const parquetUrl = resource.extras?.["analysis:parsing:parquet_url"];
  if (typeof parquetUrl === "string" && parquetUrl.length > 0) {
    return parquetUrl;
  }

  throw new Error(`Unable to resolve data.gouv.fr parquet resource ${resourceId}: missing analysis:parsing:parquet_url`);
}

export async function getStaticParquetUrl() {
  return resolveDataGouvParquetUrl(STATIC_PARQUET_RESOURCE_ID);
}

export async function getDynamicCsvUrl() {
  const resource = await getDataGouvResource(DYNAMIC_PARQUET_RESOURCE_ID);
  if (typeof resource.latest === "string" && resource.latest.length > 0) {
    return resource.latest;
  }

  throw new Error(`Unable to resolve data.gouv.fr dynamic resource ${DYNAMIC_PARQUET_RESOURCE_ID}: missing latest URL`);
}
