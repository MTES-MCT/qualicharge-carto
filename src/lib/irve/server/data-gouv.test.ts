import { afterEach, describe, expect, it, vi } from "vitest";

import { getDynamicParquetUrl, getStaticParquetUrl } from "./data-gouv";

describe("data.gouv.fr parquet URL resolution", () => {
  const previousStaticUrl = process.env.STATIC_PARQUET_URL;
  const previousDynamicUrl = process.env.DYNAMIC_PARQUET_URL;

  afterEach(() => {
    vi.unstubAllGlobals();

    if (previousStaticUrl == null) {
      delete process.env.STATIC_PARQUET_URL;
    } else {
      process.env.STATIC_PARQUET_URL = previousStaticUrl;
    }

    if (previousDynamicUrl == null) {
      delete process.env.DYNAMIC_PARQUET_URL;
    } else {
      process.env.DYNAMIC_PARQUET_URL = previousDynamicUrl;
    }
  });

  it("reads the current parquet URL from resource metadata", async () => {
    delete process.env.STATIC_PARQUET_URL;
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

  it("keeps explicit environment overrides first", async () => {
    process.env.DYNAMIC_PARQUET_URL = "https://example.com/dynamic.parquet";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(getDynamicParquetUrl()).resolves.toBe("https://example.com/dynamic.parquet");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
