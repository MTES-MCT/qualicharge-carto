import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { openDataSourceLoader } from "./opendata";

const ENVIRONMENT_VARIABLES = [
  "OPENDATA_BASE_URL",
  "OPENDATA_PASSWORD",
  "OPENDATA_USERNAME",
] as const;
const previousEnvironment = Object.fromEntries(
  ENVIRONMENT_VARIABLES.map((name) => [name, process.env[name]])
);

async function readRows(rows: AsyncIterable<Record<string, unknown>>) {
  const records = [];

  for await (const record of rows) {
    records.push(record);
  }

  return records;
}

describe("opendata source loader", () => {
  beforeEach(() => {
    process.env.OPENDATA_BASE_URL = "https://opendata.example/service";
    process.env.OPENDATA_USERNAME = "map-user";
    process.env.OPENDATA_PASSWORD = "sëcret";
  });

  afterEach(() => {
    vi.unstubAllGlobals();

    for (const name of ENVIRONMENT_VARIABLES) {
      const previousValue = previousEnvironment[name];
      if (previousValue == null) {
        delete process.env[name];
      } else {
        process.env[name] = previousValue;
      }
    }
  });

  it("streams statuses with HTTP Basic authentication", async () => {
    const fetchMock = vi.fn(async () => new Response("id,label\n1,Available\n"));
    vi.stubGlobal("fetch", fetchMock);

    await expect(readRows(openDataSourceLoader.streamDynamicRows())).resolves.toEqual([
      { id: "1", label: "Available" },
    ]);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://opendata.example/service/d/statuses.csv",
      {
        cache: "no-store",
        headers: {
          Accept: "text/csv",
          Authorization: `Basic ${Buffer.from("map-user:sëcret", "utf8").toString("base64")}`,
        },
      }
    );
  });

  it("streams statiques and normalizes a trailing slash on the base URL", async () => {
    process.env.OPENDATA_BASE_URL = "https://opendata.example/";
    const fetchMock = vi.fn(async () => new Response("id\n1\n"));
    vi.stubGlobal("fetch", fetchMock);

    await readRows(openDataSourceLoader.streamStaticRows());

    expect(fetchMock).toHaveBeenCalledWith(
      "https://opendata.example/d/statiques.csv",
      expect.any(Object)
    );
  });

  it.each(ENVIRONMENT_VARIABLES)("fails when %s is missing", async (name) => {
    delete process.env[name];
    vi.stubGlobal("fetch", vi.fn());

    await expect(readRows(openDataSourceLoader.streamDynamicRows())).rejects.toThrow(
      `Missing required environment variable ${name}`
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects a non-HTTP base URL", async () => {
    process.env.OPENDATA_BASE_URL = "file:///tmp/opendata";
    vi.stubGlobal("fetch", vi.fn());

    await expect(readRows(openDataSourceLoader.streamDynamicRows())).rejects.toThrow(
      "expected an HTTP(S) URL"
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it("fails when opendata returns an error", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 503 })));

    await expect(readRows(openDataSourceLoader.streamDynamicRows())).rejects.toThrow(
      "Unable to fetch opendata statuses CSV: HTTP 503"
    );
  });

  it("fails when opendata returns no response body", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null)));

    await expect(readRows(openDataSourceLoader.streamStaticRows())).rejects.toThrow(
      "Unable to fetch opendata statiques CSV: missing response body"
    );
  });
});
