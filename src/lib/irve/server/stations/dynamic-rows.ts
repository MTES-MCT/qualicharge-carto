import type { QualichargeEVSEDynamic } from "@/types/irve";

import { toNullableString, toRequiredString } from "../coerce";
import type { DynamicSourceRow, IRVESourceLoader } from "../sources/types";

export function getDynamicKey(idPdcItinerance?: string) {
  return toRequiredString(idPdcItinerance);
}

function toDynamicRow(row: DynamicSourceRow): QualichargeEVSEDynamic {
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

export async function loadDynamicRows(sourceLoader: IRVESourceLoader) {
  const dynamicMap = new Map<string, QualichargeEVSEDynamic>();

  for await (const row of sourceLoader.streamDynamicRows()) {
    const dynamicRow = toDynamicRow(row);
    dynamicMap.set(getDynamicKey(dynamicRow.id_pdc_itinerance), dynamicRow);
  }

  return dynamicMap;
}
