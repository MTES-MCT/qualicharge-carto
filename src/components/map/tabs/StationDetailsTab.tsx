import { Card } from "@codegouvfr/react-dsfr/Card";

import { CopyableValue } from "@/components/irve/CopyableValue";
import { resolveDisplayValue, type DetailsTabProps } from "./shared";

export function StationDetailsTab({ sections, copiedKey, copy }: DetailsTabProps) {
  return (
    <div className="irve-sidepanel__tab-stack">
      {sections.map((section) => (
        <Card
          key={section.title}
          title={section.title}
          end={
            <dl className="irve-sidepanel__facts">
              {section.items.map((item) => (
                <CopyableValue
                  key={`${section.title}-${item.label}`}
                  item={item}
                  displayValue={resolveDisplayValue(item)}
                  copiedKey={copiedKey}
                  onCopy={copy}
                />
              ))}
            </dl>
          }
          border
        />
      ))}
    </div>
  );
}
