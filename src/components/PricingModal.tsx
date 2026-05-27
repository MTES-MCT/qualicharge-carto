"use client";

import { createModal } from "@codegouvfr/react-dsfr/Modal";

export const pricingModal = createModal({
  id: "pricing-modal",
  isOpenedByDefault: false,
});

export function PricingModal() {
  return (
    <pricingModal.Component
      title="Tarification"
      iconId="fr-icon-money-euro-circle-line"
      buttons={[
        {
          iconId: "ri-check-line",
          onClick: () => console.log("pricing modal acknowledged"),
          children: "Ok",
        },
      ]}
    >
      <p>
        Nous n&apos;affichons que les tarifs des opérateurs qui transmettent leurs tarifs.
      </p>
    </pricingModal.Component>
  );
}
