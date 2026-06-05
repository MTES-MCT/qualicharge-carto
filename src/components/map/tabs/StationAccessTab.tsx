import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Card } from "@codegouvfr/react-dsfr/Card";
import { Tag } from "@codegouvfr/react-dsfr/Tag";

import { getAccessSeverity } from "@/lib/irve/formatters";
import type { AccessTabProps } from "./shared";

export function StationAccessTab({ station, paymentTags }: AccessTabProps) {
  return (
    <div className="irve-sidepanel__tab-stack">
      <Card
        title="Paiement et services"
        end={
          <div className="irve-sidepanel__tag-columns">
            <div>
              <p className="irve-sidepanel__label">Paiement</p>
              <div className="irve-sidepanel__tags irve-sidepanel__tags--compact">
                {paymentTags.length > 0 ? (
                  paymentTags.map((label) => <Tag key={label} small iconId="fr-icon-bank-card-line">{label}</Tag>)
                ) : (
                  <p className="irve-sidepanel__missing">Aucune modalité de paiement détaillée.</p>
                )}
              </div>
            </div>

            <div>
              <p className="irve-sidepanel__label">Accès utilisateur</p>
              <div className="irve-sidepanel__tags irve-sidepanel__tags--compact">
                <Badge severity={getAccessSeverity(station.condition_acces)}>{station.condition_acces}</Badge>
                <Badge severity={station.reservation ? "info" : "new"}>
                  {station.reservation ? "Réservation disponible" : "Sans réservation"}
                </Badge>
                <Badge severity={station.gratuit === true ? "success" : station.gratuit === false ? "info" : "new"}>
                  {station.gratuit === true
                    ? "Recharge gratuite"
                    : station.gratuit === false
                      ? "Recharge payante"
                      : "Tarification non renseignée"}
                </Badge>
              </div>
            </div>
          </div>
        }
        border
      />
    </div>
  );
}
