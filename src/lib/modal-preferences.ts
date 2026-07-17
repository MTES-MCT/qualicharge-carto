export const MODAL_DISMISSAL_KEYS = {
  launchInfo: "qualicharge:modal:launch-info:dismissed",
  pricing: "qualicharge:modal:pricing:dismissed",
} as const;

type ModalPreferenceStorage = Pick<Storage, "getItem" | "setItem">;

function getBrowserStorage(): ModalPreferenceStorage | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function isModalDismissed(
  key: (typeof MODAL_DISMISSAL_KEYS)[keyof typeof MODAL_DISMISSAL_KEYS],
  storage: ModalPreferenceStorage | null = getBrowserStorage()
) {
  if (!storage) {
    return false;
  }

  try {
    return storage.getItem(key) === "true";
  } catch {
    return false;
  }
}

export function dismissModal(
  key: (typeof MODAL_DISMISSAL_KEYS)[keyof typeof MODAL_DISMISSAL_KEYS],
  storage: ModalPreferenceStorage | null = getBrowserStorage()
) {
  if (!storage) {
    return;
  }

  try {
    storage.setItem(key, "true");
  } catch {
    // The modal remains usable when storage is unavailable or full.
  }
}
