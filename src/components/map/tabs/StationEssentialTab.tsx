import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { ButtonsGroup } from "@codegouvfr/react-dsfr/ButtonsGroup";
import { Card } from "@codegouvfr/react-dsfr/Card";
import { Tag } from "@codegouvfr/react-dsfr/Tag";

import { ScheduleTable } from "@/components/irve/ScheduleTable";
import {
  formatDateTime,
  formatRelativeDateTime,
  getAccessSeverity,
  getAvailabilityTone,
  getPmrLabel,
  getPowerSeverity,
  getStationDynamicSummary,
  getStationTypeLabel,
} from "@/lib/irve/formatters";
import type { EssentialTabProps } from "./shared";

export function StationEssentialTab({ station, copiedKey, copy }: EssentialTabProps) {
  const dynamicSummary = getStationDynamicSummary(station);
  const relativeLastUpdate = formatRelativeDateTime(dynamicSummary.latestDynamic?.horodatage);

  return (
    <div className="irve-sidepanel__tab-stack">
      <Card
        title="Vue d'ensemble"
        end={
          <div className="irve-sidepanel__hero">
            <ul className="fr-badges-group">
              <li>
                <Badge noIcon severity={getPowerSeverity(station.summary.max_power)}>
                  {station.summary.max_power} kW maximum
                </Badge>
              </li>
              <li>
                <Badge noIcon severity="new">{station.pdcs.length} PDC</Badge>
              </li>
              <li>
                <Badge noIcon severity={getAccessSeverity(station.condition_acces)}>
                  {station.condition_acces}
                </Badge>
              </li>
            </ul>

            <div className="irve-sidepanel__tags">
              <Tag small iconId="fr-icon-map-pin-2-line">{getStationTypeLabel(station.implantation_station)}</Tag>
              <Tag small iconId="fr-icon-time-line">{station.horaires || "Horaires non renseignés"}</Tag>
              <Tag small iconId="fr-icon-wheelchair-line">{getPmrLabel(station.accessibilite_pmr)}</Tag>
              {/* <Tag small iconId="fr-icon-battery-charge-line">{station.summary.total_power} kW cumulés</Tag> */}
              {station.station_deux_roues ? <Tag small iconId="fr-icon-bike-line">Compatible deux-roues</Tag> : null}
            </div>

            <ButtonsGroup
              inlineLayoutWhen="always"
              alignment="left"
              buttonsSize="small"
              buttons={[
                {
                  children: copiedKey === "address_station" ? "Adresse copiée" : "Copier l'adresse",
                  priority: "secondary",
                  iconId: copiedKey === "address_station" ? "fr-icon-check-line" : "fr-icon-clipboard-line",
                  onClick: () => copy("address_station", station.adresse_station),
                },
                {
                  children: copiedKey === "coordonneesXY" ? "Coordonnées copiées" : "Copier coordonnées",
                  priority: "tertiary",
                  iconId: copiedKey === "coordonneesXY" ? "fr-icon-check-line" : "fr-icon-clipboard-line",
                  onClick: () => copy("coordonneesXY", station.coordonneesXY),
                },
              ]}
            />
          </div>
        }
        border
      />

      <Card
        title="Disponibilité en temps réel"
        end={
          <div className="irve-sidepanel__dynamic-grid">
            <div>
              <p className="irve-sidepanel__label">État de la station</p>
              <div className="irve-sidepanel__tags irve-sidepanel__tags--compact">
                <Badge noIcon severity={dynamicSummary.enServiceCount > 0 ? "success" : dynamicSummary.pdcsWithDynamicCount > 0 ? "warning" : "new"}>
                  {dynamicSummary.enServiceCount}/{station.pdcs.length} en service
                </Badge>
                <Badge noIcon severity={dynamicSummary.libreCount > 0 ? "success" : dynamicSummary.pdcsWithDynamicCount > 0 ? "info" : "new"}>
                  {dynamicSummary.libreCount} libre{dynamicSummary.libreCount > 1 ? "s" : ""}
                </Badge>
                {dynamicSummary.occupiedCount > 0 ? <Badge noIcon severity="warning">{dynamicSummary.occupiedCount} occupé{dynamicSummary.occupiedCount > 1 ? "s" : ""}</Badge> : null}
                {dynamicSummary.reservedCount > 0 ? <Badge noIcon severity="info">{dynamicSummary.reservedCount} réservé{dynamicSummary.reservedCount > 1 ? "s" : ""}</Badge> : null}
              </div>
            </div>

            <div>
              <p className="irve-sidepanel__label">Dernière remontée</p>
              <p className={dynamicSummary.latestDynamic?.horodatage ? "irve-sidepanel__value" : "irve-sidepanel__missing"}>
                {formatDateTime(dynamicSummary.latestDynamic?.horodatage)}
              </p>
              {relativeLastUpdate ? (
                <p className="irve-sidepanel__hint">{relativeLastUpdate}</p>
              ) : null}
            </div>

            <div>
              <p className="irve-sidepanel__label">Fiabilité de la donnée</p>
              <Badge noIcon severity={getAvailabilityTone(dynamicSummary.latestDynamic?.etat_pdc)}>
                {dynamicSummary.pdcsWithDynamicCount > 0
                  ? `${dynamicSummary.pdcsWithDynamicCount}/${station.pdcs.length} PDC avec données dynamiques`
                  : "Données dynamiques absentes"}
              </Badge>
              {dynamicSummary.pdcsWithDynamicCount === 0 ? (
                <p className="irve-sidepanel__missing irve-sidepanel__missing--spaced">
                  Cette station n&apos;a pas de remontée dynamique exploitable dans le jeu de données actuel.
                </p>
              ) : null}
            </div>
          </div>
        }
        border
      />

      <Card
        title="Horaires"
        end={
          <div className="irve-sidepanel__schedule-block">
            <ScheduleTable horaires={station.horaires} />
          </div>
        }
        border
      />
    </div>
  );
}
