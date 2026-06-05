import type { QualichargeEVSEPdc, QualichargeTariff } from "@/types/irve";

import { DIMENSION_ORDER } from "./constants";
import { formatCurrency, getDisplayPrice, getTariffComponentUnit } from "./formatting";
import { tariffElementMatchesConsultation } from "./restrictions";
import type { TariffMarkerDimension, TariffPricingSummary } from "./types";

function getDimensionRank(dimension: string | null | undefined) {
  const index = DIMENSION_ORDER.findIndex((item) => item === dimension);
  return index === -1 ? DIMENSION_ORDER.length : index;
}

export function getTariffEnergyPrices(tariff: QualichargeTariff | null | undefined) {
  if (!tariff?.parsed?.elements) {
    return [];
  }

  return tariff.parsed.elements.flatMap((element) =>
    (element.price_components ?? [])
      .filter((component) => component.type === "ENERGY")
      .map((component) => getDisplayPrice(component, tariff.parsed?.tax_included))
      .filter((price): price is number => typeof price === "number")
  );
}

export function getBestTariffEnergyPrice(tariff: QualichargeTariff | null | undefined) {
  const energyPrices = getTariffEnergyPrices(tariff);

  return energyPrices.length > 0 ? Math.min(...energyPrices) : null;
}

export function getFirstDisplayableTariffComponent(
  tariff: QualichargeTariff | null | undefined,
  options: { at: Date; power?: number }
) {
  const elements = tariff?.parsed?.elements ?? [];

  for (const dimension of DIMENSION_ORDER) {
    for (const [elementIndex, element] of elements.entries()) {
      if (!tariffElementMatchesConsultation(element, { at: options.at, power: options.power })) {
        continue;
      }

      for (const [componentIndex, component] of (element.price_components ?? []).entries()) {
        const price = getDisplayPrice(component, tariff?.parsed?.tax_included);

        if (component.type === dimension && typeof price === "number") {
          return {
            component,
            price,
            order: elementIndex * 1000 + componentIndex,
          };
        }
      }
    }
  }

  return null;
}

export function hasDisplayableTariffComponent(tariff: QualichargeTariff | null | undefined, at: Date) {
  return Boolean(getFirstDisplayableTariffComponent(tariff, { at }));
}

export function getTariffSummary(tariff: QualichargeTariff | null | undefined, at: Date): TariffPricingSummary {
  if (!tariff) {
    return {
      status: "UNKNOWN",
      headline: null,
      pricePerKwh: null,
      value: null,
      dimension: null,
      unit: null,
      tariffId: null,
    };
  }

  const selectedComponent = getFirstDisplayableTariffComponent(tariff, { at });
  const selectedPrice = selectedComponent ? getDisplayPrice(selectedComponent.component, tariff.parsed?.tax_included) : null;
  const selectedUnit = selectedComponent ? getTariffComponentUnit(selectedComponent.component.type) : null;
  const pricePerKwh = selectedComponent?.component.type === "ENERGY" ? selectedPrice : getBestTariffEnergyPrice(tariff);

  if (selectedPrice === 0 || pricePerKwh === 0) {
    return {
      status: "FREE",
      headline: "Gratuit",
      pricePerKwh: pricePerKwh ?? null,
      value: selectedPrice ?? pricePerKwh ?? null,
      dimension: (selectedComponent?.component.type as TariffMarkerDimension | undefined) ?? null,
      unit: selectedUnit,
      tariffId: selectedComponent ? tariff.id : null,
    };
  }

  if (typeof selectedPrice === "number" && selectedComponent) {
    return {
      status: "STANDARD",
      headline: `${formatCurrency(selectedPrice, tariff.parsed?.currency ?? "EUR")}${selectedUnit}`,
      pricePerKwh,
      value: selectedPrice,
      dimension: selectedComponent.component.type as TariffMarkerDimension,
      unit: selectedUnit,
      tariffId: tariff.id,
    };
  }

  return {
    status: "STANDARD",
    headline: "Tarif disponible",
    pricePerKwh: null,
    value: null,
    dimension: null,
    unit: null,
    tariffId: null,
  };
}

export function getBestStationTariff(tariffs: Array<QualichargeTariff | undefined>, at: Date) {
  const applicableTariffs = tariffs.filter((tariff): tariff is QualichargeTariff => Boolean(tariff));

  if (applicableTariffs.length === 0) {
    return null;
  }

  return applicableTariffs
    .map((tariff) => ({
      tariff,
      summary: getTariffSummary(tariff, at),
    }))
    .sort((a, b) => {
      const dimensionDiff = getDimensionRank(a.summary.dimension) - getDimensionRank(b.summary.dimension);
      if (dimensionDiff !== 0) return dimensionDiff;
      if (a.summary.value == null && b.summary.value == null) return 0;
      if (a.summary.value == null) return 1;
      if (b.summary.value == null) return -1;
      return a.summary.value - b.summary.value;
    })[0].tariff;
}

export function getStationMarkerPricing(pdcs: QualichargeEVSEPdc[], at: Date): TariffPricingSummary {
  const candidates = pdcs.flatMap((pdc, pdcIndex) => {
    const selected = getFirstDisplayableTariffComponent(pdc.applicable_tariff, {
      at,
      power: pdc.puissance_nominale,
    });

    if (!selected || !pdc.applicable_tariff) {
      return [];
    }

    return [{
      tariff: pdc.applicable_tariff,
      component: selected.component,
      price: selected.price,
      dimension: selected.component.type as TariffMarkerDimension,
      order: pdcIndex * 1_000_000 + selected.order,
    }];
  });

  for (const dimension of DIMENSION_ORDER) {
    const dimensionCandidates = candidates.filter((candidate) => candidate.dimension === dimension);
    if (dimensionCandidates.length === 0) {
      continue;
    }

    const selected = dimensionCandidates.sort((a, b) => a.order - b.order)[0];
    const unit = getTariffComponentUnit(selected.dimension);

    return {
      status: selected.price === 0 ? "FREE" : "STANDARD",
      headline: selected.price === 0 ? "Gratuit" : `${formatCurrency(selected.price, selected.tariff.parsed?.currency ?? "EUR")}${unit}`,
      pricePerKwh: selected.dimension === "ENERGY" ? selected.price : null,
      value: selected.price,
      dimension: selected.dimension,
      unit,
      tariffId: selected.tariff.id,
    };
  }

  return {
    status: "UNKNOWN",
    headline: null,
    pricePerKwh: null,
    value: null,
    dimension: null,
    unit: null,
    tariffId: null,
  };
}
