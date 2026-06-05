import { Accordion } from "@codegouvfr/react-dsfr/Accordion";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Card } from "@codegouvfr/react-dsfr/Card";
import { Notice } from "@codegouvfr/react-dsfr/Notice";

import {
  getBestStationTariff,
  getTariffComponentLabel,
  getTariffDimensionGroups,
  getTariffSummary,
} from "@/lib/irve/tariffs";
import type { IRVEMapStationSummary } from "@/types/irve-runtime";
import type { StationDetailsTabProps } from "./shared";
import {
  getHighlightedTariffTextParts,
  getTariffDisplayId,
  getTariffLineViewModel,
  getTariffValidityText,
  getTariffVersionDate,
  getUniqueApplicableTariffEntries,
  sortTariffEntries,
} from "./pricing/tariffText";

function renderHighlightedText(text: string) {
  return getHighlightedTariffTextParts(text).map((part, partIndex) =>
    part.kind === "text" ? (
      part.value
    ) : (
      <strong key={`${part.value}-${partIndex}`}>{part.value}</strong>
    )
  );
}

interface StationPricingTabProps extends StationDetailsTabProps {
  mapPricingSummary?: IRVEMapStationSummary | null;
}

export function StationPricingTab({ station, mapPricingSummary }: StationPricingTabProps) {
  const consultationDate = new Date();
  const applicableTariffs = getUniqueApplicableTariffEntries(station);
  const bestTariff = getBestStationTariff(applicableTariffs.map((entry) => entry.tariff), consultationDate);
  const bestSummary = getTariffSummary(bestTariff, consultationDate);
  const mapSummary = mapPricingSummary ?? station.summary;
  const markerTariff = applicableTariffs.find((entry) => entry.tariff.id === mapSummary.pricing_tariff_id)?.tariff ?? null;
  const markerDimensionLabel = getTariffComponentLabel(mapSummary.pricing_dimension);
  const sortedTariffs = sortTariffEntries(applicableTariffs, markerTariff ?? bestTariff);

  return (
    <div className="irve-sidepanel__tab-stack">
      {sortedTariffs.length === 0 ? (
        <Notice
          severity="info"
          title="Aucun tarif applicable"
          description="Aucun tarif courant n’est associé aux points de charge de cette station."
        />
      ) : null}

      {sortedTariffs.map(({ tariff }) => {
        const validityText = getTariffValidityText(tariff);
        const dimensionGroups = getTariffDimensionGroups(tariff);

        return (
          <Card
            key={tariff.id}
            title={`Tarif : "${getTariffDisplayId(tariff)}"${getTariffVersionDate(tariff) ? ` version du ${getTariffVersionDate(tariff)}` : ""}`}
            desc={
              <div className="irve-tariff-reader">
                {validityText ? (
                  <p className="irve-tariff-reader__validity">{renderHighlightedText(validityText)}</p>
                ) : null}
                {tariff.id === markerTariff?.id ? (
                  <div>
                    <Badge severity="success">Applicable à cette date</Badge>
                  </div>
                ) : null}

                {dimensionGroups.length > 0 ? (
                  <div className="irve-tariff-reader__details">
                    {tariff.id === markerTariff?.id ? (
                      <dl className="irve-sidepanel__facts irve-tariff-reader__current">
                        <div className="irve-sidepanel__fact-row">
                          <div>
                            <dt>Composante carte</dt>
                          </div>
                          <dd>
                            {mapSummary.pricing_headline ?? bestSummary.headline ?? "Tarif disponible"}
                            {mapSummary.pricing_dimension ? <span className="irve-sidepanel__fact-hint">{markerDimensionLabel}</span> : null}
                          </dd>
                        </div>
                      </dl>
                    ) : null}

                    <div className="fr-accordions-group irve-tariff-reader__accordions">
                      {dimensionGroups.map((group) => (
                        <Accordion
                          key={`${tariff.id}-${group.type}`}
                          label={group.label}
                          classes={{
                            root: "irve-tariff-reader__accordion",
                            title: "irve-tariff-reader__accordion-title",
                          }}
                        >
                          <ul className="irve-tariff-reader__lines">
                            {group.lines.map((line, lineIndex) => {
                              const viewModel = getTariffLineViewModel(line, group.lines.length > 1);

                              return (
                                <li key={`${tariff.id}-${group.type}-${lineIndex}`} className="irve-tariff-reader__line">
                                  <strong>{viewModel.amount}</strong>
                                  {viewModel.restrictions.length > 0 ? (
                                    <ul className="irve-tariff-reader__restrictions">
                                      {viewModel.restrictions.map((restriction, index) => (
                                        <li key={`${restriction}-${index}`}>{renderHighlightedText(restriction)}</li>
                                      ))}
                                    </ul>
                                  ) : null}
                                </li>
                              );
                            })}
                          </ul>
                        </Accordion>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="irve-sidepanel__missing">Aucune composante tarifaire exploitable.</p>
                )}
              </div>
            }
            border
          />
        );
      })}
    </div>
  );
}
