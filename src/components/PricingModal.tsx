"use client";

import { createModal } from "@codegouvfr/react-dsfr/Modal";

import { dismissModal, MODAL_DISMISSAL_KEYS } from "@/lib/modal-preferences";

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
          priority: "secondary",
          onClick: () => dismissModal(MODAL_DISMISSAL_KEYS.pricing),
          children: "Ne plus afficher",
        },
        {
          iconId: "ri-check-line",
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
