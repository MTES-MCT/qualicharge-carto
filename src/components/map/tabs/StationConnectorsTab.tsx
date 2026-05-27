"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Accordion } from "@codegouvfr/react-dsfr/Accordion";
import { Badge } from "@codegouvfr/react-dsfr/Badge";

import {
  getConnectorStateSeverity,
  getEtatPriseLabel,
  getOccupationLabel,
  getOccupationSeverity,
} from "@/lib/irve/formatters";
import type { ConnectorsTabProps } from "./shared";

function ConnectorAccordion({
  label,
  iconPath,
  maxPower,
  availableCount,
  totalCount,
  pdcs,
  connectorStatuses,
}: ConnectorsTabProps["connectorStatusItems"][number]) {
  const [expanded, setExpanded] = useState(false);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    const node = contentRef.current;
    if (!node) {
      return;
    }

    const updateHeight = () => {
      setContentHeight(node.scrollHeight);
    };

    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <Accordion
      label={
        <div className="flex w-full flex-wrap items-center justify-between gap-4 pr-6">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white">
              <Image
                className="h-10 w-10 object-contain"
                src={iconPath}
                alt=""
                aria-hidden="true"
                width={40}
                height={40}
              />
            </div>
            <div className="min-w-0">
              <p className="mb-1 text-sm text-(--text-mention-grey)">{label}</p>
              <p className="mb-0 text-lg font-bold text-(--text-title-grey)">{maxPower} kW max</p>
            </div>
          </div>

          <Badge severity={availableCount > 0 ? "success" : "warning"} small>
            {availableCount} / {totalCount} PDC libres
          </Badge>
        </div>
      }
      expanded={expanded}
      onExpandedChange={(nextExpanded) => setExpanded(nextExpanded)}
      classes={{
        root: "rounded-2xl border border-(--border-default-grey) bg-(--background-default-grey)",
        accordion: "[&_.fr-accordion__btn]:px-4 [&_.fr-accordion__btn]:py-4 [&_.fr-accordion__btn]:hover:bg-transparent [&_.fr-accordion__btn]:before:hidden [&_.fr-accordion__btn]:after:right-4",
        title: "mb-0",
        collapse: "irve-filter-accordion__collapse fr-collapse--expanded",
      }}
    >
      <div
        className={`irve-filter-accordion__inner${expanded ? " is-expanded" : ""}`}
        style={{ maxHeight: expanded ? `${contentHeight}px` : "0px" }}
      >
        <div ref={contentRef} className="space-y-4 pb-4">
          <div className="space-y-2">
            {pdcs.map((pdc, index) => (
              <div
                key={`${label}-${pdc.id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white py-3"
              >
                <div className="min-w-0 flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-(--border-default-grey) bg-(--background-alt-grey) text-lg font-medium text-(--text-title-grey)">
                    {index + 1}
                  </div>
                  <p className="m-0! text-xs! break-all text-(--text-mention-grey)">{pdc.id}</p>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2">
                  <Badge small severity={getConnectorStateSeverity(pdc.connectorStatus)}>
                    {getEtatPriseLabel(pdc.connectorStatus)}
                  </Badge>
                  <Badge small severity={getOccupationSeverity(pdc.occupationStatus ?? undefined)}>
                    {getOccupationLabel(pdc.occupationStatus)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>

          {!connectorStatuses.some((status) => status != null) ? (
            <p className="mb-0 text-xs! text-(--text-mention-grey)">
              Pas de statut dynamique specifique pour ce type de prise. Seul l&apos;etat du PDC est disponible.
            </p>
          ) : null}
        </div>
      </div>
    </Accordion>
  );
}

export function StationConnectorsTab({ connectorStatusItems }: ConnectorsTabProps) {
  return (
    <div className="irve-sidepanel__tab-stack">
      <div className="space-y-3">
        {connectorStatusItems.length > 0 ? (
          connectorStatusItems.map((connector) => (
            <ConnectorAccordion key={connector.label} {...connector} />
          ))
        ) : (
          <p className="irve-sidepanel__missing">Aucun connecteur renseigné.</p>
        )}
      </div>
    </div>
  );
}
