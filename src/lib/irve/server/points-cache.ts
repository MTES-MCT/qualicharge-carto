import "server-only";

import { brotliCompressSync, constants, gzipSync } from "node:zlib";

import { loadIRVEDataset } from "@/lib/irve/server/dataset";
import { jsonReplacer } from "@/lib/json";
import type { QualichargeEVSEConsolidated } from "@/types/irve";
import type { IRVEPointsPayload } from "@/types/irve-runtime";

const DEFAULT_REFRESH_INTERVAL_SECONDS = 300;

interface CachedResponse {
  body: string;
  brotliBody: ArrayBuffer;
  gzipBody: ArrayBuffer;
  loadedAt: number;
  total: number;
  stationsByKey: Map<string, QualichargeEVSEConsolidated>;
}

interface IRVEPointsCacheState {
  response?: CachedResponse;
  refreshPromise?: Promise<CachedResponse>;
  timer?: ReturnType<typeof setInterval>;
}

const globalCache = globalThis as typeof globalThis & {
  __irvePointsCache?: IRVEPointsCacheState;
};

const state = (globalCache.__irvePointsCache ??= {});

function toArrayBuffer(buffer: Buffer): ArrayBuffer {
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
}

function getRefreshIntervalMs() {
  const parsed = Number.parseInt(process.env.PARQUET_REFRESH_INTERVAL_SECONDS ?? "", 10);
  const seconds = Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_REFRESH_INTERVAL_SECONDS;

  return seconds * 1000;
}

async function refreshCache() {
  if (state.refreshPromise) {
    return state.refreshPromise;
  }

  state.refreshPromise = loadIRVEDataset()
    .then(({ stations, stationsByKey }) => {
      const loadedAt = Date.now();
      const payload: IRVEPointsPayload = {
        stations,
        total: stations.length,
        updatedAt: new Date(loadedAt).toISOString(),
      };
      const body = JSON.stringify(payload, jsonReplacer);
      const response = {
        body,
        brotliBody: new ArrayBuffer(0),
        gzipBody: new ArrayBuffer(0),
        loadedAt,
        total: stations.length,
        stationsByKey,
      };
      response.brotliBody = toArrayBuffer(
        brotliCompressSync(response.body, {
          params: {
            [constants.BROTLI_PARAM_QUALITY]: 4,
          },
        })
      );
      response.gzipBody = toArrayBuffer(gzipSync(response.body));

      state.response = response;

      return response;
    })
    .finally(() => {
      state.refreshPromise = undefined;
    });

  return state.refreshPromise;
}

function ensureRefreshTimer() {
  if (state.timer) {
    return;
  }

  state.timer = setInterval(() => {
    void refreshCache().catch((error: unknown) => {
      console.error("Failed to refresh IRVE points cache", error);
    });
  }, getRefreshIntervalMs());

  state.timer.unref?.();
}

export async function getCachedIRVEPointsResponse() {
  ensureRefreshTimer();

  if (!state.response) {
    return refreshCache();
  }

  if (Date.now() - state.response.loadedAt >= getRefreshIntervalMs()) {
    void refreshCache().catch((error: unknown) => {
      console.error("Failed to refresh stale IRVE points cache", error);
    });
  }

  return state.response;
}

export async function getCachedIRVEStation(stationKey: string) {
  const cached = await getCachedIRVEPointsResponse();

  return cached.stationsByKey.get(stationKey) ?? null;
}
