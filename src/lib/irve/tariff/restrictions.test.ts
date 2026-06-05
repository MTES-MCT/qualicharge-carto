import { describe, expect, it } from "vitest";

import { getTariffCurrentPriceParams, getTariffRestrictionTexts, tariffElementMatchesConsultation } from "./restrictions";

describe("tariff restrictions", () => {
  it("matches consultation day, time, date, and max power restrictions", () => {
    expect(
      tariffElementMatchesConsultation(
        {
          restrictions: {
            day_of_week: ["THURSDAY"],
            start_date: "2026-05-01",
            end_date: "2026-05-31",
            start_time: "10:00:00Z",
            end_time: "12:00:00Z",
            max_power: 150,
          },
        },
        { at: new Date("2026-05-14T10:30:00"), power: 120 }
      )
    ).toBe(true);
  });

  it("formats plural day names and numeric restrictions", () => {
    expect(
      getTariffRestrictionTexts({
        day_of_week: ["MONDAY", "THURSDAY"],
        end_time: "05:15:00Z",
        max_power: 112.1,
      })
    ).toEqual(["les Lundis, Jeudis", "jusqu’à 05:15", "puissance inférieure à 112,1 kW"]);
  });

  it("uses environment overrides for marker session duration and energy", () => {
    const previousDuration = process.env.TARIFF_MARKER_SESSION_DURATION_MINUTES;
    const previousKwh = process.env.TARIFF_MARKER_SESSION_KWH;

    process.env.TARIFF_MARKER_SESSION_DURATION_MINUTES = "45";
    process.env.TARIFF_MARKER_SESSION_KWH = "12.5";

    try {
      const params = getTariffCurrentPriceParams(new Date("2026-05-14T10:30:00"), 120);

      expect(params.paramSession.duration).toBe(45);
      expect(params.paramSession.kwh).toBe(12.5);
    } finally {
      if (previousDuration == null) {
        delete process.env.TARIFF_MARKER_SESSION_DURATION_MINUTES;
      } else {
        process.env.TARIFF_MARKER_SESSION_DURATION_MINUTES = previousDuration;
      }

      if (previousKwh == null) {
        delete process.env.TARIFF_MARKER_SESSION_KWH;
      } else {
        process.env.TARIFF_MARKER_SESSION_KWH = previousKwh;
      }
    }
  });
});
