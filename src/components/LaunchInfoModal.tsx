"use client";

import { useEffect } from "react";
import { createModal } from "@codegouvfr/react-dsfr/Modal";

import { MIN_DISPLAYED_POWER_KW } from "@/lib/irve/server/config";
import { dismissModal, isModalDismissed, MODAL_DISMISSAL_KEYS } from "@/lib/modal-preferences";

export const launchInfoModal = createModal({
  id: "launch-info-modal",
  isOpenedByDefault: false,
});

export function LaunchInfoModal() {
  useEffect(() => {
    if (isModalDismissed(MODAL_DISMISSAL_KEYS.launchInfo)) {
      return;
    }

    const timeout = window.setTimeout(() => launchInfoModal.open(), 0);

    return () => window.clearTimeout(timeout);
  }, []);

  return (
    <launchInfoModal.Component
      title="Points de recharge affichés"
      iconId="fr-icon-information-line"
      buttons={[
        {
          priority: "secondary",
          onClick: () => dismissModal(MODAL_DISMISSAL_KEYS.launchInfo),
          children: "Ne plus afficher",
        },
        {
          iconId: "ri-check-line",
          children: "Ok",
        },
      ]}
    >
      <p>
        Cette cartographie présente les points de recharge de puissance supérieure à{" "}
        {MIN_DISPLAYED_POWER_KW} kW, c&apos;est à dire ceux permettant une recharge rapide
        (plus de 100 km d&apos;autonomie récupérée en vingt minutes). <br />
        Il s&apos;agit d&apos;une première version en cours d&apos;enrichissement. Les données
        présentées sont progressivement complétées et mises à jour.
        <br />
        Les points de recharge lente ne sont pas affichés.
      </p>
    </launchInfoModal.Component>
  );
}
