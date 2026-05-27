import "server-only";

import { asyncBufferFromUrl, parquetMetadataAsync, parquetReadObjects } from "hyparquet";
import { compressors } from "hyparquet-compressors";

import { getStationMarkerPricing, hasDisplayableTariffComponent } from "@/lib/irve/tariffs";
import { EtatPDCEnum, OccupationPDCEnum } from "@/types/irve";
import type {
  QualichargeEVSEConsolidated,
  QualichargeEVSEDynamic,
  QualichargeEVSEPdc,
  QualichargeEVSEStatique,
  QualichargeTariff,
  QualichargeTariffRaw,
} from "@/types/irve";
import type { AsyncBuffer } from "hyparquet";
import type { IRVEMapStation, IRVEMapStationDynamicSummary } from "@/types/irve-runtime";

type StaticParquetRow = Partial<Record<keyof QualichargeEVSEStatique, string>>;
type DynamicParquetRow = Partial<Record<keyof QualichargeEVSEDynamic | "id_station_itinerance", string>>;
type TariffParquetRow = {
  id?: string;
  original_id?: string | null;
  original_last_updated?: string | Date | null;
  raw?: string | null;
  start?: string | Date | null;
  end?: string | Date | null;
  id_pdc_itinerance?: string | null;
};
type IndexedTariff = QualichargeTariff & { rowIndex: number };

const DEFAULT_STATIC_PARQUET_URL = "https://object.files.data.gouv.fr/hydra-parquet/hydra-parquet/8bb0a6e2-1016-42ba-aaee-f72f55c82e9f.parquet";
const DEFAULT_DYNAMIC_PARQUET_URL = "https://object.files.data.gouv.fr/hydra-parquet/hydra-parquet/411443b1-6667-473f-8217-1c57c167408f.parquet";
const DEFAULT_TARIFFS_PARQUET_URL = "http://localhost:8020/d/tariffs.parquet";
const ROW_BATCH_SIZE = 20_000;
const MIN_DISPLAYED_POWER_KW = 50;
const cacheOptions: RequestInit = { cache: "no-store" };

function getStaticParquetUrl() {
  return process.env.STATIC_PARQUET_URL || DEFAULT_STATIC_PARQUET_URL;
}

function getDynamicParquetUrl() {
  return process.env.DYNAMIC_PARQUET_URL || DEFAULT_DYNAMIC_PARQUET_URL;
}

function getTariffsParquetUrl() {
  return process.env.TARIFFS_PARQUET_URL || DEFAULT_TARIFFS_PARQUET_URL;
}

async function asyncBufferFromFullUrl(url: string): Promise<AsyncBuffer> {
  const response = await fetch(url, cacheOptions);

  if (!response.ok) {
    throw new Error(`Unable to fetch ${url}: ${response.status}`);
  }

  const buffer = await response.arrayBuffer();

  return {
    byteLength: buffer.byteLength,
    slice(start, end) {
      return buffer.slice(start, end);
    },
  };
}

function toNumber(value?: string) {
  if (!value) {
    return null;
  }

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toInteger(value?: string, fallback = 1) {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toBoolean(value?: string | boolean) {
  if (!value) {
    return false;
  }
  if (value === true) return true;

  return ["true", "1", "yes", "oui"].includes(value.trim().toLowerCase());
}

function toNullableBoolean(value?: string) {
  if (!value) {
    return null;
  }

  return toBoolean(value);
}

function toNullableString(value?: string) {
  return value && value.length > 0 ? value : null;
}

function toRequiredString(value?: string) {
  return value ?? "";
}

function toIsoString(value?: string | Date | null) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}

function parseJsonArray(value?: string | null) {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map((entry) => String(entry)) : [];
  } catch {
    return [];
  }
}

function parseTariffRaw(raw?: string | null): QualichargeTariffRaw | null {
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as QualichargeTariffRaw;
  } catch {
    return null;
  }
}

function toStaticRow(row: StaticParquetRow): QualichargeEVSEStatique {
  return {
    nom_amenageur: toRequiredString(row.nom_amenageur),
    siren_amenageur: toRequiredString(row.siren_amenageur) as QualichargeEVSEStatique["siren_amenageur"],
    contact_amenageur: toRequiredString(row.contact_amenageur),
    nom_operateur: toRequiredString(row.nom_operateur),
    contact_operateur: toRequiredString(row.contact_operateur),
    telephone_operateur: toRequiredString(row.telephone_operateur) as QualichargeEVSEStatique["telephone_operateur"],
    nom_enseigne: toRequiredString(row.nom_enseigne),
    id_station_itinerance: toRequiredString(row.id_station_itinerance),
    id_station_local: toNullableString(row.id_station_local),
    nom_station: toRequiredString(row.nom_station),
    implantation_station: toRequiredString(row.implantation_station) as QualichargeEVSEStatique["implantation_station"],
    adresse_station: toRequiredString(row.adresse_station),
    code_insee_commune: toRequiredString(row.code_insee_commune),
    coordonneesXY: toRequiredString(row.coordonneesXY) as QualichargeEVSEStatique["coordonneesXY"],
    nbre_pdc: toInteger(row.nbre_pdc, 0),
    id_pdc_itinerance: toRequiredString(row.id_pdc_itinerance),
    id_pdc_local: toNullableString(row.id_pdc_local),
    puissance_nominale: toNumber(row.puissance_nominale) ?? 0,
    prise_type_ef: toBoolean(row.prise_type_ef),
    prise_type_2: toBoolean(row.prise_type_2),
    prise_type_combo_ccs: toBoolean(row.prise_type_combo_ccs),
    prise_type_chademo: toBoolean(row.prise_type_chademo),
    prise_type_autre: toBoolean(row.prise_type_autre),
    gratuit: toNullableBoolean(row.gratuit),
    paiement_acte: toBoolean(row.paiement_acte),
    paiement_cb: toNullableBoolean(row.paiement_cb),
    paiement_autre: toNullableBoolean(row.paiement_autre),
    tarification: toNullableString(row.tarification),
    condition_acces: toRequiredString(row.condition_acces) as QualichargeEVSEStatique["condition_acces"],
    reservation: toBoolean(row.reservation),
    horaires: toRequiredString(row.horaires),
    accessibilite_pmr: toRequiredString(row.accessibilite_pmr) as QualichargeEVSEStatique["accessibilite_pmr"],
    restriction_gabarit: toRequiredString(row.restriction_gabarit),
    station_deux_roues: toBoolean(row.station_deux_roues),
    raccordement: toRequiredString(row.raccordement) as QualichargeEVSEStatique["raccordement"],
    num_pdl: toNullableString(row.num_pdl),
    date_mise_en_service: toNullableString(row.date_mise_en_service) as QualichargeEVSEStatique["date_mise_en_service"],
    observations: toNullableString(row.observations),
    date_maj: toRequiredString(row.date_maj) as QualichargeEVSEStatique["date_maj"],
    cable_t2_attache: toNullableBoolean(row.cable_t2_attache),
  };
}

function toDynamicRow(row: DynamicParquetRow): QualichargeEVSEDynamic {
  return {
    id_pdc_itinerance: toRequiredString(row.id_pdc_itinerance),
    horodatage: toRequiredString(row.horodatage),
    etat_pdc: toRequiredString(row.etat_pdc) as QualichargeEVSEDynamic["etat_pdc"],
    occupation_pdc: toRequiredString(row.occupation_pdc) as QualichargeEVSEDynamic["occupation_pdc"],
    etat_prise_type_2: toNullableString(row.etat_prise_type_2) as QualichargeEVSEDynamic["etat_prise_type_2"],
    etat_prise_type_combo_ccs: toNullableString(
      row.etat_prise_type_combo_ccs
    ) as QualichargeEVSEDynamic["etat_prise_type_combo_ccs"],
    etat_prise_type_chademo: toNullableString(
      row.etat_prise_type_chademo
    ) as QualichargeEVSEDynamic["etat_prise_type_chademo"],
    etat_prise_type_ef: toNullableString(row.etat_prise_type_ef) as QualichargeEVSEDynamic["etat_prise_type_ef"],
  };
}

function getDynamicKey(idPdcItinerance?: string) {
  return toRequiredString(idPdcItinerance);
}

function getStationKey(idStationItinerance?: string, fallback?: string) {
  return toRequiredString(idStationItinerance) || toRequiredString(fallback);
}

async function loadDynamicRows() {
  const file = await asyncBufferFromUrl({ url: getDynamicParquetUrl(), requestInit: cacheOptions });
  const rows = (await parquetReadObjects({
    file,
    compressors,
  })) as DynamicParquetRow[];

  const dynamicMap = new Map<string, QualichargeEVSEDynamic>();

  for (const row of rows) {
    const dynamicRow = toDynamicRow(row);
    dynamicMap.set(getDynamicKey(dynamicRow.id_pdc_itinerance), dynamicRow);
  }

  return dynamicMap;
}

function isTariffApplicable(tariff: QualichargeTariff, at: Date) {
  const atTime = at.getTime();
  const startTime = tariff.start ? new Date(tariff.start).getTime() : null;
  const endTime = tariff.end ? new Date(tariff.end).getTime() : null;

  return (
    (startTime == null || Number.isNaN(startTime) || startTime <= atTime) &&
    (endTime == null || Number.isNaN(endTime) || endTime > atTime)
  );
}

function compareApplicableTariffs(
  left: IndexedTariff,
  right: IndexedTariff
) {
  const leftHasStart = left.start ? 1 : 0;
  const rightHasStart = right.start ? 1 : 0;
  if (leftHasStart !== rightHasStart) return leftHasStart - rightHasStart;

  const leftStart = left.start ? new Date(left.start).getTime() : 0;
  const rightStart = right.start ? new Date(right.start).getTime() : 0;
  if (leftStart !== rightStart) return leftStart - rightStart;

  const leftUpdated = left.original_last_updated ? new Date(left.original_last_updated).getTime() : 0;
  const rightUpdated = right.original_last_updated ? new Date(right.original_last_updated).getTime() : 0;
  if (leftUpdated !== rightUpdated) return leftUpdated - rightUpdated;

  return left.rowIndex - right.rowIndex;
}

function compareLastUpdatedTariffs(
  left: IndexedTariff,
  right: IndexedTariff
) {
  const leftUpdated = left.original_last_updated ? new Date(left.original_last_updated).getTime() : 0;
  const rightUpdated = right.original_last_updated ? new Date(right.original_last_updated).getTime() : 0;
  if (leftUpdated !== rightUpdated) return leftUpdated - rightUpdated;

  return left.rowIndex - right.rowIndex;
}

async function loadApplicableTariffs(at: Date) {
  const file = await asyncBufferFromFullUrl(getTariffsParquetUrl());
  const rows = (await parquetReadObjects({
    file,
    compressors,
  })) as TariffParquetRow[];

  const applicableTariffs = new Map<string, IndexedTariff>();
  const latestTariffs = new Map<string, IndexedTariff>();

  rows.forEach((row, rowIndex) => {
    const tariff: IndexedTariff = {
      id: toRequiredString(row.id),
      original_id: row.original_id ?? null,
      original_last_updated: toIsoString(row.original_last_updated),
      raw: row.raw ?? "",
      parsed: parseTariffRaw(row.raw),
      start: toIsoString(row.start),
      end: toIsoString(row.end),
      id_pdc_itinerance: parseJsonArray(row.id_pdc_itinerance),
      rowIndex,
    };

    if (!tariff.id) {
      return;
    }

    if (!isTariffApplicable(tariff, at)) {
      for (const idPdcItinerance of tariff.id_pdc_itinerance) {
        const latest = latestTariffs.get(idPdcItinerance);
        if (!latest || compareLastUpdatedTariffs(tariff, latest) > 0) {
          latestTariffs.set(idPdcItinerance, tariff);
        }
      }

      return;
    }

    for (const idPdcItinerance of tariff.id_pdc_itinerance) {
      const latest = latestTariffs.get(idPdcItinerance);
      if (!latest || compareLastUpdatedTariffs(tariff, latest) > 0) {
        latestTariffs.set(idPdcItinerance, tariff);
      }

      const current = applicableTariffs.get(idPdcItinerance);
      if (!current || compareApplicableTariffs(tariff, current) > 0) {
        applicableTariffs.set(idPdcItinerance, tariff);
      }
    }
  });

  for (const [idPdcItinerance, latestTariff] of latestTariffs) {
    const applicableTariff = applicableTariffs.get(idPdcItinerance);
    if (!applicableTariff) {
      applicableTariffs.set(idPdcItinerance, latestTariff);
    } else if (!hasDisplayableTariffComponent(applicableTariff, at) && hasDisplayableTariffComponent(latestTariff, at)) {
      applicableTariffs.set(idPdcItinerance, latestTariff);
    }
  }

  return applicableTariffs;
}

async function loadApplicableTariffsSafely(at: Date) {
  try {
    return await loadApplicableTariffs(at);
  } catch (error) {
    console.error("Failed to load IRVE tariffs", error);

    return new Map<string, IndexedTariff>();
  }
}

function toPublicTariff(tariff: IndexedTariff | undefined): QualichargeTariff | undefined {
  if (!tariff) {
    return undefined;
  }

  return {
    id: tariff.id,
    original_id: tariff.original_id,
    original_last_updated: tariff.original_last_updated,
    raw: tariff.raw,
    parsed: tariff.parsed,
    start: tariff.start,
    end: tariff.end,
    id_pdc_itinerance: tariff.id_pdc_itinerance,
  };
}

function createMapStation(
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

function isAvailablePdc(pdc: QualichargeEVSEPdc) {
  if (pdc.dynamic?.occupation_pdc !== OccupationPDCEnum.LIBRE) {
    return false;
  }

  if (pdc.dynamic?.etat_pdc == null) {
    return true;
  }

  return pdc.dynamic.etat_pdc === EtatPDCEnum.EN_SERVICE;
}

function getDynamicSummary(pdcs: QualichargeEVSEPdc[]): IRVEMapStationDynamicSummary {
  const pdcsWithDynamic = pdcs.filter((pdc) => pdc.dynamic);

  return {
    pdcs_with_dynamic_count: pdcsWithDynamic.length,
    en_service_count: pdcsWithDynamic.filter((pdc) => pdc.dynamic?.etat_pdc === EtatPDCEnum.EN_SERVICE).length,
    libre_count: pdcsWithDynamic.filter((pdc) => pdc.dynamic?.occupation_pdc === OccupationPDCEnum.LIBRE).length,
    occupied_count: pdcsWithDynamic.filter((pdc) => pdc.dynamic?.occupation_pdc === OccupationPDCEnum.OCCUPE).length,
    reserved_count: pdcsWithDynamic.filter((pdc) => pdc.dynamic?.occupation_pdc === OccupationPDCEnum.RESERVE).length,
    available_count: pdcsWithDynamic.filter(isAvailablePdc).length,
  };
}

function consolidateStation(pdcs: QualichargeEVSEPdc[], at: Date): QualichargeEVSEConsolidated | null {
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
    if (pdc.puissance_nominale > maxPower) {
      maxPower = pdc.puissance_nominale;
    }

    hasPriseTypeEf = hasPriseTypeEf || pdc.prise_type_ef;
    hasPriseType2 = hasPriseType2 || pdc.prise_type_2;
    hasPriseTypeComboCcs = hasPriseTypeComboCcs || pdc.prise_type_combo_ccs;
    hasPriseTypeChademo = hasPriseTypeChademo || pdc.prise_type_chademo;
    hasPriseTypeAutre = hasPriseTypeAutre || pdc.prise_type_autre;
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
      applicable_tariff_count: applicableTariffs.filter(Boolean).length,
    },
  };
}

export async function loadIRVEDataset() {
  const now = new Date();
  const [dynamicMap, applicableTariffs] = await Promise.all([
    loadDynamicRows(),
    loadApplicableTariffsSafely(now),
  ]);
  const file = await asyncBufferFromUrl({ url: getStaticParquetUrl(), requestInit: cacheOptions });
  const metadata = await parquetMetadataAsync(file);
  const rowCount = Number(metadata.num_rows);
  const stationMap = new Map<string, QualichargeEVSEPdc[]>();

  for (let rowStart = 0; rowStart < rowCount; rowStart += ROW_BATCH_SIZE) {
    const rowEnd = Math.min(rowStart + ROW_BATCH_SIZE, rowCount);
    const rows = (await parquetReadObjects({
      file,
      compressors,
      rowStart,
      rowEnd,
    })) as StaticParquetRow[];

    for (const row of rows) {
      const staticRow = toStaticRow(row);

      if (staticRow.puissance_nominale < MIN_DISPLAYED_POWER_KW) {
        continue;
      }

      const consolidatedRow: QualichargeEVSEPdc = {
        ...staticRow,
        dynamic: dynamicMap.get(getDynamicKey(staticRow.id_pdc_itinerance)),
        applicable_tariff: toPublicTariff(applicableTariffs.get(staticRow.id_pdc_itinerance)),
      };
      const stationKey = getStationKey(staticRow.id_station_itinerance, staticRow.id_pdc_itinerance);
      const stationPdcs = stationMap.get(stationKey);

      if (stationPdcs) {
        stationPdcs.push(consolidatedRow);
      } else {
        stationMap.set(stationKey, [consolidatedRow]);
      }
    }
  }

  const stations: IRVEMapStation[] = [];
  const stationsByKey = new Map<string, QualichargeEVSEConsolidated>();
  let nextId = 1;

  for (const [stationKey, stationPdcs] of stationMap) {
    const station = consolidateStation(stationPdcs, now);
    if (!station) {
      continue;
    }

    stationsByKey.set(stationKey, station);

    const mapStation = createMapStation(stationKey, station, getDynamicSummary(station.pdcs), nextId);
    nextId += 1;
    if (mapStation) {
      stations.push(mapStation);
    }
  }

  return { stations, stationsByKey };
}
