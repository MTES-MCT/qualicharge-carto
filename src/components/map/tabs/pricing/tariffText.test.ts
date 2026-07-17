import { describe, expect, it } from "vitest";

import type { QualichargeEVSEConsolidated, QualichargeEVSEPdc, QualichargeTariff } from "@/types/irve";

import {
  formatPdcPower,
  getTariffCardTitle,
  getUniqueApplicableTariffEntries,
  shouldShowTariffPdcScope,
} from "./tariffText";

function tariff(id: string): QualichargeTariff {
  return {
    id,
    raw: "",
    parsed: null,
    id_pdc_itinerance: [],
  };
}

function pdc(id: string, power: number, applicableTariff?: QualichargeTariff): QualichargeEVSEPdc {
  return {
    id_pdc_itinerance: id,
    puissance_nominale: power,
    applicable_tariff: applicableTariff,
  } as QualichargeEVSEPdc;
}

function station(pdcs: QualichargeEVSEPdc[]): QualichargeEVSEConsolidated {
  return { pdcs } as QualichargeEVSEConsolidated;
}

describe("station tariff context", () => {
  it("groups the points of charge that share a tariff", () => {
    const sharedTariff = tariff("shared");
    const entries = getUniqueApplicableTariffEntries(station([
      pdc("PDC-50-A", 50, sharedTariff),
      pdc("PDC-50-B", 50, sharedTariff),
      pdc("PDC-OLD", 100),
    ]));

    expect(entries).toEqual([
      {
        tariff: sharedTariff,
        pdcs: [
          { id: "PDC-50-A", power: 50 },
          { id: "PDC-50-B", power: 50 },
        ],
      },
    ]);
    expect(getTariffCardTitle(entries[0], entries.length)).toBe("Tarif 50 kW");
    expect(shouldShowTariffPdcScope(entries[0], entries.length)).toBe(true);
  });

  it("keeps distinct tariff scopes for points with different powers", () => {
    const entries = getUniqueApplicableTariffEntries(station([
      pdc("PDC-50", 50, tariff("tariff-55")),
      pdc("PDC-175", 175, tariff("tariff-65")),
    ]));

    expect(entries.map((entry) => getTariffCardTitle(entry, entries.length))).toEqual([
      "Tarif 50 kW",
      "Tarif 175 kW",
    ]);
  });

  it("formats decimal powers using the French locale", () => {
    expect(formatPdcPower(22.5)).toBe("22,5 kW");
  });

  it("shows all powers when one tariff covers different points of charge", () => {
    const sharedTariff = tariff("FRLDLTARIFF_LIDL_PLUS_DC");
    const entries = getUniqueApplicableTariffEntries(station([
      pdc("FRLDLE00004403", 300, sharedTariff),
      pdc("FRLDLE00004404", 120, sharedTariff),
    ]));

    expect(getTariffCardTitle(entries[0], entries.length)).toBe("Tarif");
    expect(entries[0].pdcs).toEqual([
      { id: "FRLDLE00004403", power: 300 },
      { id: "FRLDLE00004404", power: 120 },
    ]);
    expect(shouldShowTariffPdcScope(entries[0], entries.length)).toBe(true);
  });
});
