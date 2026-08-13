import { describe, expect, it } from "vitest";

import { getIRVESourceLoader } from "./index";

describe("getIRVESourceLoader", () => {
  it.each(["opendata", "datagouv"] as const)("returns the %s loader", (source) => {
    expect(getIRVESourceLoader(source).source).toBe(source);
  });
});
