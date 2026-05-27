import { ConditionAcces } from "@/types/irve";
import type { IRVEMapStation } from "@/types/irve-runtime";

export type PowerFilterId = "ultraLevel2" | "ultraLevel1" | "veryFast";
export type AccessFilter = "all" | "free" | "restricted";

export interface MapFiltersState {
  access: AccessFilter;
  power: PowerFilterId[];
  connectors: Array<"type2" | "ccs" | "chademo" | "ef">;
  itineranceQuery: string;
  selectedOperators: string[];
}

export const DEFAULT_MAP_FILTERS: MapFiltersState = {
  access: "all",
  power: [],
  connectors: [],
  itineranceQuery: "",
  selectedOperators: [],
};

function normalizeText(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function matchesTextQuery(value: string | null | undefined, query: string) {
  const normalizedQuery = normalizeText(query);

  if (normalizedQuery.length === 0) {
    return true;
  }

  return normalizeText(value).includes(normalizedQuery);
}

export const POWER_FILTER_OPTIONS: Array<{
  id: PowerFilterId;
  label: string;
  description: string;
}> = [
  { id: "ultraLevel2", label: "Ultra-rapide niveau 2", description: "AFIR DC >= 350 kW" },
  { id: "ultraLevel1", label: "Ultra-rapide niveau 1", description: "AFIR DC 150 a 349 kW" },
  { id: "veryFast", label: "Rapide DC", description: "AFIR DC rapide - 50 a 149 kW" },
];

export const CONNECTOR_FILTER_OPTIONS: Array<{
  id: MapFiltersState["connectors"][number];
  label: string;
}> = [
  { id: "type2", label: "Type 2" },
  { id: "ccs", label: "Combo CCS" },
  { id: "chademo", label: "CHAdeMO" },
  { id: "ef", label: "Prise EF" },
];

function matchesPower(power: number, filterId: PowerFilterId) {
  switch (filterId) {
    case "ultraLevel2":
      return power >= 350;
    case "ultraLevel1":
      return power >= 150 && power < 350;
    case "veryFast":
      return power >= 50 && power < 150;
  }
}

export function getActiveFilterCount(filters: MapFiltersState) {
  let count = 0;

  if (filters.access !== "all") count += 1;
  count += filters.power.length;
  count += filters.connectors.length;
  if (normalizeText(filters.itineranceQuery).length > 0) count += 1;
  count += filters.selectedOperators.length;

  return count;
}

export function matchesStationFilters(
  station: IRVEMapStation,
  filters: MapFiltersState
) {
  if (filters.access === "free" && station.condition_acces !== ConditionAcces.ACCESS_LIBRE) {
    return false;
  }

  if (filters.access === "restricted" && station.condition_acces !== ConditionAcces.ACCESS_RESERVE) {
    return false;
  }

  if (
    filters.power.length > 0 &&
    !filters.power.some((filterId) => matchesPower(station.summary.max_power, filterId))
  ) {
    return false;
  }

  if (filters.connectors.includes("type2") && !station.summary.has_prise_type_2) {
    return false;
  }

  if (filters.connectors.includes("ccs") && !station.summary.has_prise_type_combo_ccs) {
    return false;
  }

  if (filters.connectors.includes("chademo") && !station.summary.has_prise_type_chademo) {
    return false;
  }

  if (filters.connectors.includes("ef") && !station.summary.has_prise_type_ef) {
    return false;
  }

  if (
    !matchesTextQuery(station.id_station_itinerance, filters.itineranceQuery) &&
    !station.pdc_itinerance_ids.some((id) => matchesTextQuery(id, filters.itineranceQuery))
  ) {
    return false;
  }

  if (
    filters.selectedOperators.length > 0 &&
    !filters.selectedOperators.some(
      (operator) =>
        station.nom_operateur === operator || station.nom_amenageur === operator
    )
  ) {
    return false;
  }

  return true;
}

export function filterStations(stations: IRVEMapStation[], filters: MapFiltersState) {
  return stations.filter((station) => matchesStationFilters(station, filters));
}
