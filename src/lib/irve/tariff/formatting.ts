import type { QualichargeTariffPriceComponent } from "@/types/irve";

import { COMPONENT_LABELS, DEFAULT_VAT_RATE } from "./constants";

export function formatCurrency(value: number, currency = "EUR") {
  return value.toLocaleString("fr-FR", {
    style: "currency",
    currency: currency || "EUR",
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

export function getTariffComponentLabel(type: string | null | undefined) {
  if (!type) {
    return "Composant tarifaire";
  }

  return COMPONENT_LABELS[type] ?? type;
}

export function getTariffComponentUnit(type: string | null | undefined) {
  switch (type) {
    case "ENERGY":
      return "/kWh";
    case "TIME":
    case "PARKING_TIME":
    case "CONGESTION_TIME":
    case "RESERVATION_TIME":
      return "/h";
    case "FLAT":
      return "";
    default:
      return "";
  }
}

function isTaxIncluded(taxIncluded?: string | null) {
  return taxIncluded === "YES";
}

function getVatRate(component: QualichargeTariffPriceComponent) {
  return typeof component.vat === "number" && component.vat > 0 ? component.vat / 100 : DEFAULT_VAT_RATE;
}

export function getDisplayPrice(component: QualichargeTariffPriceComponent, taxIncluded?: string | null) {
  if (typeof component.price !== "number") {
    return null;
  }

  return isTaxIncluded(taxIncluded) ? component.price : Number((component.price * (1 + getVatRate(component))).toFixed(4));
}

export function formatTariffComponent(
  component: QualichargeTariffPriceComponent,
  currency?: string | null,
  taxIncluded?: string | null
) {
  const price = getDisplayPrice(component, taxIncluded);
  if (typeof price !== "number") {
    return null;
  }

  return `${formatCurrency(price, currency ?? "EUR")}${getTariffComponentUnit(component.type)}`;
}
