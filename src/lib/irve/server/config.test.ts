import { afterEach, describe, expect, it } from "vitest";

import { getTariffSourceMode } from "./config";

describe("getTariffSourceMode", () => {
  const previousMode = process.env.TARIFF_SOURCE_MODE;

  afterEach(() => {
    if (previousMode == null) {
      delete process.env.TARIFF_SOURCE_MODE;
    } else {
      process.env.TARIFF_SOURCE_MODE = previousMode;
    }
  });

  it("defaults to local parquet provider directories", () => {
    delete process.env.TARIFF_SOURCE_MODE;

    expect(getTariffSourceMode()).toBe("local-files");
  });

  it("can load the legacy consolidated parquet URL", () => {
    process.env.TARIFF_SOURCE_MODE = "consolidated";

    expect(getTariffSourceMode()).toBe("consolidated");
  });
});
