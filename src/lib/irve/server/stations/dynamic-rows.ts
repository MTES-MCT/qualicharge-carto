import type { QualichargeEVSEDynamic } from "@/types/irve";

import { toNullableString, toRequiredString } from "../coerce";
import { getDynamicParquetUrl } from "../data-gouv";
import { readParquetRows, readRemoteParquetBuffer } from "../parquet";

type DynamicParquetRow = Partial<Record<keyof QualichargeEVSEDynamic | "id_station_itinerance", unknown>>;

export function getDynamicKey(idPdcItinerance?: string) {
  return toRequiredString(idPdcItinerance);
}

function toDynamicRow(row: DynamicParquetRow): QualichargeEVSEDynamic {
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
  const file = await readRemoteParquetBuffer(await getDynamicParquetUrl());
  const rows = await readParquetRows<DynamicParquetRow>(file);
  const dynamicMap = new Map<string, QualichargeEVSEDynamic>();

  for (const row of rows) {
    const dynamicRow = toDynamicRow(row);
    dynamicMap.set(getDynamicKey(dynamicRow.id_pdc_itinerance), dynamicRow);
  }

  return dynamicMap;
}
