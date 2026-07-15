import type { TariffComponentLine } from "@/lib/irve/tariffs";
import type { QualichargeEVSEPdc, QualichargeTariff } from "@/types/irve";
import type { StationDetailsTabProps } from "../shared";

export type HighlightedTextPart =
  | { kind: "text"; value: string }
  | { kind: "strong"; value: string };

export interface TariffLineViewModel {
  amount: string;
  restrictions: string[];
}

export interface ApplicableTariffPdc {
  id: QualichargeEVSEPdc["id_pdc_itinerance"];
  power: QualichargeEVSEPdc["puissance_nominale"];
}

export interface ApplicableTariffEntry {
  tariff: QualichargeTariff;
  pdcs: ApplicableTariffPdc[];
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
  const entries = new Map<string, ApplicableTariffEntry>();

  for (const pdc of station.pdcs) {
    if (!pdc.applicable_tariff) {
      continue;
    }

    const tariffId = pdc.applicable_tariff.id;
    const entry = entries.get(tariffId) ?? {
      tariff: pdc.applicable_tariff,
      pdcs: [],
    };

    entry.pdcs.push({
      id: pdc.id_pdc_itinerance,
      power: pdc.puissance_nominale,
    });
    entries.set(tariffId, entry);
  }

  return Array.from(entries.values());
}

export function formatPdcPower(power: number) {
  return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(power)} kW`;
}

export function getTariffCardTitle(entry: ApplicableTariffEntry, tariffCount: number) {
  if (tariffCount < 2 && entry.pdcs.length < 2) {
    return "Tarif";
  }

  const powers = Array.from(new Set(entry.pdcs.map((pdc) => pdc.power)));

  if (powers.length === 1) {
    return `Tarif ${formatPdcPower(powers[0])}`;
  }

  return `Tarif pour ${entry.pdcs.length} points de charge`;
}

export function shouldShowTariffPdcScope(entry: ApplicableTariffEntry, tariffCount: number) {
  return tariffCount > 1 || entry.pdcs.length > 1;
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

export function sortTariffEntries<T extends { tariff: QualichargeTariff }>(entries: T[], bestTariff: QualichargeTariff | null) {
  return [...entries].sort((left, right) => {
    if (left.tariff.id === bestTariff?.id) return -1;
    if (right.tariff.id === bestTariff?.id) return 1;
    return getTariffDisplayId(left.tariff).localeCompare(getTariffDisplayId(right.tariff), "fr-FR");
  });
}
