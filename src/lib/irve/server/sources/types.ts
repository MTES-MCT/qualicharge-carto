import type { QualichargeEVSEDynamic, QualichargeEVSEStatique } from "@/types/irve";

import type { IRVEDataSource } from "../config";

export type DynamicSourceRow = Partial<
  Record<keyof QualichargeEVSEDynamic | "id_station_itinerance", unknown>
>;
export type StaticSourceRow = Partial<Record<keyof QualichargeEVSEStatique, unknown>>;

export interface IRVESourceLoader {
  readonly source: IRVEDataSource;
  streamDynamicRows(): AsyncIterable<DynamicSourceRow>;
  streamStaticRows(): AsyncIterable<StaticSourceRow>;
}
