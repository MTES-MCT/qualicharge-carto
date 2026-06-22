import { describe, expect, it } from "vitest";

import type { QualichargeTariff } from "@/types/irve";

import { getTariffDimensionGroups } from "./presentation";

describe("tariff presentation", () => {
  it("keeps restrictions when equal prices describe different tariff cases", () => {
    const tariff: QualichargeTariff = {
      id: "tariff-1",
      raw: "",
      id_pdc_itinerance: ["pdc-1"],
      parsed: {
        id: "tariff-1",
        currency: "EUR",
        tax_included: "YES",
        elements: [
          { price_components: [{ type: "ENERGY", price: 0.39 }] },
          {
            restrictions: { min_duration: 15 * 60 },
            price_components: [{ type: "PARKING_TIME", price: 12 }],
          },
        ],
      },
    };

    const groups = getTariffDimensionGroups(tariff);

    expect(groups).toMatchObject([
      {
        type: "ENERGY",
        lines: [{ amount: "0,39 €/kWh", restrictions: [] }],
      },
      {
        type: "PARKING_TIME",
        lines: [{ amount: "12 €/h", restrictions: ["si la durée est supérieure à 15 min"] }],
      },
    ]);
  });

  it("does not collapse equal prices with different restrictions", () => {
    const tariff: QualichargeTariff = {
      id: "tariff-1",
      raw: "",
      id_pdc_itinerance: ["pdc-1"],
      parsed: {
        id: "tariff-1",
        currency: "EUR",
        tax_included: "YES",
        elements: [
          {
            restrictions: { min_duration: 15 * 60 },
            price_components: [{ type: "PARKING_TIME", price: 12 }],
          },
          {
            restrictions: { min_duration: 30 * 60 },
            price_components: [{ type: "PARKING_TIME", price: 12 }],
          },
        ],
      },
    };

    const [parkingGroup] = getTariffDimensionGroups(tariff);

    expect(parkingGroup.lines).toEqual([
      { amount: "12 €/h", restrictions: ["si la durée est supérieure à 15 min"] },
      { amount: "12 €/h", restrictions: ["si la durée est supérieure à 30 min"] },
    ]);
  });

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

  it("ignores non-positive and missing price components", () => {
    const tariff: QualichargeTariff = {
      id: "tariff-1",
      raw: "",
      id_pdc_itinerance: ["pdc-1"],
      parsed: {
        id: "tariff-1",
        currency: "EUR",
        tax_included: "YES",
        elements: [
          {
            price_components: [
              { type: "ENERGY", price: 0 },
              { type: "ENERGY", price: null },
              { type: "ENERGY", price: -0.1 },
              { type: "ENERGY", price: 0.49 },
            ],
          },
        ],
      },
    };

    const [energyGroup] = getTariffDimensionGroups(tariff);

    expect(energyGroup.lines.map((line) => line.amount)).toEqual(["0,49 €/kWh"]);
  });
});
