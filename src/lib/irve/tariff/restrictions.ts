import type { QualichargeTariffElement } from "@/types/irve";

import { DAY_CODES, JS_DAY_TO_OCPI } from "./constants";

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

function isNowWithinTimeRange(startTime: unknown, endTime: unknown, at: Date) {
  const start = getTimeMinutes(startTime);
  const end = getTimeMinutes(endTime);
  const now = at.getHours() * 60 + at.getMinutes();

  if (start == null && end == null) return true;
  if (start != null && end != null) {
    if (start === end) return true;
    return start < end ? now >= start && now < end : now >= start || now < end;
  }
  if (start != null) return now >= start;
  return end == null || now < end;
}

function toDateOnly(value: unknown) {
  if (typeof value !== "string" || value.length === 0) {
    return null;
  }

  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isNowWithinDateRange(startDate: unknown, endDate: unknown, at: Date) {
  const current = new Date(at.getFullYear(), at.getMonth(), at.getDate()).getTime();
  const start = toDateOnly(startDate)?.getTime();
  const end = toDateOnly(endDate)?.getTime();

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

export function getTariffElementRestrictions(element: QualichargeTariffElement) {
  return element.restrictions ?? {};
}

export function tariffElementMatchesConsultation(
  element: QualichargeTariffElement,
  options: { at: Date; power?: number }
) {
  const restrictions = getTariffElementRestrictions(element);
  const at = options.at;

  const days = Array.isArray(restrictions.day_of_week) ? restrictions.day_of_week.map(String) : null;
  if (days && days.length > 0 && !days.includes(JS_DAY_TO_OCPI[at.getDay()])) {
    return false;
  }

  if (!isNowWithinDateRange(restrictions.start_date, restrictions.end_date, at)) {
    return false;
  }

  if (!isNowWithinTimeRange(restrictions.start_time, restrictions.end_time, at)) {
    return false;
  }

  if (
    options.power != null &&
    (!isRestrictionNumberMatched(restrictions.min_power, options.power, (restriction, current) => current >= restriction) ||
      !isRestrictionNumberMatched(restrictions.max_power, options.power, (restriction, current) => current <= restriction))
  ) {
    return false;
  }

  return true;
}

export function getConsultationRestrictionWeight(element: QualichargeTariffElement, hasPower: boolean) {
  const restrictions = getTariffElementRestrictions(element);
  let weight = 0;

  if (Array.isArray(restrictions.day_of_week) && restrictions.day_of_week.length > 0) weight += 1;
  if (restrictions.start_date != null) weight += 1;
  if (restrictions.end_date != null) weight += 1;
  if (restrictions.start_time != null) weight += 1;
  if (restrictions.end_time != null) weight += 1;
  if (hasPower && restrictions.min_power != null) weight += 1;
  if (hasPower && restrictions.max_power != null) weight += 1;

  return weight;
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

  if (days && days.length > 0) parts.push(`les ${days.map((day) => `${day}s`).join(", ")}`);
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

  return parts;
}
