import type { QualichargeTariffElement } from "@/types/irve";

import { DAY_CODES, JS_DAY_TO_OCPI } from "./constants";

const DEFAULT_MARKER_SESSION_DURATION_MINUTES = 30;
const DEFAULT_MARKER_SESSION_KWH = 51;

export interface TariffParamSession {
  time: string;
  date: string;
  day_of_week: string;
  duration: number;
  kwh: number;
}

export interface TariffParamPdc {
  power?: number;
}

export interface TariffParamOther {
  current: number;
  vehicle_soc: number;
  congestion: number;
  reservation: boolean;
}

export interface TariffCurrentPriceParams {
  paramSession: TariffParamSession;
  paramPdc: TariffParamPdc;
  paramOther: TariffParamOther;
}

function getPositiveNumberEnv(name: string, fallback: number) {
  const parsed = Number(process.env[name]);

  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export function getTariffCurrentPriceParams(at: Date, power?: number): TariffCurrentPriceParams {
  return {
    paramSession: {
      time: `${String(at.getHours()).padStart(2, "0")}:${String(at.getMinutes()).padStart(2, "0")}`,
      date: `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, "0")}-${String(at.getDate()).padStart(2, "0")}`,
      day_of_week: JS_DAY_TO_OCPI[at.getDay()],
      duration: getPositiveNumberEnv("TARIFF_MARKER_SESSION_DURATION_MINUTES", DEFAULT_MARKER_SESSION_DURATION_MINUTES),
      kwh: getPositiveNumberEnv("TARIFF_MARKER_SESSION_KWH", DEFAULT_MARKER_SESSION_KWH),
    },
    paramPdc: {
      power,
    },
    paramOther: {
      current: 1,
      vehicle_soc: 50,
      congestion: 10,
      reservation: false,
    },
  };
}

function getTimeMinutes(value: unknown) {
  if (typeof value !== "string" || value.length === 0) {
    return null;
  }

  const [hours, minutes] = value.replace("Z", "").split(":").map((part) => Number.parseInt(part, 10));
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return null;
  }

  return hours * 60 + minutes;
}

function isTimeWithinTimeRange(startTime: unknown, endTime: unknown, time: string) {
  const start = getTimeMinutes(startTime);
  const end = getTimeMinutes(endTime);
  const now = getTimeMinutes(time);

  if (now == null) {
    return true;
  }

  if (start == null && end == null) return true;
  if (start != null && end != null) {
    if (start === end) return true;
    return start < end ? now >= start && now < end : now >= start || now < end;
  }
  if (start != null) return now >= start;
  return end == null || now < end;
}

function getDateOnlyTime(value: unknown) {
  if (typeof value !== "string" || value.length === 0) {
    return null;
  }

  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isDateWithinDateRange(startDate: unknown, endDate: unknown, date: string) {
  const current = getDateOnlyTime(date)?.getTime();
  const start = getDateOnlyTime(startDate)?.getTime();
  const end = getDateOnlyTime(endDate)?.getTime();

  if (current == null) {
    return true;
  }

  return (start == null || start <= current) && (end == null || end >= current);
}

function isRestrictionNumberMatched(
  value: unknown,
  current: number,
  comparator: (restrictionValue: number, currentValue: number) => boolean
) {
  if (value == null) {
    return true;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? comparator(parsed, current) : true;
}

function isReservationMatched(restriction: unknown, reservation: boolean) {
  if (restriction == null) {
    return true;
  }

  if (restriction === "RESERVATION") {
    return reservation;
  }

  if (restriction === "RESERVATION_EXPIRES") {
    return !reservation;
  }

  return true;
}

export function getTariffElementRestrictions(element: QualichargeTariffElement) {
  return element.restrictions ?? {};
}

export function tariffElementMatchesConsultation(
  element: QualichargeTariffElement,
  options: { at: Date; power?: number }
) {
  const { paramSession, paramPdc, paramOther } = getTariffCurrentPriceParams(options.at, options.power);

  return tariffElementRestrictionStatus(element, paramSession, paramPdc, paramOther) === true;
}

export function tariffElementRestrictionStatus(
  element: QualichargeTariffElement,
  paramSession: TariffParamSession,
  paramPdc: TariffParamPdc,
  paramOther: TariffParamOther
): boolean | null {
  const restrictions = getTariffElementRestrictions(element);

  const days = Array.isArray(restrictions.day_of_week) ? restrictions.day_of_week.map(String) : null;
  if (days && days.length > 0 && !days.includes(paramSession.day_of_week)) {
    return false;
  }

  if (!isDateWithinDateRange(restrictions.start_date, restrictions.end_date, paramSession.date)) {
    return false;
  }

  if (!isTimeWithinTimeRange(restrictions.start_time, restrictions.end_time, paramSession.time)) {
    return false;
  }

  if (
    paramPdc.power != null &&
    (!isRestrictionNumberMatched(restrictions.min_power, paramPdc.power, (restriction, current) => current >= restriction) ||
      !isRestrictionNumberMatched(restrictions.max_power, paramPdc.power, (restriction, current) => current <= restriction))
  ) {
    return false;
  }

  if (
    !isRestrictionNumberMatched(restrictions.min_duration, paramSession.duration, (restriction, current) => current >= restriction) ||
    !isRestrictionNumberMatched(restrictions.max_duration, paramSession.duration, (restriction, current) => current <= restriction) ||
    !isRestrictionNumberMatched(restrictions.min_kwh, paramSession.kwh, (restriction, current) => current >= restriction) ||
    !isRestrictionNumberMatched(restrictions.max_kwh, paramSession.kwh, (restriction, current) => current <= restriction) ||
    !isRestrictionNumberMatched(restrictions.min_current, paramOther.current, (restriction, current) => current >= restriction) ||
    !isRestrictionNumberMatched(restrictions.max_current, paramOther.current, (restriction, current) => current <= restriction) ||
    !isRestrictionNumberMatched(restrictions.min_vehicle_soc, paramOther.vehicle_soc, (restriction, current) => current >= restriction) ||
    !isRestrictionNumberMatched(restrictions.min_congestion_threshold, paramOther.congestion, (restriction, current) => current >= restriction)
  ) {
    return false;
  }

  if (!isReservationMatched(restrictions.reservation, paramOther.reservation)) {
    return false;
  }

  return true;
}

function formatPlainNumber(value: number) {
  return value.toLocaleString("fr-FR", {
    maximumFractionDigits: 2,
  });
}

function formatDateRestriction(value: unknown) {
  return typeof value === "string" ? value.slice(0, 10) : null;
}

function formatTimeRestriction(value: unknown) {
  return typeof value === "string" ? value.replace("Z", "").slice(0, 5) : null;
}

function getRestrictionNumber(value: unknown) {
  if (value == null) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function getTariffRestrictionTexts(restrictions?: Record<string, unknown> | null) {
  if (!restrictions) {
    return [];
  }

  const parts: string[] = [];
  const days = Array.isArray(restrictions.day_of_week) ? restrictions.day_of_week.map((day) => DAY_CODES[String(day)] ?? String(day)) : null;
  const startDate = formatDateRestriction(restrictions.start_date);
  const endDate = formatDateRestriction(restrictions.end_date);
  const startTime = formatTimeRestriction(restrictions.start_time);
  const endTime = formatTimeRestriction(restrictions.end_time);

  if (days && days.length > 0 && days.length < 7) parts.push(`les ${days.map((day) => `${day}s`).join(", ")}`);
  if (startDate && endDate) parts.push(`du ${startDate} au ${endDate}`);
  else if (startDate) parts.push(`après le ${startDate}`);
  else if (endDate) parts.push(`avant le ${endDate}`);

  if (startTime && endTime) parts.push(`entre ${startTime} et ${endTime}`);
  else if (startTime) parts.push(`à partir de ${startTime}`);
  else if (endTime) parts.push(`jusqu’à ${endTime}`);

  const minDuration = getRestrictionNumber(restrictions.min_duration);
  const maxDuration = getRestrictionNumber(restrictions.max_duration);
  if (minDuration != null && minDuration > 0 && maxDuration != null) {
    parts.push(`durée entre ${Math.round(minDuration / 60)} min et ${Math.round(maxDuration / 60)} min`);
  } else if (minDuration != null && minDuration > 0) {
    parts.push(`si la durée est supérieure à ${Math.round(minDuration / 60)} min`);
  } else if (maxDuration != null) {
    parts.push(`si la durée est inférieure à ${Math.round(maxDuration / 60)} min`);
  }

  const minPower = getRestrictionNumber(restrictions.min_power);
  const maxPower = getRestrictionNumber(restrictions.max_power);
  if (minPower != null && minPower > 0 && maxPower != null) {
    parts.push(`puissance entre ${formatPlainNumber(minPower)} kW et ${formatPlainNumber(maxPower)} kW`);
  } else if (minPower != null && minPower > 0) {
    parts.push(`puissance supérieure à ${formatPlainNumber(minPower)} kW`);
  } else if (maxPower != null) {
    parts.push(`puissance inférieure à ${formatPlainNumber(maxPower)} kW`);
  }

  const minKwh = getRestrictionNumber(restrictions.min_kwh);
  const maxKwh = getRestrictionNumber(restrictions.max_kwh);
  if (minKwh != null && minKwh > 0 && maxKwh != null) {
    parts.push(`énergie entre ${formatPlainNumber(minKwh)} kWh et ${formatPlainNumber(maxKwh)} kWh`);
  } else if (minKwh != null && minKwh > 0) {
    parts.push(`énergie supérieure à ${formatPlainNumber(minKwh)} kWh`);
  } else if (maxKwh != null) {
    parts.push(`énergie inférieure à ${formatPlainNumber(maxKwh)} kWh`);
  }

  const minCurrent = getRestrictionNumber(restrictions.min_current);
  const maxCurrent = getRestrictionNumber(restrictions.max_current);
  if (minCurrent != null && minCurrent > 0 && maxCurrent != null) {
    parts.push(`courant entre ${formatPlainNumber(minCurrent)} A et ${formatPlainNumber(maxCurrent)} A`);
  } else if (minCurrent != null && minCurrent > 0) {
    parts.push(`courant supérieur à ${formatPlainNumber(minCurrent)} A`);
  } else if (maxCurrent != null) {
    parts.push(`courant inférieur à ${formatPlainNumber(maxCurrent)} A`);
  }

  const minVehicleSoc = getRestrictionNumber(restrictions.min_vehicle_soc);
  if (minVehicleSoc != null) {
    parts.push(`batterie supérieure à ${formatPlainNumber(minVehicleSoc)} %`);
  }

  const minCongestion = getRestrictionNumber(restrictions.min_congestion_threshold);
  if (minCongestion != null) {
    parts.push(`congestion supérieure à ${formatPlainNumber(minCongestion)} %`);
  }

  if (restrictions.reservation === "RESERVATION") {
    parts.push("avec réservation");
  } else if (restrictions.reservation === "RESERVATION_EXPIRES") {
    parts.push("après expiration de la réservation");
  }

  return parts;
}
