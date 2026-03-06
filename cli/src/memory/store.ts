/**
 * Memory Store
 *
 * Aegis remembers things about the humans it works with — preferences,
 * communication style, common patterns — across projects and sessions.
 *
 * Memory is stored at ~/.aegis/memory.json and is private to Aegis.
 * Agents never see this. It's the COO's personal notes about working
 * with the CEO.
 *
 * Memory is actively pruned. Stale entries are deleted, never annotated.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

const AEGIS_DIR = path.join(os.homedir(), ".aegis");
const MEMORY_PATH = path.join(AEGIS_DIR, "memory.json");

const STALE_DAYS = 90; // Entries older than this without updates get pruned

export interface MemoryEntry {
  key: string;
  value: string;
  project?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MemoryStore {
  version: string;
  entries: MemoryEntry[];
}

function emptyStore(): MemoryStore {
  return {
    version: "0.1.0",
    entries: [],
  };
}

/**
 * Load memory from disk.
 */
export function loadMemory(): MemoryStore {
  try {
    if (fs.existsSync(MEMORY_PATH)) {
      const raw = JSON.parse(fs.readFileSync(MEMORY_PATH, "utf-8"));
      return raw as MemoryStore;
    }
  } catch {
    // Corrupted — start fresh
  }
  return emptyStore();
}

/**
 * Save memory to disk.
 */
export function saveMemory(store: MemoryStore): void {
  fs.mkdirSync(AEGIS_DIR, { recursive: true });
  fs.writeFileSync(MEMORY_PATH, JSON.stringify(store, null, 2), {
    mode: 0o600,
  });
}

/**
 * Add or update a memory entry.
 */
export function upsertMemory(
  store: MemoryStore,
  key: string,
  value: string,
  project?: string
): MemoryStore {
  const now = new Date().toISOString();
  const existing = store.entries.findIndex(
    (e) => e.key === key && e.project === project
  );

  if (existing >= 0) {
    store.entries[existing].value = value;
    store.entries[existing].updatedAt = now;
  } else {
    store.entries.push({
      key,
      value,
      project,
      createdAt: now,
      updatedAt: now,
    });
  }

  return store;
}

/**
 * Remove a memory entry by index.
 */
export function removeMemory(
  store: MemoryStore,
  index: number
): MemoryStore {
  if (index >= 0 && index < store.entries.length) {
    store.entries.splice(index, 1);
  }
  return store;
}

/**
 * Prune stale entries (older than STALE_DAYS without updates).
 */
export function pruneMemory(store: MemoryStore): MemoryStore {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - STALE_DAYS);
  const cutoffStr = cutoff.toISOString();

  store.entries = store.entries.filter((e) => e.updatedAt >= cutoffStr);
  return store;
}

/**
 * Get memory entries relevant to a specific project.
 * Returns both project-specific and global entries.
 */
export function getProjectMemory(
  store: MemoryStore,
  projectName: string
): Record<string, unknown> {
  const relevant = store.entries.filter(
    (e) => !e.project || e.project === projectName
  );

  if (relevant.length === 0) return {};

  const memory: Record<string, string> = {};
  for (const entry of relevant) {
    const scope = entry.project ? `[${entry.project}]` : "[global]";
    memory[`${scope} ${entry.key}`] = entry.value;
  }
  return memory;
}
