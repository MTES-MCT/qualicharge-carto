import { afterEach, describe, expect, it, vi } from "vitest";

import { getDynamicCsvUrl, getStaticParquetUrl } from "./data-gouv";

describe("data.gouv.fr parquet URL resolution", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reads the current parquet URL from resource metadata", async () => {
    const fetchMock = vi.fn(async () => Response.json({
      extras: {
        "analysis:parsing:parquet_url": "https://hydra.example/parquet/static.parquet",
      },
    }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getStaticParquetUrl()).resolves.toBe("https://hydra.example/parquet/static.parquet");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://www.data.gouv.fr/api/1/datasets/infrastructures-de-recharge-pour-vehicules-electriques-donnees-ouvertes/resources/8bb0a6e2-1016-42ba-aaee-f72f55c82e9f/",
      { cache: "no-store" }
    );
  });

  it("reads the current dynamic CSV URL from resource metadata", async () => {
    const fetchMock = vi.fn(async () => Response.json({
      latest: "https://www.data.gouv.fr/api/1/datasets/r/411443b1-6667-473f-8217-1c57c167408f",
      extras: {
        "analysis:parsing:parquet_url": "https://hydra.example/parquet/dynamic.parquet",
      },
    }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getDynamicCsvUrl()).resolves.toBe(
      "https://www.data.gouv.fr/api/1/datasets/r/411443b1-6667-473f-8217-1c57c167408f"
    );
  });

  it("fails when the resource metadata has no parquet URL", async () => {
    const fetchMock = vi.fn(async () => Response.json({ extras: {} }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getStaticParquetUrl()).rejects.toThrow("missing analysis:parsing:parquet_url");
  });

  it("fails when the data.gouv.fr resource request fails", async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 503 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getDynamicCsvUrl()).rejects.toThrow("HTTP 503");
  });

  it("fails when the dynamic resource metadata has no latest URL", async () => {
    const fetchMock = vi.fn(async () => Response.json({ extras: {} }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getDynamicCsvUrl()).rejects.toThrow("missing latest URL");
  });
});
