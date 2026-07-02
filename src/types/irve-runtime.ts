import type { AccessibilitePMR, ConditionAcces } from "@/types/irve";

export interface IRVEMapStationSummary {
  max_power: number;
  total_power: number;
  has_prise_type_ef: boolean;
  has_prise_type_2: boolean;
  has_prise_type_combo_ccs: boolean;
  has_prise_type_chademo: boolean;
  has_prise_type_autre: boolean;
  price_per_kwh: number | null;
  pricing_value: number | null;
  pricing_dimension: string | null;
  pricing_unit: string | null;
  pricing_status: string | null;
  pricing_headline: string | null;
  pricing_tariff_id: string | null;
  applicable_tariff_count: number;
}

export interface IRVEMapStationDynamicSummary {
  pdcs_with_dynamic_count: number;
  en_service_count: number;
  libre_count: number;
  occupied_count: number;
  reserved_count: number;
  available_count: number;
  latest_status_timestamp: number | null;
}

export interface IRVEMapStation {
  station_key: string;
  id: number;
  lat: number;
  lng: number;
  id_station_itinerance: string;
  nom_station: string;
  nom_amenageur: string;
  nom_operateur: string;
  condition_acces: ConditionAcces;
  accessibilite_pmr: AccessibilitePMR;
  gratuit?: boolean | null;
  paiement_acte: boolean;
  paiement_cb?: boolean | null;
  reservation: boolean;
  station_deux_roues: boolean;
  pdc_count: number;
  pdc_itinerance_ids: string[];
  has_tarification: boolean;
  summary: IRVEMapStationSummary;
  dynamic_summary: IRVEMapStationDynamicSummary;
}

export type IRVERow = IRVEMapStation;

export type DataLoadStatus = "idle" | "loading" | "done" | "error";

export interface IRVEPointProperties {
  cluster: false;
  id: number;
  row: IRVERow;
}

export interface IRVEPointFeature {
  type: "Feature";
  id: number;
  properties: IRVEPointProperties;
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
}

export type IRVEClusterFeature = {
  type: "Feature";
  id?: number | string;
  properties: {
    cluster: true;
    cluster_id: number;
    point_count: number;
    point_count_abbreviated: string | number;
  };
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
};

export type IRVEClusterOrPoint = IRVEClusterFeature | IRVEPointFeature;

export interface IRVEPointsPayload {
  stations: IRVEMapStation[];
  total: number;
  updatedAt: string;
}

export interface LoadState {
  status: DataLoadStatus;
  loaded: number;
  total: number;
  message?: string;
  error?: string;
}
