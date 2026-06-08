import { readFile } from "node:fs/promises";

import type { AsyncBuffer } from "hyparquet";
import { asyncBufferFromUrl, parquetMetadataAsync, parquetReadObjects } from "hyparquet";
import { compressors } from "hyparquet-compressors";

import { cacheOptions } from "./config";

async function asyncBufferFromLocalFile(path: string): Promise<AsyncBuffer> {
  const buffer = await readFile(path);

  return {
    byteLength: buffer.byteLength,
    slice(start, end) {
      return buffer.buffer.slice(buffer.byteOffset + start, buffer.byteOffset + (end ?? buffer.byteLength));
    },
  };
}

export function readRemoteParquetBuffer(url: string) {
  return asyncBufferFromUrl({ url, requestInit: cacheOptions });
}

export async function readParquetRows<T>(file: AsyncBuffer) {
  return (await parquetReadObjects({ file, compressors })) as T[];
}

export async function readLocalParquetRows<T>(path: string) {
  return readParquetRows<T>(await asyncBufferFromLocalFile(path));
}

export async function readParquetRowBatch<T>(file: AsyncBuffer, rowStart: number, rowEnd: number) {
  return (await parquetReadObjects({ file, compressors, rowStart, rowEnd })) as T[];
}

export async function getParquetRowCount(file: AsyncBuffer) {
  const metadata = await parquetMetadataAsync(file);
  return Number(metadata.num_rows);
}
