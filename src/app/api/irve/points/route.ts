import { getCachedIRVEPointsResponse } from "@/lib/irve/server/points-cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const cached = await getCachedIRVEPointsResponse();
    const acceptedEncoding = request.headers.get("accept-encoding") ?? "";
    const supportsBrotli = acceptedEncoding.includes("br");
    const supportsGzip = acceptedEncoding.includes("gzip");

    const body = supportsBrotli ? cached.brotliBody : supportsGzip ? cached.gzipBody : cached.body;

    return new Response(body, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "application/json; charset=utf-8",
        "Vary": "Accept-Encoding",
        "X-IRVE-Cache-Age": String(Math.max(0, Math.floor((Date.now() - cached.loadedAt) / 1000))),
        "X-IRVE-Station-Count": String(cached.total),
        ...(supportsBrotli ? { "Content-Encoding": "br" } : supportsGzip ? { "Content-Encoding": "gzip" } : {}),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load IRVE data";

    return Response.json({ error: message }, { status: 500 });
  }
}
