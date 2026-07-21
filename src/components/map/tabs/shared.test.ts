import { describe, expect, it } from "vitest";

import { getChargingPricingStatus } from "./shared";

describe("charging pricing status", () => {
  it("reports paid charging when an applicable tariff exists despite a missing gratuit field", () => {
    expect(getChargingPricingStatus(null, 1)).toEqual({
      label: "Recharge payante",
      severity: "info",
    });
  });

  it("reports missing pricing only when neither gratuit nor a tariff is known", () => {
    expect(getChargingPricingStatus(null, 0)).toEqual({
      label: "Tarification non renseignée",
      severity: "new",
    });
  });
});
