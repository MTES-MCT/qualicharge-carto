import { describe, expect, it, vi } from "vitest";

import { dismissModal, isModalDismissed, MODAL_DISMISSAL_KEYS } from "./modal-preferences";

describe("modal preferences", () => {
  it("recognizes a dismissed modal", () => {
    const storage = {
      getItem: vi.fn(() => "true"),
      setItem: vi.fn(),
    };

    expect(isModalDismissed(MODAL_DISMISSAL_KEYS.launchInfo, storage)).toBe(true);
    expect(storage.getItem).toHaveBeenCalledWith(MODAL_DISMISSAL_KEYS.launchInfo);
  });

  it("persists the dismissal", () => {
    const storage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
    };

    dismissModal(MODAL_DISMISSAL_KEYS.pricing, storage);

    expect(storage.setItem).toHaveBeenCalledWith(MODAL_DISMISSAL_KEYS.pricing, "true");
  });

  it("keeps the modal available when storage cannot be read", () => {
    const storage = {
      getItem: vi.fn(() => {
        throw new Error("Storage unavailable");
      }),
      setItem: vi.fn(),
    };

    expect(isModalDismissed(MODAL_DISMISSAL_KEYS.launchInfo, storage)).toBe(false);
  });
});
