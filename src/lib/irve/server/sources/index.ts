import { getIRVEDataSource, type IRVEDataSource } from "../config";
import { dataGouvSourceLoader } from "./datagouv";
import { openDataSourceLoader } from "./opendata";
import type { IRVESourceLoader } from "./types";

const sourceLoaders: Record<IRVEDataSource, IRVESourceLoader> = {
  datagouv: dataGouvSourceLoader,
  opendata: openDataSourceLoader,
};

export function getIRVESourceLoader(source = getIRVEDataSource()) {
  return sourceLoaders[source];
}

export type { DynamicSourceRow, IRVESourceLoader, StaticSourceRow } from "./types";
