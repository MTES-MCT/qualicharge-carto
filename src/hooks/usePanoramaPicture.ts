"use client";

import { useEffect, useMemo, useState } from "react";

import { fetchPanorama } from "@/lib/irve/panoramax/fetch-panoramax-image";
import { type PanoramaResult } from "@/types/panoramax";

const PANORAMA_ENABLED = true;

function parseCoordinates(coords: string | null | undefined) {
  if (!coords) return null;

  try {
    const parts: unknown = JSON.parse(coords);
    if (!Array.isArray(parts) || parts.length !== 2) return null;

    const lon = Number.parseFloat(String(parts[0]));
    const lat = Number.parseFloat(String(parts[1]));

    if (Number.isNaN(lat) || Number.isNaN(lon)) return null;

    return { lat, lon };
  } catch {
    return null;
  }
}

export function usePanoramaPicture(coords: string | null | undefined, delta = 0.0002) {
  const parsedCoords = useMemo(() => parseCoordinates(coords), [coords]);
  const [picture, setPicture] = useState<PanoramaResult | null>(null);

  useEffect(() => {
    if (!PANORAMA_ENABLED) {
      return;
    }

    if (!parsedCoords) {
      return;
    }

    let isCancelled = false;

    fetchPanorama({
      lat: parsedCoords.lat,
      lon: parsedCoords.lon,
      delta,
    })
      .then((panorama) => {
        if (!isCancelled) {
          setPicture(panorama);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setPicture(null);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [delta, parsedCoords]);

  if (!PANORAMA_ENABLED) {
    return null;
  }

  return parsedCoords ? picture : null;
}
