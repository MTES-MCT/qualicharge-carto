import type { QualichargeTariffRaw } from "@/types/irve";
import { normalizeJsonValue } from "@/lib/json";

export function parseTariffRaw(raw?: unknown): QualichargeTariffRaw | null {
  if (!raw) {
    return null;
  }

  const normalizedRaw = normalizeJsonValue(raw);
  if (typeof raw === "object") {
    return normalizedRaw as QualichargeTariffRaw;
  }

  try {
    return normalizeJsonValue(JSON.parse(String(raw))) as QualichargeTariffRaw;
  } catch {
    return null;
  }
}

export function stringifyTariffRaw(raw: unknown) {
  if (typeof raw === "string") {
    return raw;
  }

  const normalizedRaw = normalizeJsonValue(raw);
  if (normalizedRaw == null) {
    return "";
  }

  try {
    return JSON.stringify(normalizedRaw);
  } catch {
    return "";
  }
}
