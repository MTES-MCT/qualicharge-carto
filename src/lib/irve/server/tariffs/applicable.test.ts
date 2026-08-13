import { describe, expect, it } from "vitest";

import type { IndexedTariff } from "./types";
import { selectApplicableTariffs } from "./applicable";

function tariff(id: string, raw: string): IndexedTariff {
  return {
    id,
    original_last_updated: "2026-03-26T02:50:57Z",
    raw,
    parsed: null,
    start: "2026-03-26T02:50:57Z",
    end: null,
    id_pdc_itinerance: ["NL*TSL*E001"],
  };
}

describe("selectApplicableTariffs", () => {
  it("uses stable tariff data rather than row order to break version ties", () => {
    const first = tariff("tariff-a", "a");
    const second = tariff("tariff-b", "b");
    const at = new Date("2026-03-27T00:00:00Z");

    expect(selectApplicableTariffs([first, second], at).get("NL*TSL*E001")?.id).toBe("tariff-b");
    expect(selectApplicableTariffs([second, first], at).get("NL*TSL*E001")?.id).toBe("tariff-b");
  });
});
