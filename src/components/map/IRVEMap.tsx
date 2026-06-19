"use client";

import { useMemo, useState } from "react";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { SegmentedControl, type SegmentedControlProps } from "@codegouvfr/react-dsfr/SegmentedControl";

import { useMapFiltersState } from "@/hooks/useMapFiltersState";
import { useIRVEData } from "@/hooks/useIRVEData";
import { useStationDetails } from "@/hooks/useStationDetails";
import {
  getHeatmapDefinition,
  SERVICE_HEATMAPS,
  type HeatmapMode,
} from "@/lib/irve/heatmaps";
import {
  buildMapModes,
  isHeatmapDisplayMode,
  type MapDisplayMode,
} from "@/lib/irve/mapModes";
import type { IRVEMapStation } from "@/types/irve-runtime";
import { matchesStationFilters } from "@/lib/irve/mapFilters";
import { LoadingOverlay } from "./LoadingOverlay";
import { MapAnalysisPanel } from "./MapAnalysisPanel";
import { MapFiltersPanel } from "./MapFiltersPanel";
import { MapViewport } from "./MapViewport";
import { StationDetailsPanel } from "./StationDetailsPanel";
import { PricingModal, pricingModal } from "../PricingModal";

import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";

const hostWebsiteUrl = process.env.NEXT_PUBLIC_HOST_WEBSITE_URL?.trim();

export default function IRVEMap() {
  const { stations, loadState } = useIRVEData();
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isHeatmapPanelOpen, setIsHeatmapPanelOpen] = useState(false);
  const [selectedStation, setSelectedStation] = useState<IRVEMapStation | null>(null);
  const selectedStationKey = selectedStation?.station_key ?? null;
  const {
    station: selectedStationDetails,
    isLoading: isStationDetailsLoading,
    error: stationDetailsError,
  } = useStationDetails(selectedStationKey);
  const [mapDisplayMode, setMapDisplayMode] = useState<MapDisplayMode>("markers");
  const [onlyStationsWithPrice, setOnlyStationsWithPrice] = useState(false);
  const {
    filters,
    itineranceInputValue,
    activeFilterCount,
    setItineranceInputValue,
    setSelectedOperators,
    resetFilters,
    setAccess,
    togglePower,
    toggleConnector,
  } = useMapFiltersState();

  const mapModes = useMemo(() => buildMapModes(SERVICE_HEATMAPS), []);
  const activeMode = useMemo(
    () => mapModes.find((entry) => entry.value === mapDisplayMode) ?? mapModes[0],
    [mapModes, mapDisplayMode]
  );
  const activeHeatmapMode = isHeatmapDisplayMode(mapDisplayMode) ? mapDisplayMode : null;

  const { operatorOptions, operatorsWithoutTarification } = useMemo(() => {
    const withTarification = new Set<string>();
    const withoutTarification = new Set<string>();

    for (const station of stations) {
      if (station.nom_operateur) {
        (station.has_tarification ? withTarification : withoutTarification).add(station.nom_operateur);
      }
      if (station.nom_amenageur) {
        (station.has_tarification ? withTarification : withoutTarification).add(station.nom_amenageur);
      }
    }

    // If an operator appears in both sets (has some stations with and some without tarification),
    // it should be considered as having tarification
    for (const operator of withTarification) {
      withoutTarification.delete(operator);
    }

    const enabledOperators = Array.from(withTarification)
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({ value: name, label: name }));

    const disabledOperators = Array.from(withoutTarification)
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({ value: name, label: name }));

    const allOperators = [...enabledOperators, ...disabledOperators];

    return {
      operatorOptions: allOperators,
      operatorsWithoutTarification: Array.from(withoutTarification).sort((a, b) => a.localeCompare(b)),
    };
  }, [stations]);

  const filteredStations = useMemo(() => {
    return stations.filter((station) => {
      const matchesFilters = matchesStationFilters(station, filters);
      if (!matchesFilters) {
        return false;
      }

      if (mapDisplayMode === "pricing" && onlyStationsWithPrice) {
        return station.summary.pricing_value !== null;
      }

      return true;
    });
  }, [filters, mapDisplayMode, onlyStationsWithPrice, stations]);

  const uniqueStationCount = useMemo(() => {
    const stationIds = new Set<string>();

    for (const station of filteredStations) {
      stationIds.add(station.station_key);
    }

    return stationIds.size;
  }, [filteredStations]);

  const activeHeatmap = useMemo(
    () => (activeHeatmapMode ? getHeatmapDefinition(activeHeatmapMode as HeatmapMode) : null),
    [activeHeatmapMode]
  );

  const visibleSelectedStation = useMemo(() => {
    if (!selectedStation) {
      return null;
    }

    return filteredStations.some(
      (station) => station.station_key === selectedStation.station_key
    )
      ? selectedStation
      : null;
  }, [filteredStations, selectedStation]);
  const hasOpenPanel = isFiltersOpen || isHeatmapPanelOpen || visibleSelectedStation !== null;

  return (
    <div className="irve-map-wrapper">
      <div className="irve-map-toolbar-shell absolute top-3 right-3 left-3 z-500 flex justify-end sm:left-auto">
        <div className="irve-map-toolbar-panel">
          <SegmentedControl
            className="irve-map-toolbar__segmented"
            hideLegend
            segments={[
              {
                label: "Disponibilité",
                iconId: "fr-icon-road-map-line",
                nativeInputProps: {
                  checked: mapDisplayMode === "markers",
                  onChange: () => setMapDisplayMode("markers"),
                },
              },
              {
                label: "Tarification",
                iconId: "fr-icon-money-euro-circle-line",
                nativeInputProps: {
                  checked: mapDisplayMode === "pricing",
                  onChange: () => {
                    setMapDisplayMode("pricing");
                    pricingModal.open();
                  },
                },
              },
              ...mapModes
                .filter((m) => m.kind === "heatmap")
                .map((mapMode) => ({
                  label: mapMode.shortLabel,
                  iconId: "fr-icon-fire-line" as const,
                  nativeInputProps: {
                    checked: mapDisplayMode === mapMode.value,
                    onChange: () => setMapDisplayMode(mapMode.value),
                  },
                })),
            ] as unknown as [SegmentedControlProps.SegmentWithoutIcon, SegmentedControlProps.SegmentWithoutIcon]}
          />

          <div className="irve-map-toolbar-panel__actions">
            <Button
              priority={isHeatmapPanelOpen ? "primary" : "tertiary no outline"}
              size="small"
              iconId="fr-icon-information-line"
              title="Informations sur la vue courante"
              onClick={() => {
                if (isHeatmapPanelOpen === false) {
                  setIsFiltersOpen(false);
                }
                setIsHeatmapPanelOpen((open) => !open);
              }}
            />

            <Button
              priority={isFiltersOpen ? "primary" : "secondary"}
              iconId="fr-icon-filter-line"
              className="irve-map-toolbar-panel__filters-btn"
              onClick={() => {
                if (isFiltersOpen === false) {
                  setIsHeatmapPanelOpen(false);
                }
                setIsFiltersOpen((open) => !open);
              }}
            >
              Filtres
            </Button>
            {activeFilterCount > 0 && (
              <Badge severity="info">
                {activeFilterCount} filtre{activeFilterCount > 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {hostWebsiteUrl && (
        <Button
          className="absolute bottom-4 left-4 z-500 shadow-[0_8px_24px_rgba(15,23,42,0.16)] max-[960px]:bottom-7 max-[960px]:left-3 max-[960px]:max-w-[calc(100vw-1.5rem)]"
          size="small"
          iconId="fr-icon-arrow-left-line"
          linkProps={{
            href: hostWebsiteUrl,
            target: "_top",
          }}
        >
          Retour au site QualiCharge
        </Button>
      )}

      <MapAnalysisPanel
        isOpen={isHeatmapPanelOpen}
        onClose={() => setIsHeatmapPanelOpen(false)}
        mode={mapDisplayMode}
        onModeChange={setMapDisplayMode}
        modes={mapModes}
        activeMode={activeMode}
        activeHeatmap={activeHeatmap}
        legendStops={activeHeatmap ? activeHeatmap.getStops(activeHeatmap.legendKind === "absolute" ? filteredStations.length : 1) : []}
        activePointCount={filteredStations.length}
        onlyStationsWithPrice={onlyStationsWithPrice}
        onOnlyStationsWithPriceChange={setOnlyStationsWithPrice}
      />

      <MapFiltersPanel
        filters={filters}
        itineranceInputValue={itineranceInputValue}
        isOpen={isFiltersOpen}
        activeCount={activeFilterCount}
        stationCount={uniqueStationCount}
        operatorOptions={operatorOptions}
        operatorsWithoutTarification={operatorsWithoutTarification}
        mapDisplayMode={mapDisplayMode}
        onClose={() => setIsFiltersOpen(false)}
        onReset={resetFilters}
        onAccessChange={setAccess}
        onTogglePower={togglePower}
        onToggleConnector={toggleConnector}
        onItineranceQueryChange={setItineranceInputValue}
        onSelectedOperatorsChange={setSelectedOperators}
      />

      <MapViewport
        stations={filteredStations}
        mode={mapDisplayMode}
        selectedStation={visibleSelectedStation}
        isPanelOpen={hasOpenPanel}
        onStationSelect={(station) => {
          setIsFiltersOpen(false);
          setIsHeatmapPanelOpen(false);
          setSelectedStation(station);
        }}
      />

      <StationDetailsPanel
        station={visibleSelectedStation ? selectedStationDetails : null}
        previewStation={visibleSelectedStation}
        isLoading={Boolean(visibleSelectedStation) && isStationDetailsLoading}
        error={visibleSelectedStation ? stationDetailsError : null}
        isOpen={visibleSelectedStation !== null}
        onClose={() => setSelectedStation(null)}
      />

      <LoadingOverlay loadState={loadState} />

      <PricingModal />
    </div>
  );
}
