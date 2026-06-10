type CsvRecord = Record<string, string>;

function createCsvParser() {
  let headers: string[] | null = null;
  let row: string[] = [];
  let field = "";
  let quoted = false;
  let pendingQuote = false;
  let skipNextLf = false;

  function finishField() {
    row.push(field);
    field = "";
  }

  function finishRow(): CsvRecord | null {
    if (row.length === 0 && field === "") {
      return null;
    }

    finishField();

    if (headers == null) {
      headers = row;
      row = [];
      return null;
    }

    const record = Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""]));
    row = [];

    return record;
  }

  function processChar(char: string): CsvRecord | null {
    if (skipNextLf) {
      skipNextLf = false;
      if (char === "\n") {
        return null;
      }
    }

    if (pendingQuote) {
      pendingQuote = false;
      if (char === '"') {
        field += '"';
        return null;
      }

      quoted = false;
      return processChar(char);
    }

    if (quoted) {
      if (char === '"') {
        pendingQuote = true;
      } else {
        field += char;
      }

      return null;
    }

    if (char === '"' && field === "") {
      quoted = true;
      return null;
    }

    if (char === ",") {
      finishField();
      return null;
    }

    if (char === "\n") {
      return finishRow();
    }

    if (char === "\r") {
      skipNextLf = true;
      return finishRow();
    }

    field += char;
    return null;
  }

  return {
    write(text: string) {
      const records: CsvRecord[] = [];

      for (const char of text) {
        const record = processChar(char);
        if (record) {
          records.push(record);
        }
      }

      return records;
    },
    end() {
      if (pendingQuote) {
        pendingQuote = false;
        quoted = false;
      }

      if (quoted) {
        throw new Error("Invalid CSV: unterminated quoted field");
      }

      const record = finishRow();
      return record ? [record] : [];
    },
  };
}

export function parseCsvRecords(text: string) {
  const parser = createCsvParser();
  return [...parser.write(text), ...parser.end()];
}

export async function* parseCsvRecordStream(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  const parser = createCsvParser();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      for (const record of parser.write(decoder.decode(value, { stream: true }))) {
        yield record;
      }
    }

    for (const record of parser.write(decoder.decode())) {
      yield record;
    }

    for (const record of parser.end()) {
      yield record;
    }
  } finally {
    reader.releaseLock();
  }
}
