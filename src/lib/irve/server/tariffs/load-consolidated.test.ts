import { beforeEach, describe, expect, it, vi } from "vitest";

import { readParquetRows, readRemoteParquetBuffer } from "../parquet";
import { loadConsolidatedTariffs } from "./load-consolidated";

vi.mock("../parquet", () => ({
  readParquetRows: vi.fn(),
  readRemoteParquetBuffer: vi.fn(),
}));

const raw = {
  country_code: "NL",
  party_id: "TSL",
  id: "c451ff5b-f217-47f2-9194-87df23a7e975",
  last_updated: "2026-03-26T02:50:57Z",
};

describe("loadConsolidatedTariffs", () => {
  beforeEach(() => {
    vi.mocked(readRemoteParquetBuffer).mockReturnValue({} as never);
    vi.mocked(readParquetRows).mockReset();
  });

  it("derives tariff identity from the OCPI raw payload", async () => {
    vi.mocked(readParquetRows).mockResolvedValue([{
      raw: JSON.stringify(raw),
      start: "2026-03-26T02:50:57Z",
      end: null,
      id_pdc_itinerance: '["NL*TSL*E001"]',
    }]);

    await expect(loadConsolidatedTariffs("https://opendata.example/d/tariffs.parquet")).resolves.toEqual([{
      id: "NLTSLc451ff5b-f217-47f2-9194-87df23a7e975::2026-03-26T02:50:57.000Z",
      original_id: "NLTSLc451ff5b-f217-47f2-9194-87df23a7e975",
      original_last_updated: "2026-03-26T02:50:57.000Z",
      raw: JSON.stringify(raw),
      parsed: raw,
      start: "2026-03-26T02:50:57.000Z",
      end: null,
      id_pdc_itinerance: ["NL*TSL*E001"],
    }]);
  });

  it("ignores rows without a complete OCPI identity", async () => {
    vi.mocked(readParquetRows).mockResolvedValue([{
      raw: JSON.stringify({ ...raw, party_id: undefined }),
      id_pdc_itinerance: "[]",
    }]);

    await expect(loadConsolidatedTariffs("https://opendata.example/d/tariffs.parquet")).resolves.toEqual([]);
  });
});
