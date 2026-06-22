"use client";

import { createModal } from "@codegouvfr/react-dsfr/Modal";

import { MIN_DISPLAYED_POWER_KW } from "@/lib/irve/server/config";

export const launchInfoModal = createModal({
  id: "launch-info-modal",
  isOpenedByDefault: true,
});

export function LaunchInfoModal() {
  return (
    <launchInfoModal.Component
      title="Points de recharge affichés"
      iconId="fr-icon-information-line"
      buttons={[
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
         Il s'agit d'une première version en cours d'enrichissement. Les données présentées sont progressivement complétées et mises à jour.<br />
         Les points de recharge lente ne sont pas affichés. 

      </p>
    </launchInfoModal.Component>
  );
}
