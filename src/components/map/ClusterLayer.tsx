"use client";

import { useMemo } from "react";
import { DivIcon } from "leaflet";
import { Marker, useMap } from "react-leaflet";
import L from "leaflet";
import type SuperclusterType from "supercluster";

import type { IRVEClusterOrPoint, IRVEMapStation, IRVEPointProperties } from "@/types/irve-runtime";
import { isClusterFeature } from "@/hooks/useMapClusters";
import type { MarkerDisplayMode } from "@/lib/irve/mapModes";
import { getStationRecencyRanks } from "@/lib/irve/markerOrder";

const clusterIconCache = new Map<number, L.DivIcon>();
const pointIconCache = new Map<string, DivIcon>();
const MARKER_Z_INDEX_STEP = 1_000;
interface MarkerVisualContent {
  primaryLabel: string;
  secondaryLabel: string;
  toneColor: string | null;
  primaryTextColor?: string | null;
  secondaryTextColor?: string | null;
}

type MarkerContentBuilder = (station: IRVEMapStation) => MarkerVisualContent;

function getClusterIcon(count: number): L.DivIcon {
  const size = count < 10 ? 36 : count < 100 ? 44 : count < 1000 ? 52 : 62;

  const cached = clusterIconCache.get(size);
  if (cached) {
    return L.divIcon({
      html: `<div class="irve-cluster" style="width:${size}px;height:${size}px;font-size:${size < 44 ? 12 : 13}px">${count > 9999 ? "10k+" : count}</div>`,
      className: "",
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  }

  const icon = L.divIcon({
    html: `<div class="irve-cluster" style="width:${size}px;height:${size}px;font-size:${size < 44 ? 12 : 13}px">${count > 9999 ? "10k+" : count}</div>`,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
  clusterIconCache.set(size, icon);
  return icon;
}

function getClusterClassName(count: number) {
  if (count < 10) return "irve-cluster-marker irve-cluster-marker--sm";
  if (count < 100) return "irve-cluster-marker irve-cluster-marker--md";
  if (count < 1000) return "irve-cluster-marker irve-cluster-marker--lg";
  return "irve-cluster-marker irve-cluster-marker--xl";
}

function getPointPowerLabel(power: number | null | undefined) {
  if (!power) return "-";
  return `${power}`;
}

function getPointPlugsLabel(available: number, total: number | null | undefined) {
  if (!total) return "-/- PDC";
  return `${available}/${total}`;
  // return `${available}/${total} PDC`;
}

interface PowerTone {
  bg: string;
  text: string;
}

function getPowerTone(power: number | null | undefined): PowerTone {
  if (!power) return { bg: "#6b7280", text: "#ffffff" };
  if (power >= 350) return { bg: "#447049", text: "#e6feda" }; // sun-425 on 975
  if (power >= 150) return { bg: "#68A532", text: "#e6feda" }; // main-640 on 975
  if (power >= 50)  return { bg: "#95e257", text: "#447049" }; // 850 on sun-425
  if (power >= 22)  return { bg: "#a9fb68", text: "#447049" }; // 925 on sun-425
  if (power >= 7.4) return { bg: "#c9fcac", text: "#447049" }; // 950 on sun-425
  return { bg: "#e6feda", text: "#447049" };                   // 975 on sun-425
}

function getPricingTone(dimension: string | null | undefined): PowerTone {
  switch (dimension) {
    case "ENERGY":
      return { bg: "#18753c", text: "#ffffff" };
    case "TIME":
      return { bg: "#a55800", text: "#ffffff" };
    case "FLAT":
      return { bg: "#6e445a", text: "#ffffff" };
    default:
      return { bg: "#64748b", text: "#ffffff" };
  }
}

function getPricingTypeLabel(dimension: string | null | undefined) {
  switch (dimension) {
    case "ENERGY":
      return "par kWh";
    case "TIME":
      return "par heure";
    case "FLAT":
      return "forfait";
    default:
      return "N/C";
  }
}

function getCompactPricingHeadline(headline: string | null | undefined) {
  return headline?.replace(/(€)\s*\/\s*(?:kwh|h)$/i, "$1") ?? null;
}

const markerContentBuilders: Record<MarkerDisplayMode, MarkerContentBuilder> = {
  markers: (station) => {
    const tone = getPowerTone(station.summary.max_power);

    return {
      primaryLabel: getPointPowerLabel(station.summary.max_power),
      secondaryLabel: getPointPlugsLabel(
        station.dynamic_summary.available_count,
        station.dynamic_summary.pdcs_with_dynamic_count
      ),
      toneColor: tone.bg,
      primaryTextColor: tone.text,
      secondaryTextColor: "#334155",
    };
  },
  pricing: (station) => {
    const tone = getPricingTone(station.summary.pricing_dimension);
    const topLabel =
      station.summary.pricing_status === "FREE"
        ? "Gratuit"
        : getCompactPricingHeadline(station.summary.pricing_headline) ?? "-";

    return {
      primaryLabel: topLabel,
      secondaryLabel: getPricingTypeLabel(station.summary.pricing_dimension),
      toneColor: tone.bg,
      primaryTextColor: tone.text,
      secondaryTextColor: "#334155",
    };
  },
};

function getPointIcon(
  primaryLabel: string,
  secondaryLabel: string,
  toneColor: string | null,
  isSelected: boolean,
  primaryTextColor?: string | null,
  secondaryTextColor?: string | null,
  debug?: string
): DivIcon {
  const cacheKey = `${primaryLabel}|${secondaryLabel}|${toneColor ?? "neutral"}|${primaryTextColor ?? "default"}|${secondaryTextColor ?? "default"}|${isSelected ? "selected" : "default"}`;
  const cached = pointIconCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const primaryStyle = [
    toneColor ? `background:${toneColor}` : null,
    primaryTextColor ? `color:${primaryTextColor}` : null,
  ].filter(Boolean).join(";");

  const secondaryStyle = secondaryTextColor ? `color:${secondaryTextColor}` : "";

  const icon = L.divIcon({
    html: `<div class="irve-point-anchor">
      <div class="irve-point-card${isSelected ? " is-selected" : ""}">
        <div class="irve-point-card__primary"${primaryStyle ? ` style="${primaryStyle}"` : ""}>
          ${primaryLabel}
        </div>
        <div class="irve-point-card__secondary"${secondaryStyle ? ` style="${secondaryStyle}"` : ""}>
          ${secondaryLabel}
        </div>
        ${debug ? `<div>${debug}</div>`:``}
        <div class="irve-point-card__tip"></div>
      </div>
    </div>`,
    className: "",
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    popupAnchor: [0, -50],
  });

  pointIconCache.set(cacheKey, icon);
  return icon;
}

interface ClusterLayerProps {
  clusters: IRVEClusterOrPoint[];
  supercluster: SuperclusterType<IRVEPointProperties, Record<string, never>>;
  displayMode?: MarkerDisplayMode;
  selectedStationId?: string | null;
  onStationSelect?: (station: IRVEPointProperties["row"]) => void;
}

export function ClusterLayer({
  clusters,
  supercluster,
  displayMode = "markers",
  selectedStationId,
  onStationSelect,
}: ClusterLayerProps) {
  const map = useMap();
  const getMarkerContent = markerContentBuilders[displayMode];

  const elements = useMemo(() => {
    const pointStations = clusters.flatMap((feature) =>
      isClusterFeature(feature) ? [] : [feature.properties.row]
    );
    const recencyRanks = getStationRecencyRanks(pointStations);
    const selectedMarkerZIndex = (pointStations.length + 1) * MARKER_Z_INDEX_STEP;

    return clusters.map((feature) => {
      const [lng, lat] = feature.geometry.coordinates;

      if (isClusterFeature(feature)) {
        const { cluster_id, point_count } = feature.properties;

        return (
          <Marker
            key={`cluster-${cluster_id}`}
            position={[lat, lng]}
            icon={getClusterIcon(point_count)}
            zIndexOffset={point_count}
            eventHandlers={{
              click: () => {
                const expansionZoom = Math.min(
                  supercluster.getClusterExpansionZoom(cluster_id),
                  18
                );
                map.setView([lat, lng], expansionZoom, { animate: true });
              },
              add: (event) => {
                const element = event.target.getElement();
                if (!element) return;

                const markerElement = element.querySelector(".irve-cluster");
                if (!markerElement) return;

                markerElement.className = `${getClusterClassName(point_count)} irve-cluster`;
              },
            }}
          />
        );
      }

      const p = feature.properties.row;
      const isSelected = p.station_key === selectedStationId;
      const markerContent = getMarkerContent(p);
      const recencyZIndex = (recencyRanks.get(p.station_key) ?? 0) * MARKER_Z_INDEX_STEP;

      return (
        <Marker
          key={`point-${feature.id ?? feature.properties.id}`}
          position={[lat, lng]}
          icon={getPointIcon(
            markerContent.primaryLabel,
            markerContent.secondaryLabel,
            markerContent.toneColor,
            isSelected,
            markerContent.primaryTextColor,
            markerContent.secondaryTextColor,
          )}
          zIndexOffset={isSelected ? selectedMarkerZIndex : recencyZIndex}
          eventHandlers={{
            click: () => {
              const panelWidth = window.innerWidth >= 768 ? Math.min(608, window.innerWidth) : 0;
              const offsetX = panelWidth > 0 ? panelWidth / 2 : 0;
              const targetPoint = map.project([lat, lng], Math.max(map.getZoom(), 14)).subtract([offsetX, 0]);
              const targetLatLng = map.unproject(targetPoint, Math.max(map.getZoom(), 14));

              map.setView(targetLatLng, Math.max(map.getZoom(), 14), { animate: true });
              onStationSelect?.(p);
            },
            add: (event) => {
              const element = event.target.getElement();
              if (!element) return;

              element.classList.add("irve-point-marker");
            },
          }}
        />
      );
    });
  }, [clusters, getMarkerContent, map, selectedStationId, supercluster, onStationSelect]);

  return <>{elements}</>;
}
