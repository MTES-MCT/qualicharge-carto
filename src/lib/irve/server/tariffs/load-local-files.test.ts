import { describe, expect, it } from "vitest";

import { loadLocalTariffFiles } from "./load-local-files";

describe("loadLocalTariffFiles", () => {
  it("loads tariff and PDC parquet pairs from provider directories", async () => {
    const tariffs = await loadLocalTariffFiles("data/tariffs");

    expect(tariffs.length).toBeGreaterThan(0);
    expect(tariffs.some((tariff) => tariff.id.includes("::"))).toBe(true);
    expect(tariffs.filter((tariff) => tariff.id_pdc_itinerance.length > 0).length).toBeGreaterThan(0);
  });
});
