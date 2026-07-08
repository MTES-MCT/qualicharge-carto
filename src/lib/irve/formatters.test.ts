import { describe, expect, it } from "vitest";

import { getDisplayedConnectorState } from "./formatters";
import { EtatPDCEnum, EtatPriseEnum } from "@/types/irve";

describe("getDisplayedConnectorState", () => {
  it("prioritizes the connector-specific status", () => {
    expect(
      getDisplayedConnectorState(EtatPriseEnum.FONCTIONNEL, EtatPDCEnum.HORS_SERVICE)
    ).toEqual({ label: "Fonctionnelle", severity: "success" });
  });

  it("falls back to the PDC status", () => {
    expect(getDisplayedConnectorState(undefined, EtatPDCEnum.EN_SERVICE)).toEqual({
      label: "PDC en service",
      severity: "success",
    });
  });

  it("reports missing dynamic data only when both statuses are absent", () => {
    expect(getDisplayedConnectorState()).toEqual({
      label: "Donnée dynamique manquante",
      severity: "new",
    });
  });
});
