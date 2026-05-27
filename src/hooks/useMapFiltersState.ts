"use client";

import { startTransition, useCallback, useEffect, useMemo, useState } from "react";

import {
  DEFAULT_MAP_FILTERS,
  getActiveFilterCount,
  type AccessFilter,
  type MapFiltersState,
  type PowerFilterId,
} from "@/lib/irve/mapFilters";
import { useDebouncedValue } from "./useDebouncedValue";

const SEARCH_DEBOUNCE_MS = 250;

function toggleListValue<T extends string>(items: T[], value: T) {
  return items.includes(value)
    ? items.filter((item) => item !== value)
    : [...items, value];
}

export function useMapFiltersState() {
  const [filters, setFilters] = useState<MapFiltersState>(DEFAULT_MAP_FILTERS);
  const [itineranceInputValue, setItineranceInputValue] = useState(DEFAULT_MAP_FILTERS.itineranceQuery);
  const [selectedOperators, setSelectedOperators] = useState<string[]>(DEFAULT_MAP_FILTERS.selectedOperators);

  const debouncedItineranceQuery = useDebouncedValue(itineranceInputValue.trim(), SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    startTransition(() => {
      setFilters((current) =>
        current.itineranceQuery === debouncedItineranceQuery
          ? current
          : { ...current, itineranceQuery: debouncedItineranceQuery }
      );
    });
  }, [debouncedItineranceQuery]);

  useEffect(() => {
    startTransition(() => {
      setFilters((current) =>
        current.selectedOperators === selectedOperators
          ? current
          : { ...current, selectedOperators }
      );
    });
  }, [selectedOperators]);

  const resetFilters = useCallback(() => {
    setItineranceInputValue(DEFAULT_MAP_FILTERS.itineranceQuery);
    setSelectedOperators(DEFAULT_MAP_FILTERS.selectedOperators);
    setFilters(DEFAULT_MAP_FILTERS);
  }, []);

  const setAccess = useCallback((access: AccessFilter) => {
    setFilters((current) => ({ ...current, access }));
  }, []);

  const togglePower = useCallback((value: PowerFilterId) => {
    setFilters((current) => ({
      ...current,
      power: toggleListValue(current.power, value),
    }));
  }, []);

  const toggleConnector = useCallback((value: MapFiltersState["connectors"][number]) => {
    setFilters((current) => ({
      ...current,
      connectors: toggleListValue(current.connectors, value),
    }));
  }, []);

  const activeFilterCount = useMemo(() => getActiveFilterCount(filters), [filters]);

  return {
    filters,
    itineranceInputValue,
    selectedOperators,
    activeFilterCount,
    setItineranceInputValue,
    setSelectedOperators,
    resetFilters,
    setAccess,
    togglePower,
    toggleConnector,
  };
}
