import { describe, expect, it } from "vitest";

import { summarizeRecentDynamicPdcs } from "./dynamic-status";
import { EtatPDCEnum, OccupationPDCEnum, type QualichargeEVSEPdc } from "@/types/irve";

const NOW = new Date("2026-07-05T12:00:00.000Z");

function pdc(horodatage: string, occupation_pdc: OccupationPDCEnum): QualichargeEVSEPdc {
  return {
    dynamic: {
      horodatage,
      etat_pdc: EtatPDCEnum.EN_SERVICE,
      occupation_pdc,
    },
  } as QualichargeEVSEPdc;
}

describe("summarizeRecentDynamicPdcs", () => {
  it("excludes stale statuses and exposes unknown occupations", () => {
    const summary = summarizeRecentDynamicPdcs(
      [
        pdc("2026-07-05T11:00:00.000Z", OccupationPDCEnum.LIBRE),
        pdc("2026-07-04T11:00:00.000Z", OccupationPDCEnum.INCONNU),
        pdc("2026-03-04T11:00:00.000Z", OccupationPDCEnum.OCCUPE),
      ],
      NOW
    );

    expect(summary).toMatchObject({
      pdcsWithDynamicCount: 2,
      enServiceCount: 2,
      libreCount: 1,
      occupiedCount: 0,
      reservedCount: 0,
      unknownOccupationCount: 1,
      availableCount: 1,
    });
    expect(summary.latestDynamic?.horodatage).toBe("2026-07-05T11:00:00.000Z");
  });
});
