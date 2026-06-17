"use client";

import { useEffect, useState } from "react";

import { withBasePath } from "@/lib/base-path";
import type { IRVEMapStation, IRVEPointsPayload, LoadState } from "@/types/irve-runtime";

export interface UseIRVEDataResult {
  stations: IRVEMapStation[];
  loadState: LoadState;
}

export function useIRVEData(): UseIRVEDataResult {
  const [stations, setStations] = useState<IRVEMapStation[]>([]);
  const [loadState, setLoadState] = useState<LoadState>({
    status: "loading",
    loaded: 0,
    total: 0,
    message: "Chargement des données consolidées...",
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const controller = new AbortController();

    async function loadPoints() {
      try {
        const response = await fetch(withBasePath("/api/irve/points/"), {
          signal: controller.signal,
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(payload?.error || `Erreur HTTP ${response.status}`);
        }

        const payload = (await response.json()) as IRVEPointsPayload;

        setStations(payload.stations);
        setLoadState({
          status: "done",
          loaded: payload.total,
          total: payload.total,
        });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setLoadState((prev) => ({
          ...prev,
          status: "error",
          error: error instanceof Error ? error.message : "Une erreur est survenue pendant le chargement des bornes.",
        }));
      }
    }

    void loadPoints();

    return () => {
      controller.abort();
    };
  }, []);

  return { stations, loadState };
}
