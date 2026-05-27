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
import type { StationDetailsTabProps } from "./shared";
import {
  getHighlightedTariffTextParts,
  getTaxIncludedLabel,
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

function renderTariffLine(line: ReturnType<typeof getTariffDimensionGroups>[number]["lines"][number], hasSeveralLines: boolean) {
  const viewModel = getTariffLineViewModel(line, hasSeveralLines);

  return (
    <>
      <strong>{viewModel.amount}</strong>
      {viewModel.restrictions.length > 0 ? " " : null}
      {viewModel.restrictions.map((restriction, index) => (
        <span key={`${restriction}-${index}`}>
          {index > 0 ? " et " : null}
          {renderHighlightedText(restriction)}
        </span>
      ))}
    </>
  );
}

export function StationPricingTab({ station }: StationDetailsTabProps) {
  const consultationDate = new Date();
  const applicableTariffs = getUniqueApplicableTariffEntries(station);
  const bestTariff = getBestStationTariff(applicableTariffs.map((entry) => entry.tariff), consultationDate);
  const bestSummary = getTariffSummary(bestTariff, consultationDate);
  const bestDimensionLabel = getTariffComponentLabel(bestSummary.dimension);
  const sortedTariffs = sortTariffEntries(applicableTariffs, bestTariff);

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
                {/* {tariff.parsed?.currency || getTaxIncludedLabel(tariff.parsed?.tax_included) ? (
                  <p className="irve-tariff-reader__meta">
                    {[
                      tariff.parsed?.currency,
                      getTaxIncludedLabel(tariff.parsed?.tax_included),
                    ].filter(Boolean).join(" · ")}
                  </p>
                ) : null} */}
                {validityText ? (
                  <p className="irve-tariff-reader__validity">{renderHighlightedText(validityText)}</p>
                ) : null}
                {tariff.id === bestTariff?.id ? (
                  <div>
                    <Badge severity="success">Applicable à cette date</Badge>
                  </div>
                ) : null}

                {dimensionGroups.length > 0 ? (
                  <div className="fr-accordions-group irve-tariff-reader__accordions">
                    {tariff.id === bestTariff?.id ? (
                      <Accordion
                        label="tarif actuellement applicable"
                        defaultExpanded
                        classes={{
                          root: "irve-tariff-reader__accordion",
                          title: "irve-tariff-reader__accordion-title",
                        }}
                      >
                        <dl className="irve-sidepanel__facts irve-tariff-reader__current">
                          <div className="irve-sidepanel__fact-row">
                            <div>
                              <dt>Composante carte</dt>
                          </div>
                          <dd>
                            {bestSummary.headline ?? "Tarif disponible"}
                            {bestSummary.dimension ? <span className="irve-sidepanel__fact-hint">{bestDimensionLabel}</span> : null}
                          </dd>
                        </div>
                      </dl>
                    </Accordion>
                  ) : null}

                    {dimensionGroups.map((group) => (
                      <Accordion
                        key={`${tariff.id}-${group.type}`}
                        label={group.label.toLocaleLowerCase("fr-FR")}
                        classes={{
                          root: "irve-tariff-reader__accordion",
                          title: "irve-tariff-reader__accordion-title",
                      }}
                    >
                      <div className="irve-tariff-reader__lines">
                        {group.lines.map((line, lineIndex) => (
                          <p key={`${tariff.id}-${group.type}-${lineIndex}`} className="irve-tariff-reader__line">
                            {renderTariffLine(line, group.lines.length > 1)}
                            </p>
                          ))}
                        </div>
                      </Accordion>
                    ))}
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
