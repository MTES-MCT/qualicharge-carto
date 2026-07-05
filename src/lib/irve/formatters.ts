import {
  AccessibilitePMR,
  ConditionAcces,
  EtatPDCEnum,
  EtatPriseEnum,
  ImplantationStation,
  OccupationPDCEnum,
  type QualichargeEVSEConsolidated,
  type QualichargeEVSEPdc,
} from "@/types/irve";
import { getRecentDynamicStatus, summarizeRecentDynamicPdcs } from "@/lib/irve/dynamic-status";

export function formatNullable(value: string | number | null | undefined, fallback = "Non renseigné") {
  if (value == null || value === "") {
    return fallback;
  }

  return String(value);
}

export function formatBoolean(value: boolean | null | undefined, yes = "Oui", no = "Non") {
  if (value == null) {
    return "Non renseigné";
  }

  return value ? yes : no;
}

export function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Non renseignée";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(date);
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "Donnée dynamique manquante";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
}

export function formatRelativeDateTime(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const diffMs = date.getTime() - Date.now();
  const rtf = new Intl.RelativeTimeFormat("fr-FR", { numeric: "auto" });
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (Math.abs(diffMs) < hour) {
    return rtf.format(Math.round(diffMs / minute), "minute");
  }

  if (Math.abs(diffMs) < day) {
    return rtf.format(Math.round(diffMs / hour), "hour");
  }

  return rtf.format(Math.round(diffMs / day), "day");
}

export function getPowerSeverity(power: number) {
  if (power >= 150) return "error" as const;
  if (power >= 50) return "warning" as const;
  if (power >= 22) return "info" as const;
  return "success" as const;
}

export function getAccessSeverity(condition: ConditionAcces) {
  return condition === ConditionAcces.ACCESS_LIBRE ? "success" as const : "info" as const;
}

export function getPmrLabel(value: AccessibilitePMR) {
  switch (value) {
    case AccessibilitePMR.RESERVE_PMR:
      return "Place réservée PMR";
    case AccessibilitePMR.NON_RESERVE:
      return "Place accessible PMR";
    case AccessibilitePMR.NON_ACCESSIBLE:
      return "Place non accessible PMR";
    default:
      return "Accessibilité PMR inconnue";
  }
}

export function getStationTypeLabel(value: ImplantationStation) {
  switch (value) {
    case ImplantationStation.VOIRIE:
      return "Voirie";
    case ImplantationStation.PARKING_PUBLIC:
      return "Parking public";
    case ImplantationStation.PARKING_PRIVE_USAGE_PUBLIC:
      return "Parking privé à usage public";
    case ImplantationStation.PARKING_PRIVE_CLIENTELE:
      return "Parking privé réservé à la clientèle";
    case ImplantationStation.STATION_RECHARGE_RAPIDE:
      return "Station dédiée à la recharge rapide";
  }
}

export function getDynamicStatusSeverity(status?: EtatPDCEnum) {
  switch (status) {
    case EtatPDCEnum.EN_SERVICE:
      return "success" as const;
    case EtatPDCEnum.HORS_SERVICE:
      return "error" as const;
    default:
      return "info" as const;
  }
}

export function getOccupationSeverity(status?: OccupationPDCEnum) {
  switch (status) {
    case OccupationPDCEnum.LIBRE:
      return "success" as const;
    case OccupationPDCEnum.OCCUPE:
    case OccupationPDCEnum.RESERVE:
      return "warning" as const;
    default:
      return "info" as const;
  }
}

export function getEtatPdcLabel(value?: EtatPDCEnum | null) {
  switch (value) {
    case EtatPDCEnum.EN_SERVICE:
      return "En service";
    case EtatPDCEnum.HORS_SERVICE:
      return "Hors service";
    case EtatPDCEnum.INCONNU:
      return "État inconnu";
    default:
      return "Donnée dynamique manquante";
  }
}

export function getOccupationLabel(value?: OccupationPDCEnum | null) {
  switch (value) {
    case OccupationPDCEnum.LIBRE:
      return "Libre";
    case OccupationPDCEnum.OCCUPE:
      return "Occupé";
    case OccupationPDCEnum.RESERVE:
      return "Réservé";
    case OccupationPDCEnum.INCONNU:
      return "Occupation inconnue";
    default:
      return "Donnée dynamique manquante";
  }
}

export function getEtatPriseLabel(value?: EtatPriseEnum | null) {
  switch (value) {
    case EtatPriseEnum.FONCTIONNEL:
      return "Fonctionnelle";
    case EtatPriseEnum.HORS_SERVICE:
      return "Hors service";
    case EtatPriseEnum.INCONNU:
      return "État inconnu";
    default:
      return "Donnée dynamique manquante";
  }
}

export function getAvailabilityTone(status?: EtatPDCEnum | null) {
  switch (status) {
    case EtatPDCEnum.EN_SERVICE:
      return "success" as const;
    case EtatPDCEnum.HORS_SERVICE:
      return "error" as const;
    case EtatPDCEnum.INCONNU:
      return "warning" as const;
    default:
      return "new" as const;
  }
}

export function getConnectorAvailabilityTone(value?: EtatPriseEnum | null) {
  switch (value) {
    case EtatPriseEnum.FONCTIONNEL:
      return "success" as const;
    case EtatPriseEnum.HORS_SERVICE:
      return "error" as const;
    case EtatPriseEnum.INCONNU:
      return "warning" as const;
    default:
      return "new" as const;
  }
}

export function getConnectorStateSeverity(value?: EtatPriseEnum | null) {
  switch (value) {
    case EtatPriseEnum.FONCTIONNEL:
      return "success" as const;
    case EtatPriseEnum.HORS_SERVICE:
      return "error" as const;
    case EtatPriseEnum.INCONNU:
      return "warning" as const;
    default:
      return "new" as const;
  }
}

export function getConnectorTags(station: QualichargeEVSEConsolidated) {
  return [
    station.summary.has_prise_type_2 && "Type 2",
    station.summary.has_prise_type_combo_ccs && "Combo CCS",
    station.summary.has_prise_type_chademo && "CHAdeMO",
    station.summary.has_prise_type_ef && "Prise EF",
    station.summary.has_prise_type_autre && "Autre prise",
  ].filter(Boolean) as string[];
}

export function getPaymentTags(station: QualichargeEVSEConsolidated) {
  return [
    station.gratuit === true && "Recharge gratuite",
    station.paiement_acte && "Paiement a l'acte",
    station.paiement_cb === true && "Carte bancaire",
    station.paiement_autre === true && "Autre paiement",
    station.reservation && "Reservation disponible",
  ].filter(Boolean) as string[];
}

export function isFunctionalPdc(pdc: QualichargeEVSEPdc, at = new Date()) {
  const dynamic = getRecentDynamicStatus(pdc, at);
  if (dynamic?.etat_pdc !== EtatPDCEnum.EN_SERVICE) {
    return false;
  }

  const connectorStatuses = [
    dynamic.etat_prise_type_2,
    dynamic.etat_prise_type_combo_ccs,
    dynamic.etat_prise_type_chademo,
    dynamic.etat_prise_type_ef,
  ];

  const declaredStatuses = connectorStatuses.filter((status) => status != null);
  if (declaredStatuses.length === 0) {
    return true;
  }

  return declaredStatuses.some((status) => status === EtatPriseEnum.FONCTIONNEL);
}

export function isAvailablePdc(pdc: QualichargeEVSEPdc, at = new Date()) {
  const dynamic = getRecentDynamicStatus(pdc, at);
  if (dynamic?.occupation_pdc !== OccupationPDCEnum.LIBRE) {
    return false;
  }

  if (dynamic.etat_pdc == null) {
    return true;
  }

  return dynamic.etat_pdc === EtatPDCEnum.EN_SERVICE;
}

export function getStationDynamicSummary(station: QualichargeEVSEConsolidated, at = new Date()) {
  return summarizeRecentDynamicPdcs(station.pdcs, at);
}
