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
        Nous n&apos;affichons que les tarifs des opérateurs qui les transmettent à la Direction générale de l&apos;énergie et du climat. Ces tarifs peuvent avoir plusieurs composantes (énergie, forfait, frais d&apos;occupation post recharge, etc...) accessibles en cliquant sur la station. Les tarifs affichés sont ceux qui s&apos;appliquent lors d&apos;un paiement direct en station, ils peuvent varier en cas de souscription à un abonnement.
      </p>
    </pricingModal.Component>
  );
}
