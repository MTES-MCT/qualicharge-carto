import { describe, expect, it } from "vitest";

import { getTariffRestrictionTexts, tariffElementMatchesConsultation } from "./restrictions";

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
});
