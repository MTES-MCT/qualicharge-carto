import { cacheOptions } from "../config";
import { parseCsvRecordStream } from "../csv";
import { getParquetRowCount, readParquetRowBatch, readRemoteParquetBuffer } from "../parquet";
import type { IRVESourceLoader, StaticSourceRow } from "./types";

const DATASET_SLUG =
  "infrastructures-de-recharge-pour-vehicules-electriques-donnees-ouvertes";
const STATIC_RESOURCE_ID = "8bb0a6e2-1016-42ba-aaee-f72f55c82e9f";
const DYNAMIC_RESOURCE_ID = "411443b1-6667-473f-8217-1c57c167408f";
const ROW_BATCH_SIZE = 20_000;

type DataGouvResource = {
  latest?: unknown;
  extras?: Record<string, unknown>;
};

async function getDataGouvResource(resourceId: string) {
  const apiUrl = `https://www.data.gouv.fr/api/1/datasets/${DATASET_SLUG}/resources/${resourceId}/`;
  const response = await fetch(apiUrl, cacheOptions);

  if (!response.ok) {
    throw new Error(`Unable to resolve data.gouv.fr resource ${resourceId}: HTTP ${response.status}`);
  }

  return (await response.json()) as DataGouvResource;
}

export async function getDataGouvStaticParquetUrl() {
  const resource = await getDataGouvResource(STATIC_RESOURCE_ID);
  const parquetUrl = resource.extras?.["analysis:parsing:parquet_url"];
  if (typeof parquetUrl === "string" && parquetUrl.length > 0) {
    return parquetUrl;
  }

  throw new Error(
    `Unable to resolve data.gouv.fr parquet resource ${STATIC_RESOURCE_ID}: missing analysis:parsing:parquet_url`
  );
}

export async function getDataGouvDynamicCsvUrl() {
  const resource = await getDataGouvResource(DYNAMIC_RESOURCE_ID);
  if (typeof resource.latest === "string" && resource.latest.length > 0) {
    return resource.latest;
  }

  throw new Error(
    `Unable to resolve data.gouv.fr dynamic resource ${DYNAMIC_RESOURCE_ID}: missing latest URL`
  );
}

async function* streamDataGouvDynamicRows() {
  const response = await fetch(await getDataGouvDynamicCsvUrl(), cacheOptions);
  if (!response.ok) {
    throw new Error(`Unable to fetch data.gouv.fr dynamic IRVE CSV: HTTP ${response.status}`);
  }

  if (!response.body) {
    throw new Error("Unable to fetch data.gouv.fr dynamic IRVE CSV: missing response body");
  }

  yield* parseCsvRecordStream(response.body);
}

async function* streamDataGouvStaticRows() {
  const file = await readRemoteParquetBuffer(await getDataGouvStaticParquetUrl());
  const rowCount = await getParquetRowCount(file);

  for (let rowStart = 0; rowStart < rowCount; rowStart += ROW_BATCH_SIZE) {
    const rowEnd = Math.min(rowStart + ROW_BATCH_SIZE, rowCount);
    const rows = await readParquetRowBatch<StaticSourceRow>(file, rowStart, rowEnd);

    yield* rows;
  }
}

export const dataGouvSourceLoader: IRVESourceLoader = {
  source: "datagouv",
  streamDynamicRows: streamDataGouvDynamicRows,
  streamStaticRows: streamDataGouvStaticRows,
};
