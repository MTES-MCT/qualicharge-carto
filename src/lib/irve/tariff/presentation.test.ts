import { describe, expect, it } from "vitest";

import type { QualichargeTariff } from "@/types/irve";

import { getTariffDimensionGroups } from "./presentation";

describe("tariff presentation", () => {
  it("sorts default lines after restricted lines", () => {
    const tariff: QualichargeTariff = {
      id: "tariff-1",
      raw: "",
      id_pdc_itinerance: ["pdc-1"],
      parsed: {
        id: "tariff-1",
        currency: "EUR",
        tax_included: "YES",
        elements: [
          { price_components: [{ type: "ENERGY", price: 0.49 }] },
          {
            restrictions: { day_of_week: ["THURSDAY"] },
            price_components: [{ type: "ENERGY", price: 0.75 }],
          },
        ],
      },
    };

    const [energyGroup] = getTariffDimensionGroups(tariff);

    expect(energyGroup.lines.map((line) => line.amount)).toEqual(["0,75 €/kWh", "0,49 €/kWh"]);
  });
});
