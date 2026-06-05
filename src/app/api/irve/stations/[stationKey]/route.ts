import { getCachedIRVEStation } from "@/lib/irve/server/points-cache";
import { jsonReplacer } from "@/lib/json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: RouteContext<"/api/irve/stations/[stationKey]">) {
  const { stationKey } = await context.params;
  const station = await getCachedIRVEStation(decodeURIComponent(stationKey));

  if (!station) {
    return Response.json({ error: "Station not found" }, { status: 404 });
  }

  return new Response(JSON.stringify(station, jsonReplacer), {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}
