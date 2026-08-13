import { afterEach, describe, expect, it } from "vitest";

import { getIRVEDataSource, getTariffSourceMode } from "./config";

const previousIRVESource = process.env.IRVE_DATA_SOURCE;
const previousTariffMode = process.env.TARIFF_SOURCE_MODE;

afterEach(() => {
  if (previousIRVESource == null) {
    delete process.env.IRVE_DATA_SOURCE;
  } else {
    process.env.IRVE_DATA_SOURCE = previousIRVESource;
  }

  if (previousTariffMode == null) {
    delete process.env.TARIFF_SOURCE_MODE;
  } else {
    process.env.TARIFF_SOURCE_MODE = previousTariffMode;
  }
});

describe("getIRVEDataSource", () => {
  it("defaults to opendata", () => {
    delete process.env.IRVE_DATA_SOURCE;

    expect(getIRVEDataSource()).toBe("opendata");
  });

  it.each(["opendata", "datagouv"] as const)("supports the %s source", (source) => {
    process.env.IRVE_DATA_SOURCE = source;

    expect(getIRVEDataSource()).toBe(source);
  });

  it("rejects unknown sources", () => {
    process.env.IRVE_DATA_SOURCE = "other";

    expect(() => getIRVEDataSource()).toThrow(
      'Invalid IRVE_DATA_SOURCE "other". Expected "opendata" or "datagouv".'
    );
  });
});

describe("getTariffSourceMode", () => {
  it("defaults to local parquet provider directories", () => {
    delete process.env.TARIFF_SOURCE_MODE;

    expect(getTariffSourceMode()).toBe("local-files");
  });

  it("can load the legacy consolidated parquet URL", () => {
    process.env.TARIFF_SOURCE_MODE = "consolidated";

    expect(getTariffSourceMode()).toBe("consolidated");
  });
});
