import { cacheOptions } from "../config";
import { parseCsvRecordStream } from "../csv";
import type { IRVESourceLoader } from "./types";

type OpenDataDataset = "statiques" | "statuses";

function getRequiredEnvironmentVariable(name: "OPENDATA_BASE_URL" | "OPENDATA_PASSWORD" | "OPENDATA_USERNAME") {
  const value = process.env[name];
  if (value == null || value.length === 0) {
    throw new Error(`Missing required environment variable ${name}`);
  }

  return value;
}

function getOpenDataDatasetUrl(dataset: OpenDataDataset) {
  const rawBaseUrl = getRequiredEnvironmentVariable("OPENDATA_BASE_URL");
  let baseUrl: URL;

  try {
    baseUrl = new URL(rawBaseUrl);
  } catch {
    throw new Error("Invalid OPENDATA_BASE_URL");
  }

  if (baseUrl.protocol !== "http:" && baseUrl.protocol !== "https:") {
    throw new Error("Invalid OPENDATA_BASE_URL: expected an HTTP(S) URL");
  }

  baseUrl.pathname = `${baseUrl.pathname.replace(/\/+$/, "")}/`;
  baseUrl.search = "";
  baseUrl.hash = "";

  return new URL(`d/${dataset}.csv`, baseUrl).toString();
}

function getOpenDataRequestInit(): RequestInit {
  const username = getRequiredEnvironmentVariable("OPENDATA_USERNAME");
  const password = getRequiredEnvironmentVariable("OPENDATA_PASSWORD");
  const authorization = Buffer.from(`${username}:${password}`, "utf8").toString("base64");

  return {
    ...cacheOptions,
    headers: {
      Accept: "text/csv",
      Authorization: `Basic ${authorization}`,
    },
  };
}

async function* streamOpenDataCsv(dataset: OpenDataDataset) {
  const response = await fetch(getOpenDataDatasetUrl(dataset), getOpenDataRequestInit());
  if (!response.ok) {
    throw new Error(`Unable to fetch opendata ${dataset} CSV: HTTP ${response.status}`);
  }

  if (!response.body) {
    throw new Error(`Unable to fetch opendata ${dataset} CSV: missing response body`);
  }

  yield* parseCsvRecordStream(response.body);
}

export const openDataSourceLoader: IRVESourceLoader = {
  source: "opendata",
  streamDynamicRows() {
    return streamOpenDataCsv("statuses");
  },
  streamStaticRows() {
    return streamOpenDataCsv("statiques");
  },
};
