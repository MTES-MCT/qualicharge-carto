import { describe, expect, it } from "vitest";

import { parseCsvRecordStream, parseCsvRecords } from "./csv";

function csvStream(...chunks: string[]) {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder();

      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }

      controller.close();
    },
  });
}

async function readRecords(stream: ReadableStream<Uint8Array>) {
  const records = [];

  for await (const record of parseCsvRecordStream(stream)) {
    records.push(record);
  }

  return records;
}

describe("parseCsvRecords", () => {
  it("parses CSV rows with quoted commas and escaped quotes", () => {
    expect(parseCsvRecords('id,label\n1,"hello, world"\n2,"a ""quote"""')).toEqual([
      { id: "1", label: "hello, world" },
      { id: "2", label: 'a "quote"' },
    ]);
  });

  it("returns no records for empty CSV content", () => {
    expect(parseCsvRecords("")).toEqual([]);
  });

  it("streams CSV rows without buffering the full file", async () => {
    await expect(readRecords(csvStream("id,label\r\n1,\"hello", ", world\"\r\n2,\"a \"\"quote\"\"\""))).resolves.toEqual([
      { id: "1", label: "hello, world" },
      { id: "2", label: 'a "quote"' },
    ]);
  });

  it("fails on unterminated quoted fields", async () => {
    await expect(readRecords(csvStream('id,label\n1,"broken'))).rejects.toThrow("unterminated quoted field");
  });
});
