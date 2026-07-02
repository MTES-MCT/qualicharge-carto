"use client";

import Image from "next/image";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Card } from "@codegouvfr/react-dsfr/Card";

import { withBasePath } from "@/lib/base-path";
import type { LoadState } from "@/types/irve-runtime";

export interface LoadingOverlayProps {
  loadState: LoadState;
}

export function LoadingOverlay({ loadState }: LoadingOverlayProps) {
  if (loadState.status === "done") return null;

  const stationLabel = `${loadState.loaded} station${loadState.loaded > 1 ? "s" : ""} chargée${
    loadState.loaded > 1 ? "s" : ""
  }`;

  return (
    <div
      className="irve-loading-overlay absolute bottom-8 left-1/2 z-[1000] w-[min(32rem,calc(100%-1rem))] -translate-x-1/2 px-2 md:w-[min(34rem,calc(100%-2rem))] md:px-0"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {loadState.status === "error" ? (
        <Alert
          severity="error"
          small
          title="Erreur de chargement"
          description={loadState.error || "Une erreur est survenue pendant le chargement des bornes."}
        />
      ) : (
        <Card
          title="Chargement des bornes"
          titleAs="h3"
          size="small"
          border
          end={
            <div className="flex flex-col items-center gap-4 py-1 text-center">
              <div className="flex w-full flex-col items-center gap-3">
                <Image
                  className="h-14 w-14 shrink-0 object-contain"
                  src={withBasePath("/images/loading.gif")}
                  alt=""
                  aria-hidden="true"
                  unoptimized
                  width={56}
                  height={56}
                />
                <div className="flex min-w-0 flex-col items-center gap-2">
                  <p className="m-0 text-base font-bold leading-6 text-[#161616]">
                    {loadState.message || "Chargement des bornes IRVE..."}
                  </p>
                </div>
              </div>
              <Badge noIcon severity="info">{loadState.loaded > 0 ? stationLabel : "Préparation des données"}</Badge>
            </div>
          }
        />
      )}
    </div>
  );
}
