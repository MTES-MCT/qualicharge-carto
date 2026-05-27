import type { TariffComponentLine } from "@/lib/irve/tariffs";
import type { QualichargeTariff } from "@/types/irve";
import type { StationDetailsTabProps } from "../shared";

export type HighlightedTextPart =
  | { kind: "text"; value: string }
  | { kind: "strong"; value: string };

export interface TariffLineViewModel {
  amount: string;
  restrictions: string[];
}

export function formatTariffDateTime(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatVersionDate(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 10);
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
  }).format(date);
}

export function getTaxIncludedLabel(value: string | null | undefined) {
  switch (value) {
    case "YES":
      return "TTC";
    case "NO":
      return "HT";
    default:
      return null;
  }
}

export function getUniqueApplicableTariffEntries(station: StationDetailsTabProps["station"]) {
  const tariffs = new Map<string, QualichargeTariff>();

  for (const pdc of station.pdcs) {
    if (!pdc.applicable_tariff) {
      continue;
    }

    tariffs.set(pdc.applicable_tariff.id, pdc.applicable_tariff);
  }

  return Array.from(tariffs.values()).map((tariff) => ({ tariff }));
}

export function getTariffDisplayId(tariff: QualichargeTariff) {
  if (tariff.parsed?.country_code && tariff.parsed?.party_id && tariff.parsed?.id) {
    return `${tariff.parsed.country_code}${tariff.parsed.party_id}${tariff.parsed.id}`;
  }

  return tariff.original_id ?? tariff.parsed?.id ?? tariff.id;
}

export function getTariffVersionDate(tariff: QualichargeTariff) {
  return formatVersionDate(tariff.parsed?.last_updated ?? tariff.original_last_updated);
}

export function getTariffValidityText(tariff: QualichargeTariff) {
  const start = formatTariffDateTime(tariff.start);
  const end = formatTariffDateTime(tariff.end);

  if (start && end) {
    return `Validité : du ${start} au ${end}`;
  }
  if (start) {
    return `Validité : à partir du ${start}`;
  }
  if (end) {
    return `Validité : jusqu’au ${end}`;
  }

  return null;
}

export function getHighlightedTariffTextParts(text: string): HighlightedTextPart[] {
  const matches = text.matchAll(/(\d{1,2}:\d{2}|\d{1,2}\s+\p{Letter}+\s+\d{4}(?: à \d{1,2}:\d{2})?|\d{4}-\d{2}-\d{2}|\d+(?:[,.]\d+)?\s*(?:min|kWh|kW|A)|\b(?:Lu|Ma|Me|Je|Ve|Sa|Di|Lundis?|Mardis?|Mercredis?|Jeudis?|Vendredis?|Samedis?|Dimanches?)\b)/gu);
  const parts: HighlightedTextPart[] = [];
  let index = 0;

  for (const match of matches) {
    const start = match.index ?? 0;
    if (start > index) {
      parts.push({ kind: "text", value: text.slice(index, start) });
    }
    parts.push({ kind: "strong", value: match[0] });
    index = start + match[0].length;
  }

  if (index < text.length) {
    parts.push({ kind: "text", value: text.slice(index) });
  }

  return parts;
}

export function getTariffLineViewModel(line: TariffComponentLine, hasSeveralLines: boolean): TariffLineViewModel {
  return {
    amount: line.amount,
    restrictions: line.restrictions.length > 0 ? line.restrictions : hasSeveralLines ? ["sinon"] : [],
  };
}

export function sortTariffEntries(entries: Array<{ tariff: QualichargeTariff }>, bestTariff: QualichargeTariff | null) {
  return [...entries].sort((left, right) => {
    if (left.tariff.id === bestTariff?.id) return -1;
    if (right.tariff.id === bestTariff?.id) return 1;
    return getTariffDisplayId(left.tariff).localeCompare(getTariffDisplayId(right.tariff), "fr-FR");
  });
}
