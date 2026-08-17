import { persist } from "zustand/middleware";
import type { SchemaProject } from "../domain";

const STORAGE_KEY = "surfdb-schema-v1";

export interface PersistedSchema {
  project: SchemaProject;
}

export function loadPersistedProject(): SchemaProject | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: { project?: SchemaProject } };
    return parsed.state?.project ?? null;
  } catch {
    return null;
  }
}

export function clearPersistedProject(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export const PERSIST_OPTIONS = {
  name: STORAGE_KEY,
  partialize: (state: PersistedSchema) => ({ project: state.project }),
} as const;

export { persist };
