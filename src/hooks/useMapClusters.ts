"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BBox } from "geojson";
import type SuperclusterType from "supercluster";
import Supercluster from "supercluster";
import type { Map as LeafletMap } from "leaflet";

import type {
  IRVEClusterFeature,
  IRVEClusterOrPoint,
  IRVEMapStation,
  IRVEPointProperties,
} from "@/types/irve-runtime";

type ClusterPoint = SuperclusterType.PointFeature<IRVEPointProperties>;

const DEFAULT_BOUNDS: BBox = [-180, -85, 180, 85];

function areBoundsEqual(a: BBox, b: BBox) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
}

function toClusterPoint(station: IRVEMapStation): ClusterPoint {
  return {
    type: "Feature",
    id: station.id,
    properties: {
      cluster: false,
      id: station.id,
      row: station,
    },
    geometry: {
      type: "Point",
      coordinates: [station.lng, station.lat],
    },
  };
}

export function useMapClusters(stations: IRVEMapStation[]) {
  const mapRef = useRef<LeafletMap | null>(null);
  const [bounds, setBounds] = useState<BBox>(DEFAULT_BOUNDS);
  const [zoom, setZoom] = useState(6);

  const index = useMemo(() => {
    const supercluster = new Supercluster<IRVEPointProperties, Record<string, never>>({
      radius: 100,
      maxZoom: 17,
      minPoints: 1,
    });

    const features = new Array<ClusterPoint>(stations.length);
    for (let i = 0; i < stations.length; i += 1) {
      features[i] = toClusterPoint(stations[i]);
    }

    supercluster.load(features);
    return supercluster;
  }, [stations]);

  const clusters = useMemo<IRVEClusterOrPoint[]>(() => {
    return index.getClusters(bounds, zoom) as IRVEClusterOrPoint[];
  }, [bounds, index, zoom]);

  useEffect(() => {
    if (!mapRef.current) return;

    const currentBounds = mapRef.current.getBounds();
    setBounds([
      currentBounds.getWest(),
      currentBounds.getSouth(),
      currentBounds.getEast(),
      currentBounds.getNorth(),
    ]);
    setZoom(mapRef.current.getZoom());
  }, [index]);

  const updateView = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    const nextBounds = map.getBounds();
    const nextBBox: BBox = [
      nextBounds.getWest(),
      nextBounds.getSouth(),
      nextBounds.getEast(),
      nextBounds.getNorth(),
    ];
    const nextZoom = map.getZoom();

    setBounds((prev) => (areBoundsEqual(prev, nextBBox) ? prev : nextBBox));
    setZoom((prev) => (prev === nextZoom ? prev : nextZoom));
  }, []);

  return { clusters, supercluster: index, mapRef, zoom, updateView };
}

export function isClusterFeature(
  feature: IRVEClusterOrPoint
): feature is IRVEClusterFeature {
  return feature.properties.cluster === true;
}
