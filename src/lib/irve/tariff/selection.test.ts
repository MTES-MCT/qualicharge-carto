import { describe, expect, it } from "vitest";

import type { QualichargeEVSEPdc, QualichargeTariff } from "@/types/irve";

import { getFirstDisplayableTariffComponent, getStationMarkerPricing, hasDisplayableTariffComponent } from "./selection";

function tariff(
  elements: NonNullable<NonNullable<QualichargeTariff["parsed"]>["elements"]>,
  id = "tariff-1"
): QualichargeTariff {
  return {
    id,
    raw: "",
    id_pdc_itinerance: ["pdc-1"],
    parsed: {
      id,
      currency: "EUR",
      tax_included: "YES",
      elements,
    },
  };
}

function pdc(applicableTariff: QualichargeTariff, power = 120): QualichargeEVSEPdc {
  return {
    applicable_tariff: applicableTariff,
    puissance_nominale: power,
  } as QualichargeEVSEPdc;
}

describe("tariff selection", () => {
  it("selects energy before time or flat fee", () => {
    const selected = getFirstDisplayableTariffComponent(
      tariff([
        { price_components: [{ type: "TIME", price: 1 }] },
        { price_components: [{ type: "FLAT", price: 1 }] },
        { price_components: [{ type: "ENERGY", price: 0.49 }] },
      ]),
      { at: new Date("2026-05-14T10:30:00") }
    );

    expect(selected?.component.type).toBe("ENERGY");
  });

  it("ignores parking-only tariffs for marker display", () => {
    expect(
      hasDisplayableTariffComponent(
        tariff([{ price_components: [{ type: "PARKING_TIME", price: 1 }] }]),
        new Date("2026-05-14T10:30:00")
      )
    ).toBe(false);
  });

  it("falls back to time when energy restrictions do not match the consultation", () => {
    const selected = getFirstDisplayableTariffComponent(
      tariff([
        {
          restrictions: { day_of_week: ["MONDAY"] },
          price_components: [{ type: "ENERGY", price: 0.49 }],
        },
        { price_components: [{ type: "TIME", price: 1 }] },
      ]),
      { at: new Date("2026-05-14T10:30:00") }
    );

    expect(selected?.component.type).toBe("TIME");
  });

  it("applies beginning-of-charge restrictions for marker selection", () => {
    const selected = getFirstDisplayableTariffComponent(
      tariff([
        {
          restrictions: { max_duration: 10 },
          price_components: [{ type: "ENERGY", price: 0.49 }],
        },
        { price_components: [{ type: "TIME", price: 1 }] },
      ]),
      { at: new Date("2026-05-14T10:30:00") }
    );

    expect(selected?.component.type).toBe("TIME");
  });

  it("chooses an energy station price over a cheaper time tariff", () => {
    const summary = getStationMarkerPricing(
      [
        pdc(tariff([{ price_components: [{ type: "TIME", price: 0.01 }] }], "time-tariff")),
        pdc(tariff([{ price_components: [{ type: "ENERGY", price: 0.49 }] }], "energy-tariff")),
      ],
      new Date("2026-05-14T10:30:00")
    );

    expect(summary.dimension).toBe("ENERGY");
    expect(summary.headline).toBe("0,49 €/kWh");
    expect(summary.tariffId).toBe("energy-tariff");
  });

  it("keeps the first matching station price within the retained dimension", () => {
    const summary = getStationMarkerPricing(
      [
        pdc(tariff([{ price_components: [{ type: "ENERGY", price: 0.75 }] }])),
        pdc(tariff([{ price_components: [{ type: "ENERGY", price: 0.49 }] }])),
      ],
      new Date("2026-05-14T10:30:00")
    );

    expect(summary.dimension).toBe("ENERGY");
    expect(summary.headline).toBe("0,75 €/kWh");
  });
});
