import { describe, expect, it } from "vitest";

import { toStaticRow } from "./static-row";

describe("toStaticRow", () => {
  it("normalizes a statiques CSV record", () => {
    const row = toStaticRow({
      coordonneesXY: "[2.974629, 50.410222]",
      id_pdc_itinerance: "FRTEST123",
      paiement_acte: "true",
      paiement_cb: "",
      puissance_nominale: "150.5",
      reservation: "false",
    });

    expect(row.coordonneesXY).toBe("[2.974629, 50.410222]");
    expect(row.id_pdc_itinerance).toBe("FRTEST123");
    expect(row.paiement_acte).toBe(true);
    expect(row.paiement_cb).toBeNull();
    expect(row.puissance_nominale).toBe(150.5);
    expect(row.reservation).toBe(false);
  });
});
