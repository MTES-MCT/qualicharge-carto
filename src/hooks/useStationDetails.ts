"use client";

import { useEffect, useState } from "react";

import { withBasePath } from "@/lib/base-path";
import type { QualichargeEVSEConsolidated } from "@/types/irve";

export interface UseStationDetailsResult {
  station: QualichargeEVSEConsolidated | null;
  isLoading: boolean;
  error: string | null;
}

export function useStationDetails(stationKey: string | null): UseStationDetailsResult {
  const [station, setStation] = useState<QualichargeEVSEConsolidated | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!stationKey) {
      setStation(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    const key = stationKey;
    const controller = new AbortController();

    async function loadStation() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(withBasePath(`/api/irve/stations/${encodeURIComponent(key)}/`), {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(payload?.error || `Erreur HTTP ${response.status}`);
        }

        const payload = (await response.json()) as QualichargeEVSEConsolidated;
        setStation(payload);
      } catch (requestError) {
        if (controller.signal.aborted) {
          return;
        }

        setStation(null);
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Une erreur est survenue pendant le chargement de la station."
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadStation();

    return () => {
      controller.abort();
    };
  }, [stationKey]);

  return { station, isLoading, error };
}
