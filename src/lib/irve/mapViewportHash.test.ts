import { describe, expect, it } from "vitest";

import {
  formatMapViewportHash,
  parseMapViewportHash,
} from "./mapViewportHash";

describe("map viewport hash", () => {
  it("parses latitude, longitude and zoom from the hash", () => {
    expect(parseMapViewportHash("#lat=48.8566&lng=2.3522&z=12")).toEqual({
      center: [48.8566, 2.3522],
      zoom: 12,
    });
  });

  it("accepts zoom as an alias for z", () => {
    expect(parseMapViewportHash("latitude=43.2965&longitude=5.3698&zoom=10")).toEqual({
      center: [43.2965, 5.3698],
      zoom: 10,
    });
  });

  it("rejects incomplete or out-of-range hashes", () => {
    expect(parseMapViewportHash("#lat=48.8566&lng=2.3522")).toBeNull();
    expect(parseMapViewportHash("#lat=120&lng=2.3522&z=12")).toBeNull();
    expect(parseMapViewportHash("#lat=48.8566&lng=220&z=12")).toBeNull();
    expect(parseMapViewportHash("#lat=48.8566&lng=2.3522&z=30")).toBeNull();
  });

  it("formats the hash with stable precision", () => {
    expect(
      formatMapViewportHash({
        center: [48.8566123, 2.3522456],
        zoom: 12.5,
      })
    ).toBe("#lat=48.85661&lng=2.35225&z=12.5");
  });
});
