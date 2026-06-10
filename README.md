Qualicharge dataviz is a Next.js application for exploring consolidated IRVE charging-station data on a map.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

The map data is served by the Next.js API route at `/api/irve/points`. The first request warms an in-memory server cache by fetching and consolidating the static and dynamic Parquet sources; later requests reuse that cached payload while the backend refreshes it periodically. This endpoint returns compact map features only, and full station details are loaded on demand through `/api/irve/stations/[stationKey]`.

## Data Environment

The backend accepts these optional environment variables:

Static IRVE Parquet and dynamic IRVE CSV URLs are resolved from the stable data.gouv.fr resource metadata.
- `TARIFF_SOURCE_MODE`: tariff loading strategy. Defaults to `local-files`. Use `consolidated` to load the legacy single parquet URL.
- `TARIFF_PARQUET_DIR`: local tariff parquet root directory. Defaults to `data/tariffs`.
  Each direct child folder is parsed as one provider and must contain `qualicharge_tariff.parquet` and `qualicharge_tariffpdc.parquet`, for example `data/tariffs/tesla/qualicharge_tariff.parquet`.
- `TARIFFS_PARQUET_URL`: legacy consolidated tariff parquet URL used when `TARIFF_SOURCE_MODE=consolidated`. Defaults to `http://localhost:8020/d/tariffs.parquet`.
- `PARQUET_REFRESH_INTERVAL_SECONDS`: cache refresh interval in seconds. Defaults to `300`.
- `TARIFF_MARKER_SESSION_DURATION_MINUTES`: session duration used to evaluate tariff restrictions for map markers. Defaults to `30`.
- `TARIFF_MARKER_SESSION_KWH`: session energy used to evaluate tariff restrictions for map markers. Defaults to `51`.

## Map Embedding

Set `NEXT_PUBLIC_HOST_WEBSITE_URL` to display a floating link back to the website that embeds the map, for example:

```bash
NEXT_PUBLIC_HOST_WEBSITE_URL=https://www.qualicharge.beta.gouv.fr/cartographie/
```

When this variable is not set, the link is hidden. Because this value is exposed to the browser by Next.js, set it before building the app.

## Production

Build and start the server with:

```bash
npm run build
npm run start
```

This app now requires a Node.js Next server for the API route and cache; it is not a static export.
