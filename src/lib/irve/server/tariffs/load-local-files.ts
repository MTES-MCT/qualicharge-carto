import { access, readdir } from "node:fs/promises";
import { join } from "node:path";

import { readLocalParquetRows } from "../parquet";
import { toIsoString, toRequiredString } from "../coerce";
import { parseTariffRaw, stringifyTariffRaw } from "./tariff-raw";
import type { IndexedTariff, LocalTariffParquetRow, LocalTariffPdcParquetRow } from "./types";

const TARIFF_FILE_NAME = "qualicharge_tariff.parquet";
const TARIFF_PDC_FILE_NAME = "qualicharge_tariffpdc.parquet";

type LocalTariffProviderFiles = {
  provider: string;
  tariffPath: string;
  tariffPdcPath: string;
};

async function exists(path: string) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function discoverLocalTariffProviderFiles(rootDir: string): Promise<LocalTariffProviderFiles[]> {
  const children = await readdir(rootDir, { withFileTypes: true });
  const providerDirs = children
    .filter((child) => child.isDirectory())
    .sort((left, right) => left.name.localeCompare(right.name));

  const providers = await Promise.all(
    providerDirs.map(async (providerDir) => {
      const providerPath = join(rootDir, providerDir.name);
      const tariffPath = join(providerPath, TARIFF_FILE_NAME);
      const tariffPdcPath = join(providerPath, TARIFF_PDC_FILE_NAME);
      const [hasTariff, hasTariffPdc] = await Promise.all([exists(tariffPath), exists(tariffPdcPath)]);

      if (!hasTariff || !hasTariffPdc) {
        throw new Error(
          `Invalid tariff provider folder ${providerPath}. Expected ${TARIFF_FILE_NAME} and ${TARIFF_PDC_FILE_NAME}.`
        );
      }

      return {
        provider: providerDir.name,
        tariffPath,
        tariffPdcPath,
      };
    })
  );

  const validProviders = providers.filter((provider): provider is LocalTariffProviderFiles => provider != null);
  if (validProviders.length === 0) {
    throw new Error(
      `No tariff parquet provider folders found in ${rootDir}. Expected ${rootDir}/[provider]/${TARIFF_FILE_NAME} and ${TARIFF_PDC_FILE_NAME}.`
    );
  }

  return validProviders;
}

function indexTariffs(provider: string, rows: LocalTariffParquetRow[], rowIndexBase: number) {
  const tariffs: IndexedTariff[] = [];
  const tariffsByReference = new Map<string, IndexedTariff[]>();

  rows.forEach((row, rowIndex) => {
    const originalId = toRequiredString(row.original_id);
    if (!originalId) {
      return;
    }

    const originalLastUpdated = toIsoString(row.original_last_updated);
    const indexedRow = rowIndexBase + rowIndex;
    const tariff: IndexedTariff = {
      id: `${provider}::${originalId}::${originalLastUpdated ?? "unknown"}::${rowIndex}`,
      original_id: originalId,
      original_last_updated: originalLastUpdated,
      raw: stringifyTariffRaw(row.raw),
      parsed: parseTariffRaw(row.raw),
      start: toIsoString(row.start),
      end: toIsoString(row.end),
      id_pdc_itinerance: [],
      rowIndex: indexedRow,
    };

    tariffs.push(tariff);
    tariffsByReference.set(originalId, [...(tariffsByReference.get(originalId) ?? []), tariff]);
  });

  return { tariffs, tariffsByReference };
}

function attachPdcReferences(rows: LocalTariffPdcParquetRow[], tariffsByReference: Map<string, IndexedTariff[]>) {
  for (const row of rows) {
    const idPdcItinerance = toRequiredString(row.id_pdc_itinerance);
    const idTariff = toRequiredString(row.id_tariff);
    const tariffs = tariffsByReference.get(idTariff) ?? [];

    if (!idPdcItinerance || tariffs.length === 0) {
      continue;
    }

    for (const tariff of tariffs) {
      if (!tariff.id_pdc_itinerance.includes(idPdcItinerance)) {
        tariff.id_pdc_itinerance.push(idPdcItinerance);
      }
    }
  }
}

async function loadProviderTariffs(files: LocalTariffProviderFiles, rowIndexBase: number) {
  const [tariffRows, tariffPdcRows] = await Promise.all([
    readLocalParquetRows<LocalTariffParquetRow>(files.tariffPath),
    readLocalParquetRows<LocalTariffPdcParquetRow>(files.tariffPdcPath),
  ]);
  const { tariffs, tariffsByReference } = indexTariffs(files.provider, tariffRows, rowIndexBase);

  attachPdcReferences(tariffPdcRows, tariffsByReference);

  return tariffs;
}

export async function loadLocalTariffFiles(rootDir: string) {
  const providerFiles = await discoverLocalTariffProviderFiles(rootDir);
  const providerTariffs: IndexedTariff[][] = [];
  let rowIndexBase = 0;

  for (const files of providerFiles) {
    const tariffs = await loadProviderTariffs(files, rowIndexBase);
    providerTariffs.push(tariffs);
    rowIndexBase += tariffs.length;
  }

  return providerTariffs.flat();
}
