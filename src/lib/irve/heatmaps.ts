import type { IRVEMapStation } from "@/types/irve-runtime";

export interface HeatmapGradientStop {
  value: number;
  color: string;
  label: string;
}

export type HeatmapLegendKind = "absolute" | "qualitative";

export interface HeatmapGradient {
  [key: number]: string;
}

export interface HeatmapPoint {
  lat: number;
  lng: number;
  intensity: number;
}

export interface HeatmapConfig {
  points: HeatmapPoint[];
  maxIntensity: number;
  stops: HeatmapGradientStop[];
}

export type HeatmapMode =
  | "plugCount"
  | "availabilityRatio"
  | "outOfService"
  | "serviceCoverage";

export interface HeatmapDefinition {
  value: Exclude<HeatmapMode, null>;
  label: string;
  shortLabel: string;
  order: number;
  description: string;
  legendTitle: string;
  legendKind: HeatmapLegendKind;
  emptyMessage: string;
  radius: number;
  blur: number;
  normalizedWeightExponent?: number;
}

export interface HeatmapDefinitionWithMetric extends HeatmapDefinition {
  getIntensity: (station: IRVEMapStation) => number | null;
  getStops: (maxIntensity: number) => HeatmapGradientStop[];
}

export const DEFAULT_HEATMAP_GRADIENT = {
  0.15: "#1d4ed8",
  0.4: "#06b6d4",
  0.6: "#22c55e",
  0.8: "#f59e0b",
  1: "#dc2626",
} as const;

export function buildCountStops(
  maxIntensity: number,
  singular: string,
  plural: string
): HeatmapGradientStop[] {
  const safeMax = Math.max(Math.ceil(maxIntensity), 1);
  const ratios = [0.15, 0.4, 0.6, 0.8, 1];
  const colors = Object.values(DEFAULT_HEATMAP_GRADIENT);

  return ratios.map((ratio, index) => {
    const rawValue = index === ratios.length - 1 ? safeMax : Math.max(1, Math.round(safeMax * ratio));
    const value = Math.min(rawValue, safeMax);

    return {
      value,
      color: colors[index],
      label: `${value} ${value > 1 ? plural : singular}`,
    };
  });
}

export function buildQualitativeStops(): HeatmapGradientStop[] {
  return [
    { value: 0.15, color: DEFAULT_HEATMAP_GRADIENT[0.15], label: "Faible" },
    { value: 0.4, color: DEFAULT_HEATMAP_GRADIENT[0.4], label: "Moderée" },
    { value: 0.6, color: DEFAULT_HEATMAP_GRADIENT[0.6], label: "Soutenue" },
    { value: 0.8, color: DEFAULT_HEATMAP_GRADIENT[0.8], label: "Forte" },
    { value: 1, color: DEFAULT_HEATMAP_GRADIENT[1], label: "Très forte" },
  ];
}

export const SERVICE_HEATMAPS: HeatmapDefinitionWithMetric[] = [
  // {
  //   value: "availabilityRatio",
  //   label: "Disponibilité réelle des points de charge",
  //   shortLabel: "Disponibilité réelle",
  //   order: 20,
  //   description:
  //     "Montre les zones où la part de points de charge libres et fonctionnels est la plus forte.",
  //   legendTitle: "Part des points libres et fonctionnels",
  //   emptyMessage: "Aucune donnée dynamique exploitable pour calculer la disponibilité.",
  //   radius: 30,
  //   blur: 22,
  //   getIntensity: (station) => {
  //     const summary = getStationDynamicSummary(station);
  //     const denominator = Math.max(summary.pdcsWithDynamicCount, station.pdcs.length, 0);

  //     if (denominator <= 0) {
  //       return null;
  //     }

  //     return summary.availableCount / denominator;
  //   },
  //   getStops: () => [
  //     { value: 0, color: "#1d4ed8", label: "0 %" },
  //     { value: 0.25, color: "#06b6d4", label: "25 %" },
  //     { value: 0.5, color: "#22c55e", label: "50 %" },
  //     { value: 0.75, color: "#f59e0b", label: "75 %" },
  //     { value: 1, color: "#dc2626", label: "100 %" },
  //   ],
  // },
  // {
  //   value: "outOfService",
  //   label: "Pannes et indisponibilités",
  //   shortLabel: "Pannes et indisponibilités",
  //   order: 30,
  //   description:
  //     "Repère les zones où les points de charge hors service ou non fonctionnels sont les plus nombreux.",
  //   legendTitle: "Nombre de points en panne ou indisponibles",
  //   emptyMessage: "Aucun point hors service ou non fonctionnel dans la sélection courante.",
  //   radius: 28,
  //   blur: 20,
  //   getIntensity: (station) => {
  //     const count = station.pdcs.filter(
  //       (pdc) => pdc.dynamic?.etat_pdc === EtatPDCEnum.HORS_SERVICE || !isFunctionalPdc(pdc)
  //     ).length;

  //     return count > 0 ? count : null;
  //   },
  //   getStops: (maxIntensity) => buildCountStops(maxIntensity, "point en panne", "points en panne"),
  // },
  // {
  //   value: "serviceCoverage",
  //   label: "Couverture de service exploitable",
  //   shortLabel: "Couverture exploitable",
  //   order: 40,
  //   description:
  //     "Met en avant les zones qui cumulent le plus de points de charge actuellement libres et fonctionnels.",
  //   legendTitle: "Nombre de points libres et fonctionnels",
  //   emptyMessage: "Aucun point libre et fonctionnel détecté dans la sélection courante.",
  //   radius: 30,
  //   blur: 22,
  //   getIntensity: (station) => {
  //     const summary = getStationDynamicSummary(station);
  //     return summary.availableCount > 0 ? summary.availableCount : null;
  //   },
  //   getStops: (maxIntensity) => buildCountStops(maxIntensity, "point disponible", "points disponibles"),
  // },
  {
    value: "plugCount",
    label: "Concentration de capacite du reseau",
    shortLabel: "Capacité totale (Bêta)",
    order: 50,
    description:
      "Visualise les zones ou la concentration locale de points de charge est la plus forte, sans representer un nombre absolu station par station.",
    legendTitle: "Concentration locale de points de charge",
    legendKind: "qualitative",
    emptyMessage: "Aucune station avec un nombre de points de charge exploitable.",
    radius: 40,
    blur: 12,
    normalizedWeightExponent: 0.4,
    getIntensity: (station) => (station.pdc_count > 0 ? station.pdc_count : null),
    getStops: () => buildQualitativeStops(),
  },
];

export function getHeatmapDefinition(mode: HeatmapMode) {
  if (mode === null) {
    return null;
  }

  return SERVICE_HEATMAPS.find((heatmap) => heatmap.value === mode) ?? null;
}

export function buildHeatmapConfig(
  stations: IRVEMapStation[],
  activeHeatmap: HeatmapDefinitionWithMetric | null
): HeatmapConfig {
  if (!activeHeatmap) {
    return {
      points: [],
      maxIntensity: 0,
      stops: [],
    };
  }

  const entries = stations.flatMap((station) => {
    const intensity = activeHeatmap.getIntensity(station);
    if (intensity == null || intensity <= 0) {
      return [];
    }

    return [{ lat: station.lat, lng: station.lng, intensity }];
  });

  const maxIntensity = entries.reduce((max, entry) => Math.max(max, entry.intensity), 0);
  const normalizedWeightExponent = activeHeatmap.normalizedWeightExponent ?? 1;
  const normalizedPoints =
    maxIntensity > 0
      ? entries.map((entry) => ({
          ...entry,
          intensity: Math.pow(entry.intensity / maxIntensity, normalizedWeightExponent),
        }))
      : [];

  return {
    points: normalizedPoints,
    maxIntensity,
    stops: activeHeatmap.getStops(maxIntensity),
  };
}
