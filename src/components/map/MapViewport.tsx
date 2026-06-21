"use client";

import { useCallback, useMemo } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import type { Map as LeafletMap } from "leaflet";
import { Button } from "@codegouvfr/react-dsfr/Button";

import { useMapClusters } from "@/hooks/useMapClusters";
import {
  buildHeatmapConfig,
  getHeatmapDefinition,
  type HeatmapMode,
} from "@/lib/irve/heatmaps";
import {
  isHeatmapDisplayMode,
  type MapDisplayMode,
} from "@/lib/irve/mapModes";
import {
  parseMapViewportHash,
  replaceMapViewportHash,
} from "@/lib/irve/mapViewportHash";
import type { IRVEMapStation } from "@/types/irve-runtime";
import { ClusterLayer } from "./ClusterLayer";
import { HeatmapLayer } from "./HeatmapLayer";
import { MapAddressSearch } from "./MapAddressSearch";
import { MapEvents } from "./MapEvents";

const FRANCE_CENTER: [number, number] = [46.6, 2.3];
const INITIAL_ZOOM = 6;

function getInitialViewport() {
  if (typeof window === "undefined") {
    return {
      center: FRANCE_CENTER,
      zoom: INITIAL_ZOOM,
    };
  }

  return parseMapViewportHash(window.location.hash) ?? {
    center: FRANCE_CENTER,
    zoom: INITIAL_ZOOM,
  };
}

interface MapViewportProps {
  stations: IRVEMapStation[];
  mode: MapDisplayMode;
  selectedStation: IRVEMapStation | null;
  isPanelOpen: boolean;
  onStationSelect: (station: IRVEMapStation | null) => void;
}

export function MapViewport({
  stations,
  mode,
  selectedStation,
  isPanelOpen,
  onStationSelect,
}: MapViewportProps) {
  const { clusters, supercluster, mapRef, updateView } = useMapClusters(stations);
  const initialViewport = useMemo(() => getInitialViewport(), []);

  const activeHeatmapMode = isHeatmapDisplayMode(mode) ? mode : null;
  const activeHeatmap = useMemo(
    () => (activeHeatmapMode ? getHeatmapDefinition(activeHeatmapMode as HeatmapMode) : null),
    [activeHeatmapMode]
  );
  const heatmapConfig = useMemo(
    () => buildHeatmapConfig(stations, activeHeatmap),
    [activeHeatmap, stations]
  );
  const visibleSelectedStation = useMemo(() => {
    if (!selectedStation) {
      return null;
    }

    return stations.some(
      (station) => station.station_key === selectedStation.station_key
    )
      ? selectedStation
      : null;
  }, [stations, selectedStation]);
  const zoomPanelOffsetClass = isPanelOpen
    ? "md:left-[calc(var(--irve-map-panel-width)+1.5rem)]"
    : "md:left-4";
  const searchPanelOffsetClass = isPanelOpen
    ? "is-panel-open"
    : "";

  const handleMapReady = useCallback(
    (map: LeafletMap) => {
      mapRef.current = map;
      updateView();
    },
    [mapRef, updateView]
  );

  const handleMapViewEnd = useCallback(
    (map: LeafletMap) => {
      updateView();

      const center = map.getCenter();
      replaceMapViewportHash({
        center: [center.lat, center.lng],
        zoom: map.getZoom(),
      });
    },
    [updateView]
  );

  return (
    <>
      <MapAddressSearch
        className={searchPanelOffsetClass}
        mapRef={mapRef}
      />

      <MapContainer
        center={initialViewport.center}
        zoom={initialViewport.zoom}
        style={{ height: "100%", width: "100%" }}
        preferCanvas
        zoomAnimation
        markerZoomAnimation
        fadeAnimation
        zoomControl={false}
        attributionControl
      >
      <div className={`irve-map-zoom-controls pointer-events-none absolute left-4 top-4 z-[1000] transition-[left] duration-[280ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] md:top-4 ${zoomPanelOffsetClass}`}>
        <div className="pointer-events-auto flex flex-col gap-2">
          <div className="bg-white">
            <Button
              priority="secondary"
              iconId="fr-icon-add-line"
              onClick={() => mapRef.current?.zoomIn()}
              title="Zoom avant"
            />
          </div>
          <div className="bg-white">
            <Button
              priority="secondary"
              iconId="fr-icon-subtract-line"
              onClick={() => mapRef.current?.zoomOut()}
              title="Zoom arrière"
            />
          </div>
        </div>
      </div>

      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | <a href="https://www.qualicharge.beta.gouv.fr/">Qualicharge</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
        keepBuffer={4}
      />

      <MapEvents onViewChange={handleMapViewEnd} onMapReady={handleMapReady} />

      {activeHeatmapMode === null ? (
        <ClusterLayer
          clusters={clusters}
          supercluster={supercluster}
          displayMode={mode === "pricing" ? "pricing" : "markers"}
          selectedStationId={visibleSelectedStation?.station_key ?? null}
          onStationSelect={onStationSelect}
        />
      ) : (
        <HeatmapLayer
          points={heatmapConfig.points}
          radius={activeHeatmap?.radius}
          blur={activeHeatmap?.blur}
        />
      )}
      </MapContainer>
    </>
  );
}
