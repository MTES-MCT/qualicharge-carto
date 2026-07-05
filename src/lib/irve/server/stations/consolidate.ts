import { getStationMarkerPricing } from "@/lib/irve/tariffs";
import type { QualichargeEVSEConsolidated, QualichargeEVSEPdc } from "@/types/irve";
import type { IRVEMapStation, IRVEMapStationDynamicSummary } from "@/types/irve-runtime";
import { summarizeRecentDynamicPdcs } from "@/lib/irve/dynamic-status";

import { toNumber, toRequiredString } from "../coerce";

export function getStationKey(idStationItinerance?: string, fallback?: string) {
  return toRequiredString(idStationItinerance) || toRequiredString(fallback);
}

export function getDynamicSummary(pdcs: QualichargeEVSEPdc[], at: Date): IRVEMapStationDynamicSummary {
  const summary = summarizeRecentDynamicPdcs(pdcs, at);

  return {
    pdcs_with_dynamic_count: summary.pdcsWithDynamicCount,
    en_service_count: summary.enServiceCount,
    libre_count: summary.libreCount,
    occupied_count: summary.occupiedCount,
    reserved_count: summary.reservedCount,
    unknown_occupation_count: summary.unknownOccupationCount,
    available_count: summary.availableCount,
    latest_status_timestamp: summary.latestDynamic
      ? Date.parse(summary.latestDynamic.horodatage)
      : null,
  };
}

export function createMapStation(
  stationKey: string,
  row: QualichargeEVSEConsolidated,
  dynamicSummary: IRVEMapStationDynamicSummary,
  id: number
): IRVEMapStation | null {
  if (row.coordonneesXY == null) return null;

  try {
    const coords = JSON.parse(row.coordonneesXY as string) as [string | number, string | number];
    const lat = toNumber(String(coords[1]));
    const lng = toNumber(String(coords[0]));

    if (lat === null || lng === null) {
      return null;
    }

    return {
      station_key: stationKey,
      id,
      lat,
      lng,
      id_station_itinerance: row.id_station_itinerance,
      nom_station: row.nom_station,
      nom_amenageur: row.nom_amenageur,
      nom_operateur: row.nom_operateur,
      condition_acces: row.condition_acces,
      accessibilite_pmr: row.accessibilite_pmr,
      gratuit: row.gratuit,
      paiement_acte: row.paiement_acte,
      paiement_cb: row.paiement_cb,
      reservation: row.reservation,
      station_deux_roues: row.station_deux_roues,
      pdc_count: row.pdcs.length,
      pdc_itinerance_ids: row.pdcs.map((pdc) => pdc.id_pdc_itinerance),
      has_tarification: row.summary.applicable_tariff_count > 0,
      summary: row.summary,
      dynamic_summary: dynamicSummary,
    };
  } catch {
    return null;
  }
}

export function consolidateStation(pdcs: QualichargeEVSEPdc[], at: Date): QualichargeEVSEConsolidated | null {
  const firstPdc = pdcs[0];
  if (!firstPdc) {
    return null;
  }

  let maxPower = 0;
  let totalPower = 0;
  let hasPriseTypeEf = false;
  let hasPriseType2 = false;
  let hasPriseTypeComboCcs = false;
  let hasPriseTypeChademo = false;
  let hasPriseTypeAutre = false;

  for (const pdc of pdcs) {
    totalPower += pdc.puissance_nominale;
    maxPower = Math.max(maxPower, pdc.puissance_nominale);
    hasPriseTypeEf ||= pdc.prise_type_ef;
    hasPriseType2 ||= pdc.prise_type_2;
    hasPriseTypeComboCcs ||= pdc.prise_type_combo_ccs;
    hasPriseTypeChademo ||= pdc.prise_type_chademo;
    hasPriseTypeAutre ||= pdc.prise_type_autre;
  }

  const applicableTariffs = pdcs.map((pdc) => pdc.applicable_tariff);
  const tariffSummary = getStationMarkerPricing(pdcs, at);

  return {
    nom_amenageur: firstPdc.nom_amenageur,
    siren_amenageur: firstPdc.siren_amenageur,
    contact_amenageur: firstPdc.contact_amenageur,
    nom_operateur: firstPdc.nom_operateur,
    contact_operateur: firstPdc.contact_operateur,
    telephone_operateur: firstPdc.telephone_operateur,
    nom_enseigne: firstPdc.nom_enseigne,
    id_station_itinerance: firstPdc.id_station_itinerance,
    id_station_local: firstPdc.id_station_local,
    nom_station: firstPdc.nom_station,
    implantation_station: firstPdc.implantation_station,
    adresse_station: firstPdc.adresse_station,
    code_insee_commune: firstPdc.code_insee_commune,
    coordonneesXY: firstPdc.coordonneesXY,
    nbre_pdc: firstPdc.nbre_pdc,
    gratuit: firstPdc.gratuit,
    paiement_acte: firstPdc.paiement_acte,
    paiement_cb: firstPdc.paiement_cb,
    paiement_autre: firstPdc.paiement_autre,
    tarification: firstPdc.tarification,
    condition_acces: firstPdc.condition_acces,
    reservation: firstPdc.reservation,
    horaires: firstPdc.horaires,
    accessibilite_pmr: firstPdc.accessibilite_pmr,
    restriction_gabarit: firstPdc.restriction_gabarit,
    station_deux_roues: firstPdc.station_deux_roues,
    raccordement: firstPdc.raccordement,
    num_pdl: firstPdc.num_pdl,
    date_mise_en_service: firstPdc.date_mise_en_service,
    observations: firstPdc.observations,
    date_maj: firstPdc.date_maj,
    cable_t2_attache: firstPdc.cable_t2_attache,
    pdcs,
    summary: {
      max_power: maxPower,
      total_power: totalPower,
      has_prise_type_ef: hasPriseTypeEf,
      has_prise_type_2: hasPriseType2,
      has_prise_type_combo_ccs: hasPriseTypeComboCcs,
      has_prise_type_chademo: hasPriseTypeChademo,
      has_prise_type_autre: hasPriseTypeAutre,
      price_per_kwh: tariffSummary.pricePerKwh,
      pricing_value: tariffSummary.value,
      pricing_dimension: tariffSummary.dimension,
      pricing_unit: tariffSummary.unit,
      pricing_status: tariffSummary.status,
      pricing_headline: tariffSummary.headline,
      pricing_tariff_id: tariffSummary.tariffId,
      applicable_tariff_count: applicableTariffs.filter(Boolean).length,
    },
  };
}
