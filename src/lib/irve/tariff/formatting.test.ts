import { describe, expect, it } from "vitest";

import { formatTariffComponent } from "./formatting";

describe("tariff formatting", () => {
  it("rounds displayed prices to cents", () => {
    expect(formatTariffComponent({ type: "ENERGY", price: 6.9887 }, "EUR", "YES")).toBe("6,99 €/kWh");
  });

  it("converts VAT-excluded prices before display", () => {
    expect(formatTariffComponent({ type: "TIME", price: 4, vat: 20 }, "EUR", "NO")).toBe("4,80 €/h");
  });
});
