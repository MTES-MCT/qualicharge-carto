export interface MapViewportHashState {
  center: [number, number];
  zoom: number;
}

const MIN_LAT = -90;
const MAX_LAT = 90;
const MIN_LNG = -180;
const MAX_LNG = 180;
const MIN_ZOOM = 0;
const MAX_ZOOM = 19;

function parseFiniteNumber(value: string | null) {
  if (value === null || value.trim() === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function isInRange(value: number, min: number, max: number) {
  return value >= min && value <= max;
}

function formatCoordinate(value: number) {
  return value.toFixed(5);
}

function formatZoom(value: number) {
  return Number.isInteger(value)
    ? String(value)
    : value.toFixed(2).replace(/\.?0+$/, "");
}

function getFirstViewportValue(searchParams: URLSearchParams, names: string[]) {
  for (const name of names) {
    const value = searchParams.get(name);
    if (value !== null) {
      return value;
    }
  }

  return null;
}

export function parseMapViewportHash(hash: string): MapViewportHashState | null {
  const params = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
  const lat = parseFiniteNumber(getFirstViewportValue(params, ["lat", "latitude"]));
  const lng = parseFiniteNumber(getFirstViewportValue(params, ["lng", "lon", "longitude"]));
  const zoom = parseFiniteNumber(getFirstViewportValue(params, ["z", "zoom"]));

  if (lat === null || lng === null || zoom === null) {
    return null;
  }

  if (
    !isInRange(lat, MIN_LAT, MAX_LAT) ||
    !isInRange(lng, MIN_LNG, MAX_LNG) ||
    !isInRange(zoom, MIN_ZOOM, MAX_ZOOM)
  ) {
    return null;
  }

  return {
    center: [lat, lng],
    zoom,
  };
}

export function formatMapViewportHash({ center, zoom }: MapViewportHashState) {
  const [lat, lng] = center;
  return `#lat=${formatCoordinate(lat)}&lng=${formatCoordinate(lng)}&z=${formatZoom(zoom)}`;
}

export function replaceMapViewportHash(state: MapViewportHashState) {
  if (typeof window === "undefined") {
    return;
  }

  const nextHash = formatMapViewportHash(state);
  if (window.location.hash === nextHash) {
    return;
  }

  window.history.replaceState(
    window.history.state,
    "",
    `${window.location.pathname}${window.location.search}${nextHash}`
  );
}
