import {
  ACTIVE_STATION_MAX_STATUS_AGE_DAYS,
  DYNAMIC_STATUS_FRESHNESS_MAX_AGE_HOURS,
} from "./server/config";
import {
  EtatPDCEnum,
  OccupationPDCEnum,
  type QualichargeEVSEDynamic,
  type QualichargeEVSEPdc,
} from "@/types/irve";

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const HOUR_IN_MS = 60 * 60 * 1000;

function isDynamicStatusWithinAge(
  dynamic: QualichargeEVSEDynamic | undefined,
  at: Date,
  maxAgeMs: number
) {
  const timestamp = Date.parse(dynamic?.horodatage ?? "");

  return Number.isFinite(timestamp) && timestamp > at.getTime() - maxAgeMs;
}

export function isRecentDynamicStatus(dynamic: QualichargeEVSEDynamic | undefined, at: Date) {
  return isDynamicStatusWithinAge(dynamic, at, ACTIVE_STATION_MAX_STATUS_AGE_DAYS * DAY_IN_MS);
}

export function isFreshDynamicStatus(dynamic: QualichargeEVSEDynamic | undefined, at: Date) {
  return isDynamicStatusWithinAge(
    dynamic,
    at,
    DYNAMIC_STATUS_FRESHNESS_MAX_AGE_HOURS * HOUR_IN_MS
  );
}

export function getRecentDynamicStatus(pdc: QualichargeEVSEPdc, at: Date) {
  return isRecentDynamicStatus(pdc.dynamic, at) ? pdc.dynamic : undefined;
}

export function getLatestDynamicStatusTimestamp(pdcs: QualichargeEVSEPdc[]) {
  let latestTimestamp: number | null = null;

  for (const pdc of pdcs) {
    const timestamp = Date.parse(pdc.dynamic?.horodatage ?? "");
    if (Number.isFinite(timestamp) && (latestTimestamp === null || timestamp > latestTimestamp)) {
      latestTimestamp = timestamp;
    }
  }

  return latestTimestamp;
}

export function summarizeRecentDynamicPdcs(pdcs: QualichargeEVSEPdc[], at: Date) {
  const pdcsWithDynamic = pdcs.filter((pdc) => isRecentDynamicStatus(pdc.dynamic, at));
  const latestPdc = pdcsWithDynamic.reduce<QualichargeEVSEPdc | null>((latest, pdc) => {
    if (!latest?.dynamic?.horodatage) {
      return pdc;
    }

    return Date.parse(pdc.dynamic?.horodatage ?? "") > Date.parse(latest.dynamic.horodatage)
      ? pdc
      : latest;
  }, null);

  return {
    pdcsWithDynamicCount: pdcsWithDynamic.length,
    freshDynamicCount: pdcsWithDynamic.filter((pdc) => isFreshDynamicStatus(pdc.dynamic, at)).length,
    enServiceCount: pdcsWithDynamic.filter((pdc) => pdc.dynamic?.etat_pdc === EtatPDCEnum.EN_SERVICE).length,
    libreCount: pdcsWithDynamic.filter((pdc) => pdc.dynamic?.occupation_pdc === OccupationPDCEnum.LIBRE).length,
    occupiedCount: pdcsWithDynamic.filter((pdc) => pdc.dynamic?.occupation_pdc === OccupationPDCEnum.OCCUPE).length,
    reservedCount: pdcsWithDynamic.filter((pdc) => pdc.dynamic?.occupation_pdc === OccupationPDCEnum.RESERVE).length,
    unknownOccupationCount: pdcsWithDynamic.filter((pdc) => pdc.dynamic?.occupation_pdc === OccupationPDCEnum.INCONNU).length,
    availableCount: pdcsWithDynamic.filter(
      (pdc) =>
        pdc.dynamic?.occupation_pdc === OccupationPDCEnum.LIBRE &&
        pdc.dynamic.etat_pdc === EtatPDCEnum.EN_SERVICE
    ).length,
    latestDynamic: latestPdc?.dynamic,
  };
}
