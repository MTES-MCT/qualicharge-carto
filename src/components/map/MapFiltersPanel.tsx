"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Accordion } from "@codegouvfr/react-dsfr/Accordion";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Card } from "@codegouvfr/react-dsfr/Card";
import { Checkbox } from "@codegouvfr/react-dsfr/Checkbox";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { SegmentedControl } from "@codegouvfr/react-dsfr/SegmentedControl";

import {
  CONNECTOR_FILTER_OPTIONS,
  POWER_FILTER_OPTIONS,
  type MapFiltersState,
} from "@/lib/irve/mapFilters";
import type { MapDisplayMode } from "@/lib/irve/mapModes";
import { MultiSelectCheckbox } from "@/components/MultiSelectCheckbox";
import { MapSidePanel } from "./MapSidePanel";

interface MapFiltersPanelProps {
  filters: MapFiltersState;
  itineranceInputValue: string;
  isOpen: boolean;
  activeCount: number;
  stationCount: number;
  operatorOptions: Array<{ value: string; label: string }>;
  operatorsWithoutTarification: string[];
  mapDisplayMode: MapDisplayMode;
  onClose: () => void;
  onReset: () => void;
  onAccessChange: (value: MapFiltersState["access"]) => void;
  onTogglePower: (value: typeof POWER_FILTER_OPTIONS[number]["id"]) => void;
  onToggleConnector: (value: typeof CONNECTOR_FILTER_OPTIONS[number]["id"]) => void;
  onItineranceQueryChange: (value: string) => void;
  onSelectedOperatorsChange: (value: string[]) => void;
}

interface CheckboxOption {
  checked: boolean;
  hintText?: string;
  label: string;
  onChange: () => void;
}

function FilterCheckboxGroup({
  legend,
  options,
}: {
  legend: string;
  options: CheckboxOption[];
}) {
  return (
    <Checkbox
      small
      legend={legend}
      options={options.map((option) => ({
        label: option.label,
        hintText: option.hintText,
        nativeInputProps: {
          checked: option.checked,
          onChange: option.onChange,
        },
      }))}
    />
  );
}

function FilterAccordionSection({
  label,
  children,
}: {
  label: string;
  children: NonNullable<ReactNode>;
}) {
  const [expanded, setExpanded] = useState(true);
  const contentRef = useRef<HTMLDivElement | null>(null);
  // FIX: last version of react-dsfr (1.32.0) must have an issue with accordion causing expanded accordion to not expand to desired height. 
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    const node = contentRef.current;
    if (!node) {
      return;
    }

    const updateHeight = () => {
      setContentHeight(node.scrollHeight);
    };

    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <Accordion
      label={label}
      expanded={expanded}
      onExpandedChange={(nextExpanded) => setExpanded(nextExpanded)}
      // BUG: last version of react-dsfr (1.32.0) does not add relevent collapse classes...
      classes={{
        collapse: "irve-filter-accordion__collapse fr-collapse--expanded",
      }}
    >
      <div
        className={`irve-filter-accordion__inner${expanded ? " is-expanded" : ""}`}
        style={{ maxHeight: expanded ? `${contentHeight}px` : "0px" }}
      >
        <div ref={contentRef} className="irve-filter-accordion__content">
          {children}
        </div>
      </div>
    </Accordion>
  );
}

export function MapFiltersPanel({
  filters,
  itineranceInputValue,
  isOpen,
  activeCount,
  stationCount,
  operatorOptions,
  operatorsWithoutTarification,
  mapDisplayMode,
  onClose,
  onReset,
  onAccessChange,
  onTogglePower,
  onToggleConnector,
  onItineranceQueryChange,
  onSelectedOperatorsChange,
}: MapFiltersPanelProps) {
  return (
    <MapSidePanel
      id="map-filters"
      className="z-1220!"
      isOpen={isOpen}
      onClose={onClose}
      eyebrow="Carte de recharge"
      title="Filtres"
      subtitle="Affinez les stations visibles sur la carte et dans les clusters."
    >
      <Card
        title="Résultats visibles"
        titleAs="h3"
        size="small"
        border
        end={
          <div className="irve-filters-panel__summary">
            <div className="irve-filters-panel__summary-copy">
              <strong>{stationCount} stations</strong>
            </div>

            <div className="irve-filters-panel__summary-badges">
              <Badge severity={activeCount > 0 ? "info" : "new"}>
                {activeCount} filtre{activeCount > 1 ? "s" : ""} actif{activeCount > 1 ? "s" : ""}
              </Badge>
              <Button
                priority="secondary"
                size="small"
                iconId="fr-icon-refresh-line"
                disabled={activeCount === 0}
                onClick={onReset}
              >
                Réinitialiser
              </Button>
            </div>
          </div>
        }
      />

      <Card
        title="Recherche ciblée"
        titleAs="h3"
        size="small"
        border
        end={
          <div className="flex flex-col gap-4">
            <Input
              label="Identifiant station ou point"
              hintText="Recherche sur `id_station_itinerance` et `id_pdc_itinerance`. Une saisie partielle fonctionne, par exemple les 5 premiers caracteres de l'unite d'exploitation."
                nativeInputProps={{
                  type: "search",
                  value: itineranceInputValue,
                  placeholder: "Ex. FRTSLP29984",
                  onChange: (event) => {
                    onItineranceQueryChange(event.currentTarget.value);
                  },
                }}
              />

            <MultiSelectCheckbox
              label="Opérateur ou aménageur"
              hintText="Sélectionnez un ou plusieurs opérateurs ou aménageurs."
              options={operatorOptions}
              selectedValues={filters.selectedOperators}
              onChange={onSelectedOperatorsChange}
              placeholder="Tous les opérateurs"
              disabledOptions={mapDisplayMode === "pricing" ? operatorsWithoutTarification : []}
              message={mapDisplayMode === "pricing" ? "Nous ne pouvons afficher que les tarifs des opérateurs qui les transmettentent." : undefined}
            />
          </div>
        }
      />

      <SegmentedControl
        small
        legend="Accès"
        segments={[
          {
            label: "Toutes",
            nativeInputProps: {
              checked: filters.access === "all",
              onChange: () => onAccessChange("all"),
            },
          },
          {
            label: "Acces libre",
            nativeInputProps: {
              checked: filters.access === "free",
              onChange: () => onAccessChange("free"),
            },
          },
          {
            label: "Acces reserve",
            nativeInputProps: {
              checked: filters.access === "restricted",
              onChange: () => onAccessChange("restricted"),
            },
          },
        ]}
      />

      <FilterAccordionSection label="Puissance">
        <FilterCheckboxGroup
          legend="Puissance de recharge"
          options={POWER_FILTER_OPTIONS.map((option) => ({
            checked: filters.power.includes(option.id),
            hintText: option.description,
            label: option.label,
            onChange: () => onTogglePower(option.id),
          }))}
        />
      </FilterAccordionSection>

      <FilterAccordionSection label="Connecteurs">
        <FilterCheckboxGroup
          legend="Connecteurs disponibles"
          options={CONNECTOR_FILTER_OPTIONS.map((option) => ({
            checked: filters.connectors.includes(option.id),
            label: option.label,
            onChange: () => onToggleConnector(option.id),
          }))}
        />
      </FilterAccordionSection>

    </MapSidePanel>
  );
}
