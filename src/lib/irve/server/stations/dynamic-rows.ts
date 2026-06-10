import type { QualichargeEVSEDynamic } from "@/types/irve";

import { cacheOptions } from "../config";
import { toNullableString, toRequiredString } from "../coerce";
import { parseCsvRecordStream } from "../csv";
import { getDynamicCsvUrl } from "../data-gouv";

type DynamicCsvRow = Partial<Record<keyof QualichargeEVSEDynamic | "id_station_itinerance", unknown>>;

export function getDynamicKey(idPdcItinerance?: string) {
  return toRequiredString(idPdcItinerance);
}

function toDynamicRow(row: DynamicCsvRow): QualichargeEVSEDynamic {
  return {
    id_pdc_itinerance: toRequiredString(row.id_pdc_itinerance),
    horodatage: toRequiredString(row.horodatage),
    etat_pdc: toRequiredString(row.etat_pdc) as QualichargeEVSEDynamic["etat_pdc"],
    occupation_pdc: toRequiredString(row.occupation_pdc) as QualichargeEVSEDynamic["occupation_pdc"],
    etat_prise_type_2: toNullableString(row.etat_prise_type_2) as QualichargeEVSEDynamic["etat_prise_type_2"],
    etat_prise_type_combo_ccs: toNullableString(row.etat_prise_type_combo_ccs) as QualichargeEVSEDynamic["etat_prise_type_combo_ccs"],
    etat_prise_type_chademo: toNullableString(row.etat_prise_type_chademo) as QualichargeEVSEDynamic["etat_prise_type_chademo"],
    etat_prise_type_ef: toNullableString(row.etat_prise_type_ef) as QualichargeEVSEDynamic["etat_prise_type_ef"],
  };
}

export async function loadDynamicRows() {
  const response = await fetch(await getDynamicCsvUrl(), cacheOptions);
  if (!response.ok) {
    throw new Error(`Unable to fetch dynamic IRVE CSV: HTTP ${response.status}`);
  }

  if (!response.body) {
    throw new Error("Unable to fetch dynamic IRVE CSV: missing response body");
  }

  const dynamicMap = new Map<string, QualichargeEVSEDynamic>();

  for await (const row of parseCsvRecordStream(response.body) as AsyncIterable<DynamicCsvRow>) {
    const dynamicRow = toDynamicRow(row);
    dynamicMap.set(getDynamicKey(dynamicRow.id_pdc_itinerance), dynamicRow);
  }

  return dynamicMap;
}
