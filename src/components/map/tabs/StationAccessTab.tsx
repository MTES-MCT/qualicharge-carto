import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Card } from "@codegouvfr/react-dsfr/Card";
import { Tag } from "@codegouvfr/react-dsfr/Tag";

import { getAccessSeverity } from "@/lib/irve/formatters";
import { getChargingPricingStatus, type AccessTabProps } from "./shared";

export function StationAccessTab({ station, paymentTags }: AccessTabProps) {
  const pricingStatus = getChargingPricingStatus(station.gratuit, station.summary.applicable_tariff_count);

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
                <Badge noIcon severity={getAccessSeverity(station.condition_acces)}>{station.condition_acces}</Badge>
                <Badge noIcon severity={station.reservation ? "info" : "new"}>
                  {station.reservation ? "Réservation disponible" : "Sans réservation"}
                </Badge>
                <Badge noIcon severity={pricingStatus.severity}>
                  {pricingStatus.label}
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
