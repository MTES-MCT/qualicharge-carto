"use client";

import { useEffect } from "react";
import { useMap, useMapEvents } from "react-leaflet";
import type { Map as LeafletMap } from "leaflet";

export interface MapEventsProps {
  onViewChange: (map: LeafletMap) => void;
  onMapReady: (map: LeafletMap) => void;
}

export function MapEvents({ onViewChange, onMapReady }: MapEventsProps) {
  const map = useMap();

  useEffect(() => {
    onMapReady(map);
  }, [map, onMapReady]);

  useMapEvents({
    moveend: () => onViewChange(map),
    zoomend: () => onViewChange(map),
  });

  return null;
}
