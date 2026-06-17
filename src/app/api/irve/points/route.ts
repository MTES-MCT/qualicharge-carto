import { getCachedIRVEPointsResponse, getIRVEPointsRefreshIntervalSeconds } from "@/lib/irve/server/points-cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getCacheAgeSeconds(loadedAt: number) {
  return Math.max(0, Math.floor((Date.now() - loadedAt) / 1000));
}

function getSharedMaxAgeSeconds(loadedAt: number) {
  return Math.max(0, getIRVEPointsRefreshIntervalSeconds() - getCacheAgeSeconds(loadedAt));
}

function matchesETag(ifNoneMatch: string | null, etag: string) {
  return ifNoneMatch?.split(",").some((value) => value.trim() === etag || value.trim() === "*") ?? false;
}

export async function GET(request: Request) {
  try {
    const cached = await getCachedIRVEPointsResponse({ refreshStale: true });
    const acceptedEncoding = request.headers.get("accept-encoding") ?? "";
    const supportsBrotli = acceptedEncoding.includes("br");
    const supportsGzip = acceptedEncoding.includes("gzip");
    const cacheAgeSeconds = getCacheAgeSeconds(cached.loadedAt);
    const sharedMaxAgeSeconds = getSharedMaxAgeSeconds(cached.loadedAt);
    const headers = {
      "Cache-Control": `public, max-age=0, s-maxage=${sharedMaxAgeSeconds}, must-revalidate`,
      "CDN-Cache-Control": `public, max-age=${sharedMaxAgeSeconds}, must-revalidate`,
      "Content-Type": "application/json; charset=utf-8",
      ETag: cached.etag,
      "Last-Modified": new Date(cached.loadedAt).toUTCString(),
      Vary: "Accept-Encoding",
      "X-IRVE-Cache-Age": String(cacheAgeSeconds),
      "X-IRVE-Cache-TTL": String(sharedMaxAgeSeconds),
      "X-IRVE-Station-Count": String(cached.total),
      ...(supportsBrotli ? { "Content-Encoding": "br" } : supportsGzip ? { "Content-Encoding": "gzip" } : {}),
    };

    if (matchesETag(request.headers.get("if-none-match"), cached.etag)) {
      return new Response(null, {
        status: 304,
        headers,
      });
    }

    const body = supportsBrotli ? cached.brotliBody : supportsGzip ? cached.gzipBody : cached.body;

    return new Response(body, {
      headers,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load IRVE data";

    return Response.json({ error: message }, { status: 500 });
  }
}
