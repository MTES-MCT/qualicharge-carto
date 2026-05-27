export type TariffPricingStatus = "STANDARD" | "FREE" | "UNKNOWN";
export type TariffMarkerDimension = "ENERGY" | "TIME" | "FLAT";

export interface TariffPricingSummary {
  status: TariffPricingStatus;
  headline: string | null;
  pricePerKwh: number | null;
  value: number | null;
  dimension: TariffMarkerDimension | null;
  unit: string | null;
}

export interface TariffComponentLine {
  amount: string;
  restrictions: string[];
}

export interface TariffDimensionGroup {
  type: string;
  label: string;
  lines: TariffComponentLine[];
}
