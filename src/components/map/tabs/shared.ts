import type { Dispatch, SetStateAction } from "react";

import { withBasePath } from "@/lib/base-path";
import { getRecentDynamicStatus } from "@/lib/irve/dynamic-status";
import type { DetailSection, DetailItem } from "@/lib/irve/sections";
import {
  EtatPriseEnum,
  type OccupationPDCEnum,
  type ImplantationStation,
  type QualichargeEVSEConsolidated,
  type QualichargeEVSEPdc,
  type AccessibilitePMR,
} from "@/types/irve";
import {
  formatBoolean,
  formatDate,
  formatNullable,
  getPmrLabel,
  isAvailablePdc,
  getStationTypeLabel,
} from "@/lib/irve/formatters";

export type StationTabId = "essentiel" | "connecteurs" | "acces" | "tarification" | "details";

export type StationDetailsTabProps = {
  station: QualichargeEVSEConsolidated;
};

export type CopyState = {
  copiedKey: string | null;
  copy: (key: string, value: string) => void;
};

export type EssentialTabProps = StationDetailsTabProps & CopyState;

export type AccessTabProps = StationDetailsTabProps & {
  paymentTags: string[];
};

export type DetailsTabProps = StationDetailsTabProps & CopyState & {
  sections: DetailSection[];
};

export type ConnectorStatusItem = {
  label: string;
  iconPath: string;
  maxPower: number;
  availableCount: number;
  totalCount: number;
  pdcs: Array<{
    id: string;
    connectorStatus?: EtatPriseEnum | null;
    occupationStatus?: OccupationPDCEnum | null;
  }>;
  connectorStatuses: Array<EtatPriseEnum | null | undefined>;
};

export type ConnectorsTabProps = StationDetailsTabProps & {
  connectorStatusItems: ConnectorStatusItem[];
};

export type TabsStateProps = {
  selectedTabId: StationTabId;
  setSelectedTabId: Dispatch<SetStateAction<StationTabId>>;
};

export function resolveDisplayValue(item: DetailItem): string {
  const v = item.rawValue;

  switch (item.label) {
    case "Enseigne":
    case "Restriction gabarit":
    case "Tarification":
    case "Operateur":
    case "Amenageur":
    case "Observations":
    case "Horaires":
      return formatNullable(v);
    case "Adresse":
    case "Contact operateur":
    case "Contact amenageur":
    case "Code INSEE":
    case "Numero PDL":
    case "Puissance max par PDC":
    case "Puissance totale station":
    case "Nombre de PDC":
    case "ID station itinerance":
    case "ID station local":
    case "SIREN amenageur":
    case "Telephone operateur":
      return formatNullable(v);
    case "Cable T2 attache":
      return formatBoolean(v === "true" ? true : v === "false" ? false : null);
    case "Station deux-roues":
      return formatBoolean(v === "true");
    case "Reservation":
      return formatBoolean(v === "true");
    case "Mise en service":
    case "Derniere mise a jour":
      return formatDate(v);
    case "Implantation":
      return getStationTypeLabel(v as ImplantationStation);
    case "Accessibilite PMR":
      return getPmrLabel(v as AccessibilitePMR);
    default:
      return formatNullable(v);
  }
}

export function getConnectorStatusItems(station: QualichargeEVSEConsolidated): ConnectorStatusItem[] {
  const at = new Date();

  function buildConnectorStatusItem(config: {
    label: string;
    iconPath: string;
    predicate: (pdc: QualichargeEVSEPdc) => boolean;
    getConnectorStatus: (pdc: QualichargeEVSEPdc) => EtatPriseEnum | null | undefined;
  }): ConnectorStatusItem[] {
    const matchingPdcs = station.pdcs.filter(config.predicate).map((pdc) => ({
      ...pdc,
      dynamic: getRecentDynamicStatus(pdc, at),
    }));

    if (matchingPdcs.length === 0) {
      return [];
    }

    const pdcsByPower = new Map<number, QualichargeEVSEPdc[]>();

    for (const pdc of matchingPdcs) {
      const powerGroup = pdcsByPower.get(pdc.puissance_nominale);

      if (powerGroup) {
        powerGroup.push(pdc);
      } else {
        pdcsByPower.set(pdc.puissance_nominale, [pdc]);
      }
    }

    return Array.from(pdcsByPower.entries())
      .sort(([powerA], [powerB]) => powerB - powerA)
      .map(([power, groupedPdcs]) => {
        const availableCount = groupedPdcs.filter((pdc) => {
          const connectorStatus = config.getConnectorStatus(pdc);

          return isAvailablePdc(pdc) && connectorStatus !== EtatPriseEnum.HORS_SERVICE;
        }).length;

        return {
          label: config.label,
          iconPath: config.iconPath,
          maxPower: power,
          availableCount,
          totalCount: groupedPdcs.length,
          pdcs: groupedPdcs.map((pdc) => ({
            id: pdc.id_pdc_itinerance,
            connectorStatus: config.getConnectorStatus(pdc),
            occupationStatus: pdc.dynamic?.occupation_pdc,
          })),
          connectorStatuses: groupedPdcs.map((pdc) => config.getConnectorStatus(pdc)),
        } satisfies ConnectorStatusItem;
      });
  }

  return [
    ...buildConnectorStatusItem({
      label: "Type 2",
      iconPath: withBasePath("/images/prises/prise_type_2.svg"),
      predicate: (pdc) => pdc.prise_type_2,
      getConnectorStatus: (pdc) => pdc.dynamic?.etat_prise_type_2,
    }),
    ...buildConnectorStatusItem({
      label: "Combo CCS",
      iconPath: withBasePath("/images/prises/prise_type_combo_ccs.svg"),
      predicate: (pdc) => pdc.prise_type_combo_ccs,
      getConnectorStatus: (pdc) => pdc.dynamic?.etat_prise_type_combo_ccs,
    }),
    ...buildConnectorStatusItem({
      label: "CHAdeMO",
      iconPath: withBasePath("/images/prises/prise_type_chademo.svg"),
      predicate: (pdc) => pdc.prise_type_chademo,
      getConnectorStatus: (pdc) => pdc.dynamic?.etat_prise_type_chademo,
    }),
    ...buildConnectorStatusItem({
      label: "Prise EF",
      iconPath: withBasePath("/images/prises/prise_type_ef.svg"),
      predicate: (pdc) => pdc.prise_type_ef,
      getConnectorStatus: (pdc) => pdc.dynamic?.etat_prise_type_ef,
    }),
    ...buildConnectorStatusItem({
      label: "Autre prise",
      iconPath: withBasePath("/images/prises/prise_type_autre.svg"),
      predicate: (pdc) => pdc.prise_type_autre,
      getConnectorStatus: () => null,
    }),
  ];
}
