import type { TariffMarkerDimension } from "./types";

export const COMPONENT_LABELS: Record<string, string> = {
  ENERGY: "Énergie",
  FLAT: "Forfait",
  PARKING_TIME: "Durée d’occupation hors charge",
  TIME: "Durée de recharge",
  CONGESTION_TIME: "Durée de congestion",
  RESERVATION: "Réservation",
  RESERVATION_TIME: "Temps de réservation",
};

export const DIMENSION_ORDER: TariffMarkerDimension[] = ["ENERGY", "TIME", "FLAT"];

export const TARIFF_DIMENSION_GROUP_ORDER = ["ENERGY", "TIME", "PARKING_TIME", "CONGESTION_TIME", "FLAT"];

export const DAY_CODES: Record<string, string> = {
  MONDAY: "Lundi",
  TUESDAY: "Mardi",
  WEDNESDAY: "Mercredi",
  THURSDAY: "Jeudi",
  FRIDAY: "Vendredi",
  SATURDAY: "Samedi",
  SUNDAY: "Dimanche",
};

export const JS_DAY_TO_OCPI = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

export const DEFAULT_VAT_RATE = 0.2;
