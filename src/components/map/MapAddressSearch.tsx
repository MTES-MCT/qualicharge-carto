"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type RefObject } from "react";
import L, { type Map as LeafletMap } from "leaflet";
import { SearchBar } from "@codegouvfr/react-dsfr/SearchBar";

import { useDebouncedValue } from "@/hooks/useDebouncedValue";

const COMPLETION_ENDPOINT = "https://data.geopf.fr/geocodage/completion/";
const MIN_QUERY_LENGTH = 3;
const MAX_RESULTS = 6;

interface GeoCompletionResult {
  x: number;
  y: number;
  fulltext?: string;
  city?: string;
  zipcode?: string;
  kind?: string;
}

interface GeoCompletionResponse {
  results?: GeoCompletionResult[];
  status?: string;
}

interface MapAddressSearchProps {
  className?: string;
  mapRef: RefObject<LeafletMap | null>;
}

function isValidCompletionResult(result: GeoCompletionResult) {
  return (
    Number.isFinite(result.x) &&
    Number.isFinite(result.y) &&
    typeof result.fulltext === "string" &&
    result.fulltext.trim() !== ""
  );
}

function getResultZoom(result: GeoCompletionResult) {
  switch (result.kind) {
    case "housenumber":
      return 16;
    case "street":
      return 15;
    case "municipality":
      return 12;
    default:
      return 14;
  }
}

function getResultMeta(result: GeoCompletionResult) {
  switch (result.kind) {
    case "housenumber":
      return "Adresse";
    case "street":
      return "Voie";
    case "municipality":
      return "Commune";
    case "locality":
      return "Lieu-dit";
    default:
      return [result.zipcode, result.city].filter(Boolean).join(" ");
  }
}

export function MapAddressSearch({ className, mapRef }: MapAddressSearchProps) {
  const generatedId = useId().replaceAll(":", "");
  const listboxId = `${generatedId}-address-suggestions`;
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 250);
  const [results, setResults] = useState<GeoCompletionResult[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const trimmedQuery = debouncedQuery.trim();
  const canSearch = trimmedQuery.length >= MIN_QUERY_LENGTH;
  const isListOpen =
    isFocused && (isLoading || hasError || results.length > 0 || (canSearch && !isLoading));

  useEffect(() => {
    const node = rootRef.current;
    if (!node) {
      return;
    }

    L.DomEvent.disableClickPropagation(node);
    L.DomEvent.disableScrollPropagation(node);
  }, []);

  useEffect(() => {
    if (!canSearch) {
      return;
    }

    const abortController = new AbortController();
    const url = new URL(COMPLETION_ENDPOINT);
    url.searchParams.set("text", trimmedQuery);
    url.searchParams.set("type", "StreetAddress");
    url.searchParams.set("maximumResponses", String(MAX_RESULTS));

    const center = mapRef.current?.getCenter();
    if (center) {
      url.searchParams.set("lonlat", `${center.lng},${center.lat}`);
    }

    queueMicrotask(() => {
      if (!abortController.signal.aborted) {
        setIsLoading(true);
        setHasError(false);
      }
    });

    fetch(url, { signal: abortController.signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Geocoding completion failed with ${response.status}`);
        }

        return response.json() as Promise<GeoCompletionResponse>;
      })
      .then((payload) => {
        const nextResults = (payload.results ?? []).filter(isValidCompletionResult);
        setResults(nextResults);
        setActiveIndex(nextResults.length > 0 ? 0 : -1);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setResults([]);
        setActiveIndex(-1);
        setHasError(true);
      })
      .finally(() => {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => {
      abortController.abort();
    };
  }, [canSearch, mapRef, trimmedQuery]);

  const selectResult = (result: GeoCompletionResult) => {
    setQuery(result.fulltext ?? "");
    setResults([]);
    setActiveIndex(-1);
    setIsFocused(false);
    mapRef.current?.flyTo([result.y, result.x], getResultZoom(result), {
      animate: true,
      duration: 0.65,
    });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setResults([]);
      setActiveIndex(-1);
      return;
    }

    if (results.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((currentIndex) => (currentIndex + 1) % results.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((currentIndex) =>
        currentIndex <= 0 ? results.length - 1 : currentIndex - 1
      );
      return;
    }

    if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      selectResult(results[activeIndex]);
    }
  };

  const handleButtonClick = () => {
    const selectedResult = results[activeIndex] ?? results[0];
    if (selectedResult) {
      selectResult(selectedResult);
    }
  };

  return (
    <div ref={rootRef} className={`irve-map-address-search ${className ?? ""}`}>
      <SearchBar
        label="Rechercher une adresse ou une commune"
        onButtonClick={handleButtonClick}
        allowEmptySearch={false}
        renderInput={({ className: inputClassName, id, placeholder, type }) => (
          <input
            aria-activedescendant={
              activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined
            }
            aria-autocomplete="list"
            aria-controls={listboxId}
            aria-expanded={isListOpen}
            autoComplete="off"
            className={inputClassName}
            id={id}
            onBlur={() => {
              window.setTimeout(() => setIsFocused(false), 120);
            }}
            onChange={(event) => {
              const nextQuery = event.currentTarget.value;
              setQuery(nextQuery);
              setIsFocused(true);

              if (nextQuery.trim().length < MIN_QUERY_LENGTH) {
                setResults([]);
                setActiveIndex(-1);
                setIsLoading(false);
                setHasError(false);
              }
            }}
            onFocus={() => setIsFocused(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            role="combobox"
            type={type}
            value={query}
          />
        )}
      />

      {isListOpen && (
        <div className="irve-map-address-search__menu" id={listboxId} role="listbox">
          {isLoading ? (
            <p className="irve-map-address-search__status">Recherche...</p>
          ) : hasError ? (
            <p className="irve-map-address-search__status">Recherche indisponible</p>
          ) : results.length === 0 ? (
            <p className="irve-map-address-search__status">Aucun résultat</p>
          ) : (
            results.map((result, index) => (
              <button
                aria-selected={index === activeIndex}
                className="irve-map-address-search__option"
                id={`${listboxId}-${index}`}
                key={`${result.fulltext}-${result.x}-${result.y}`}
                onClick={() => selectResult(result)}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActiveIndex(index)}
                role="option"
                type="button"
              >
                <span>{result.fulltext}</span>
                <small>{getResultMeta(result)}</small>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
