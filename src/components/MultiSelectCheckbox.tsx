"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Checkbox } from "@codegouvfr/react-dsfr/Checkbox";
import { Tag } from "@codegouvfr/react-dsfr/Tag";

export interface MultiSelectCheckboxOption {
  value: string;
  label: string;
}

interface MultiSelectCheckboxProps {
  label: string;
  hintText?: string;
  options: MultiSelectCheckboxOption[];
  selectedValues: string[];
  onChange: (selectedValues: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  disabledOptions?: string[];
  message?: string;
}

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function MultiSelectCheckbox({
  label,
  hintText,
  options,
  selectedValues,
  onChange,
  placeholder = "Sélectionner...",
  disabled = false,
  disabledOptions = [],
  message,
}: MultiSelectCheckboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const id = useId();
  const listId = `${id}-listbox`;

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) {
      return options;
    }
    const normalized = normalizeSearch(searchQuery);
    return options.filter((option) =>
      normalizeSearch(option.label).includes(normalized)
    );
  }, [options, searchQuery]);

  const displayText =
    selectedValues.length === 0
      ? placeholder
      : selectedValues.length === 1
        ? options.find((o) => o.value === selectedValues[0])?.label ?? placeholder
        : `${selectedValues.length} sélectionnés`;

  const handleToggle = useCallback(
    (value: string) => {
      onChange(
        selectedValues.includes(value)
          ? selectedValues.filter((v) => v !== value)
          : [...selectedValues, value]
      );
    },
    [selectedValues, onChange]
  );

  const handleRemove = useCallback(
    (value: string) => {
      onChange(selectedValues.filter((v) => v !== value));
    },
    [selectedValues, onChange]
  );

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    setSearchQuery("");
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        closeDropdown();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      setTimeout(() => searchInputRef.current?.focus(), 0);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [closeDropdown, isOpen]);

  const selectedOptions = useMemo(
    () =>
      selectedValues
        .map((value) => options.find((o) => o.value === value))
        .filter((o): o is MultiSelectCheckboxOption => o !== undefined),
    [selectedValues, options]
  );

  return (
    <div ref={containerRef} className="relative">
      <label className="fr-label" htmlFor={id}>
        {label}
        {hintText && <span className="fr-hint-text">{hintText}</span>}
      </label>

      <button
        id={id}
        type="button"
        className="fr-select"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listId}
        disabled={disabled}
        onClick={() => {
          if (isOpen) {
            closeDropdown();
          } else {
            setIsOpen(true);
          }
        }}
      >
        <span className="block overflow-hidden text-ellipsis whitespace-nowrap text-left">
          {displayText}
        </span>
      </button>

      {isOpen && (
        <div
          id={listId}
          className="absolute top-[calc(100%+4px)] left-0 right-0 z-[1000] bg-white border border-gray-300 rounded shadow-lg flex flex-col max-h-[320px]"
          role="listbox"
          aria-multiselectable="true"
        >
          <div className="shrink-0 border-b border-gray-200 px-4 pt-4">
            <input
              ref={searchInputRef}
              type="search"
              className="fr-input"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 py-4 px-4">
            {message && (
              <p className="fr-text--sm fr-mb-2w text-gray-600">{message}</p>
            )}
            {filteredOptions.length === 0 ? (
              <p className="fr-text--sm fr-mb-0 text-center text-gray-500">
                Aucun résultat
              </p>
            ) : (
              <Checkbox
                small
                options={filteredOptions.map((option) => ({
                  label: option.label,
                  nativeInputProps: {
                    checked: selectedValues.includes(option.value),
                    disabled: disabledOptions.includes(option.value),
                    onChange: () => handleToggle(option.value),
                  },
                }))}
              />
            )}
          </div>
        </div>
      )}

      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedOptions.map((option) => (
            <Tag
              key={option.value}
              dismissible
              nativeButtonProps={{
                onClick: () => handleRemove(option.value),
              }}
            >
              {option.label}
            </Tag>
          ))}
        </div>
      )}
    </div>
  );
}
