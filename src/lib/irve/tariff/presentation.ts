import type { QualichargeTariff } from "@/types/irve";

import { TARIFF_DIMENSION_GROUP_ORDER } from "./constants";
import { formatTariffComponent, getTariffComponentLabel } from "./formatting";
import { getTariffRestrictionTexts } from "./restrictions";
import type { TariffComponentLine, TariffDimensionGroup } from "./types";

export function getTariffDimensionGroups(tariff: QualichargeTariff): TariffDimensionGroup[] {
  const groups = new Map<string, TariffComponentLine[]>();
  const seenLines = new Map<string, Set<string>>();

  for (const element of tariff.parsed?.elements ?? []) {
    for (const component of element.price_components ?? []) {
      const amount = formatTariffComponent(component, tariff.parsed?.currency, tariff.parsed?.tax_included);
      if (!amount) {
        continue;
      }

      const type = component.type ?? "UNKNOWN";
      const restrictions = getTariffRestrictionTexts(element.restrictions);
      const lineKey = `${amount}|${restrictions.join("|")}`;
      const seen = seenLines.get(type) ?? new Set<string>();
      if (seen.has(lineKey)) {
        continue;
      }
      seen.add(lineKey);
      seenLines.set(type, seen);

      const existing = groups.get(type) ?? [];
      existing.push({
        amount,
        restrictions,
      });
      groups.set(type, existing);
    }
  }

  return Array.from(groups.entries())
    .sort(([left], [right]) => {
      const leftIndex = TARIFF_DIMENSION_GROUP_ORDER.includes(left) ? TARIFF_DIMENSION_GROUP_ORDER.indexOf(left) : TARIFF_DIMENSION_GROUP_ORDER.length;
      const rightIndex = TARIFF_DIMENSION_GROUP_ORDER.includes(right) ? TARIFF_DIMENSION_GROUP_ORDER.indexOf(right) : TARIFF_DIMENSION_GROUP_ORDER.length;
      return leftIndex - rightIndex;
    })
    .map(([type, lines]) => ({
      type,
      label: getTariffComponentLabel(type),
      lines: [...lines].sort((left, right) => {
        if (left.restrictions.length === 0 && right.restrictions.length > 0) return 1;
        if (left.restrictions.length > 0 && right.restrictions.length === 0) return -1;
        return 0;
      }),
    }));
}
