import { hasDisplayableTariffComponent } from "@/lib/irve/tariffs";
import type { QualichargeTariff } from "@/types/irve";

import type { ApplicableTariffsByPdc, IndexedTariff } from "./types";

function isTariffApplicable(tariff: QualichargeTariff, at: Date) {
  const atTime = at.getTime();
  const startTime = tariff.start ? new Date(tariff.start).getTime() : null;
  const endTime = tariff.end ? new Date(tariff.end).getTime() : null;

  return (
    (startTime == null || Number.isNaN(startTime) || startTime <= atTime) &&
    (endTime == null || Number.isNaN(endTime) || endTime > atTime)
  );
}

function compareApplicableTariffs(left: IndexedTariff, right: IndexedTariff) {
  const leftHasStart = left.start ? 1 : 0;
  const rightHasStart = right.start ? 1 : 0;
  if (leftHasStart !== rightHasStart) return leftHasStart - rightHasStart;

  const leftStart = left.start ? new Date(left.start).getTime() : 0;
  const rightStart = right.start ? new Date(right.start).getTime() : 0;
  if (leftStart !== rightStart) return leftStart - rightStart;

  return compareLastUpdatedTariffs(left, right);
}

function compareLastUpdatedTariffs(left: IndexedTariff, right: IndexedTariff) {
  const leftLastUpdated = left.parsed?.last_updated ?? left.original_last_updated;
  const rightLastUpdated = right.parsed?.last_updated ?? right.original_last_updated;
  const leftUpdated = leftLastUpdated ? new Date(leftLastUpdated).getTime() : 0;
  const rightUpdated = rightLastUpdated ? new Date(rightLastUpdated).getTime() : 0;
  if (leftUpdated !== rightUpdated) return leftUpdated - rightUpdated;

  const idComparison = left.id.localeCompare(right.id);
  return idComparison !== 0 ? idComparison : left.raw.localeCompare(right.raw);
}

export function selectApplicableTariffs(tariffs: IndexedTariff[], at: Date): ApplicableTariffsByPdc {
  const applicableTariffs = new Map<string, IndexedTariff>();
  const latestTariffs = new Map<string, IndexedTariff>();

  for (const tariff of tariffs) {
    if (tariff.id_pdc_itinerance.length === 0) {
      continue;
    }

    if (!isTariffApplicable(tariff, at)) {
      for (const idPdcItinerance of tariff.id_pdc_itinerance) {
        const latest = latestTariffs.get(idPdcItinerance);
        if (!latest || compareLastUpdatedTariffs(tariff, latest) > 0) {
          latestTariffs.set(idPdcItinerance, tariff);
        }
      }

      continue;
    }

    for (const idPdcItinerance of tariff.id_pdc_itinerance) {
      const latest = latestTariffs.get(idPdcItinerance);
      if (!latest || compareLastUpdatedTariffs(tariff, latest) > 0) {
        latestTariffs.set(idPdcItinerance, tariff);
      }

      const current = applicableTariffs.get(idPdcItinerance);
      if (!current || compareApplicableTariffs(tariff, current) > 0) {
        applicableTariffs.set(idPdcItinerance, tariff);
      }
    }
  }

  for (const [idPdcItinerance, latestTariff] of latestTariffs) {
    const applicableTariff = applicableTariffs.get(idPdcItinerance);
    if (!applicableTariff) {
      applicableTariffs.set(idPdcItinerance, latestTariff);
    } else if (!hasDisplayableTariffComponent(applicableTariff, at) && hasDisplayableTariffComponent(latestTariff, at)) {
      applicableTariffs.set(idPdcItinerance, latestTariff);
    }
  }

  return applicableTariffs;
}
