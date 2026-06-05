"use client";

import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Card } from "@codegouvfr/react-dsfr/Card";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { ToggleSwitch } from "@codegouvfr/react-dsfr/ToggleSwitch";

import type { HeatmapDefinition, HeatmapGradientStop } from "@/lib/irve/heatmaps";
import type { MapDisplayMode, MapModeDefinition } from "@/lib/irve/mapModes";
import { MapSidePanel } from "./MapSidePanel";

interface MapAnalysisPanelProps {
  isOpen: boolean;
  onClose: () => void;
  mode: MapDisplayMode;
  onModeChange: (mode: MapDisplayMode) => void;
  modes: MapModeDefinition[];
  activeMode: MapModeDefinition;
  activeHeatmap: HeatmapDefinition | null;
  legendStops: HeatmapGradientStop[];
  activePointCount: number;
  onlyStationsWithPrice: boolean;
  onOnlyStationsWithPriceChange: (value: boolean) => void;
}

export function MapAnalysisPanel({
  isOpen,
  onClose,
  mode,
  onModeChange,
  modes,
  activeMode,
  activeHeatmap,
  legendStops,
  activePointCount,
  onlyStationsWithPrice,
  onOnlyStationsWithPriceChange,
}: MapAnalysisPanelProps) {
  const isPricingMode = mode === "pricing";
  const isStationMode = mode === "markers";

  return (
    <MapSidePanel
      id="map-heatmaps"
      className="z-1220!"
      isOpen={isOpen}
      onClose={onClose}
      eyebrow="Carte de recharge"
      title="Qualité de service"
      subtitle="Analysez la performance du réseau avec des vues thématiques et une légende interprétable."
    >
      <Card
        title="Mode d'analyse"
        titleAs="h3"
        size="small"
        border
        end={
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span>
              {activeMode.kind === "heatmap"
                ? "Une heatmap colore les zones selon l'intensité de l'indicateur choisi."
                : activeMode.description}
            </span>
            <Badge severity={activeMode.kind === "heatmap" ? "info" : "new"}>
              {activeMode.kind === "heatmap" ? "Heatmap" : isPricingMode ? "Tarifs" : "Stations"}
            </Badge>
          </div>
        }
      />

      <Select
        label="Vue thématique"
        hint="Chaque vue mesure un aspect différent de la qualité de service."
        nativeSelectProps={{
          value: mode,
          onChange: (event) => {
            onModeChange(event.target.value as MapDisplayMode);
          },
        }}
      >
        {modes.map((viewMode) => (
          <option key={viewMode.value} value={viewMode.value}>
            {viewMode.shortLabel}
          </option>
        ))}
      </Select>

      {isStationMode || isPricingMode ? null : (
        <Card
          title={activeMode.label}
          titleAs="h3"
          size="small"
          border
          end={
            <div className="space-y-2 text-sm text-slate-700">
              <p className="m-0">{activeMode.description}</p>
              <p className="m-0 text-xs text-slate-500">
                {`${activePointCount} stations contribuent actuellement à cette heatmap.`}
              </p>
            </div>
          }
        />
      )}

      {isPricingMode ? (
        <ToggleSwitch
          helperText="Conserve uniquement les stations pour lesquelles un prix exploitable a ete detecte."
          inputTitle="Afficher uniquement les stations avec prix"
          label="Stations avec prix seulement"
          labelPosition="left"
          showCheckedHint
          checked={onlyStationsWithPrice}
          onChange={onOnlyStationsWithPriceChange}
        />
      ) : null}

      {activeHeatmap && !isPricingMode ? (
        <Card
          title="Légende couleur"
          titleAs="h3"
          size="small"
          border
          end={
            <div className="space-y-3 text-sm">
              <p className="m-0 text-slate-600">{activeHeatmap.legendTitle}</p>
              <div className="h-3 w-full rounded-full bg-[linear-gradient(90deg,#1d4ed8_0%,#06b6d4_25%,#22c55e_50%,#f59e0b_75%,#dc2626_100%)]" />
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-slate-700">
                {legendStops.map((stop) => (
                  <div key={`${activeHeatmap.value}-${stop.value}-${stop.color}`} className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: stop.color }} aria-hidden="true" />
                    <span>{stop.label}</span>
                  </div>
                ))}
              </div>
              {activePointCount === 0 ? (
                <p className="m-0 text-xs text-slate-500">{activeHeatmap.emptyMessage}</p>
              ) : null}
            </div>
          }
        />
      ) : null}
    </MapSidePanel>
  );
}
