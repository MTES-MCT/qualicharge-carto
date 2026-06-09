"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Tabs } from "@codegouvfr/react-dsfr/Tabs";

import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { usePanoramaPicture } from "@/hooks/usePanoramaPicture";
import { getPaymentTags } from "@/lib/irve/formatters";
import { buildSections } from "@/lib/irve/sections";
import type { QualichargeEVSEConsolidated } from "@/types/irve";
import type { IRVEMapStation } from "@/types/irve-runtime";
import { MapSidePanel } from "./MapSidePanel";
import { StationAccessTab } from "./tabs/StationAccessTab";
import { StationConnectorsTab } from "./tabs/StationConnectorsTab";
import { StationDetailsTab } from "./tabs/StationDetailsTab";
import { StationEssentialTab } from "./tabs/StationEssentialTab";
import { StationPricingTab } from "./tabs/StationPricingTab";
import { getConnectorStatusItems, type StationTabId } from "./tabs/shared";

export interface StationDetailsPanelProps {
  station: QualichargeEVSEConsolidated | null;
  previewStation: IRVEMapStation | null;
  isLoading: boolean;
  error: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function StationDetailsPanel({
  station,
  previewStation,
  isLoading,
  error,
  isOpen,
  onClose,
}: StationDetailsPanelProps) {
  const { copiedKey, copy, reset } = useCopyToClipboard();
  const [selectedTabId, setSelectedTabId] = useState<StationTabId>("essentiel");
  const panoramaPicture = usePanoramaPicture(station?.coordonneesXY);
  const paymentTags = useMemo(() => (station ? getPaymentTags(station) : []), [station]);
  const sections = useMemo(() => (station ? buildSections(station) : []), [station]);
  const connectorStatusItems = useMemo(() => (station ? getConnectorStatusItems(station) : []), [station]);

  useEffect(() => {
    reset();
  }, [station, reset]);

  const panelTitle = station?.nom_station ?? previewStation?.nom_station ?? "Aucune station sélectionnée";
  // const panelTitle = station ? `${station?.nom_amenageur} / ${station.nom_station}` : "Aucune station sélectionnée";
  const panelSubtitle = station
    ? station.adresse_station
    : isLoading
      ? "Chargement des détails de la station..."
      : "Cliquez sur une fiche depuis la carte pour afficher les détails complets de la station.";
  const panoramaHref = panoramaPicture
    ? `https://api.panoramax.xyz/?focus=pic/${panoramaPicture.lat}/${panoramaPicture.lon}&pic=${panoramaPicture.id}`
    : null;

  const tabComponents: Record<StationTabId, React.ReactNode> = station
    ? {
      essentiel: <StationEssentialTab station={station} copiedKey={copiedKey} copy={copy} />,
      connecteurs: <StationConnectorsTab station={station} connectorStatusItems={connectorStatusItems} />,
      acces: <StationAccessTab station={station} paymentTags={paymentTags} />,
      tarification: <StationPricingTab station={station} mapPricingSummary={previewStation?.summary} />,
      details: <StationDetailsTab station={station} sections={sections} copiedKey={copiedKey} copy={copy} />,
    }
    :
    { essentiel: null, connecteurs: null, acces: null, tarification: null, details: null };

  return (
    <MapSidePanel
      id="station-details"
      className="z-1210!"
      isOpen={isOpen}
      onClose={onClose}
      eyebrow="Station de recharge"
      title={panelTitle}
      subtitle={panelSubtitle}
      labelledById="irve-sidepanel-title"
      headerPicture={panoramaPicture?.imageUrl}
      headerPictureHref={panoramaHref}
    >
      {error ? (
        <Alert
          severity="error"
          small
          title="Erreur de chargement"
          description={error}
        />
      ) : isLoading ? (
        <Alert
          severity="info"
          small
          title="Chargement"
          description="Récupération des informations complètes de la station."
        />
      ) : station ? (
        <Tabs
          className="irve-sidepanel__tabs"
          selectedTabId={selectedTabId}
          onTabChange={(tabId) => setSelectedTabId(tabId as StationTabId)}
          tabs={[
            { tabId: "essentiel", label: "Essentiel", iconId: "fr-icon-information-line" },
             { tabId: "connecteurs", label: "Connecteurs", iconId: "fr-icon-flashlight-line" },
             { tabId: "acces", label: "Services", iconId: "fr-icon-user-line" },
             { tabId: "tarification", label: "Tarifs", iconId: "fr-icon-money-euro-circle-line" },
             { tabId: "details", label: "Détails", iconId: "fr-icon-list-unordered" },
           ]}
        >
          {tabComponents[selectedTabId]}
        </Tabs>
      ) : null}
    </MapSidePanel>
  );
}
