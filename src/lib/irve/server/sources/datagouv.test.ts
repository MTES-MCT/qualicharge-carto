import { afterEach, describe, expect, it, vi } from "vitest";

import {
  dataGouvSourceLoader,
  getDataGouvDynamicCsvUrl,
  getDataGouvStaticParquetUrl,
} from "./datagouv";

const STATIC_METADATA_URL =
  "https://www.data.gouv.fr/api/1/datasets/infrastructures-de-recharge-pour-vehicules-electriques-donnees-ouvertes/resources/8bb0a6e2-1016-42ba-aaee-f72f55c82e9f/";
const DYNAMIC_METADATA_URL =
  "https://www.data.gouv.fr/api/1/datasets/infrastructures-de-recharge-pour-vehicules-electriques-donnees-ouvertes/resources/411443b1-6667-473f-8217-1c57c167408f/";

async function readRows(rows: AsyncIterable<Record<string, unknown>>) {
  const records = [];

  for await (const record of rows) {
    records.push(record);
  }

  return records;
}

describe("data.gouv.fr source loader", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("resolves the static parquet URL from resource metadata", async () => {
    const fetchMock = vi.fn(async () => Response.json({
      extras: {
        "analysis:parsing:parquet_url": "https://hydra.example/parquet/static.parquet",
      },
    }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getDataGouvStaticParquetUrl()).resolves.toBe(
      "https://hydra.example/parquet/static.parquet"
    );
    expect(fetchMock).toHaveBeenCalledWith(STATIC_METADATA_URL, { cache: "no-store" });
  });

  it("resolves and streams the dynamic CSV", async () => {
    const dynamicUrl = "https://www.data.gouv.fr/api/1/datasets/r/dynamic";
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      if (String(input) === DYNAMIC_METADATA_URL) {
        return Response.json({ latest: dynamicUrl });
      }

      return new Response("id_pdc_itinerance,etat_pdc\nFRTEST1,en_service\n");
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(readRows(dataGouvSourceLoader.streamDynamicRows())).resolves.toEqual([
      { id_pdc_itinerance: "FRTEST1", etat_pdc: "en_service" },
    ]);
    expect(fetchMock).toHaveBeenNthCalledWith(1, DYNAMIC_METADATA_URL, { cache: "no-store" });
    expect(fetchMock).toHaveBeenNthCalledWith(2, dynamicUrl, { cache: "no-store" });
  });

  it("fails when static resource metadata has no parquet URL", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ extras: {} })));

    await expect(getDataGouvStaticParquetUrl()).rejects.toThrow(
      "missing analysis:parsing:parquet_url"
    );
  });

  it("fails when dynamic resource metadata has no latest URL", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ extras: {} })));

    await expect(getDataGouvDynamicCsvUrl()).rejects.toThrow("missing latest URL");
  });

  it("fails when a resource metadata request fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 503 })));

    await expect(getDataGouvDynamicCsvUrl()).rejects.toThrow("HTTP 503");
  });
});
