import type { LearningItemView } from "@/server/learning/learning.service";

import type { SessionResultRecord } from "../types";

export type SavedSessionData = {
  items: LearningItemView[];
  totalItems: number;
  results: SessionResultRecord[];
  updatedAt: number;
};

export function saveProgressToStorage(
  storageKey: string,
  remaining: LearningItemView[],
  totalItems: number,
  currentResults: SessionResultRecord[],
) {
  if (typeof window === "undefined") return;
  try {
    if (remaining.length === 0) {
      localStorage.removeItem(storageKey);
    } else {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          items: remaining,
          totalItems,
          results: currentResults,
          updatedAt: Date.now(),
        }),
      );
    }
  } catch {
    // Ignore storage error
  }
}

export function loadProgressFromStorage(storageKey: string): SavedSessionData | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return null;
    const parsed = JSON.parse(saved) as SavedSessionData;
    if (
      parsed.items &&
      parsed.items.length > 0 &&
      parsed.totalItems > 0 &&
      Date.now() - parsed.updatedAt < 24 * 60 * 60 * 1000
    ) {
      return parsed;
    }
  } catch {
    // Ignore storage read error
  }
  return null;
}

export function clearProgressStorage(storageKey: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(storageKey);
  } catch {
    // Ignore storage error
  }
}
