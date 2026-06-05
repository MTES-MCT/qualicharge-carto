export function toNumber(value?: unknown) {
  if (value == null || value === "") {
    return null;
  }

  const parsed = Number.parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : null;
}

export function toInteger(value?: unknown, fallback = 1) {
  if (value == null || value === "") {
    return fallback;
  }

  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function toBoolean(value?: unknown) {
  if (value == null || value === "") {
    return false;
  }
  if (value === true) return true;
  if (value === false) return false;

  return ["true", "1", "yes", "oui"].includes(String(value).trim().toLowerCase());
}

export function toNullableBoolean(value?: unknown) {
  if (value == null || value === "") {
    return null;
  }

  return toBoolean(value);
}

export function toNullableString(value?: unknown) {
  if (value == null) {
    return null;
  }

  const normalized = String(value);
  return normalized.length > 0 ? normalized : null;
}

export function toRequiredString(value?: unknown) {
  return value == null ? "" : String(value);
}

export function toIsoString(value?: unknown) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }

  const date = new Date(typeof value === "string" || typeof value === "number" ? value : String(value));
  return Number.isNaN(date.getTime()) ? String(value) : date.toISOString();
}
