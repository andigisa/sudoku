import Dexie, { type Table } from "dexie";
import type { SerializedGameState } from "@sudoku/domain";

export interface ActiveGameRecord {
  id: "current";
  state: SerializedGameState;
  updatedAt: string;
}

export interface SettingRecord {
  key: string;
  value: string;
}

export interface CompletedGameRecord {
  id?: number;
  puzzleId: string;
  difficulty: string;
  elapsedMs: number;
  completedAt: string;
}

export interface SyncMetaRecord {
  key: string;
  value: string;
}

class SudokuDatabase extends Dexie {
  activeGame!: Table<ActiveGameRecord, string>;
  settings!: Table<SettingRecord, string>;
  completedGames!: Table<CompletedGameRecord, number>;
  syncMeta!: Table<SyncMetaRecord, string>;

  constructor() {
    super("sudoku-platform");
    this.version(1).stores({
      activeGame: "id, updatedAt",
      settings: "key",
      completedGames: "++id, puzzleId, completedAt"
    });
    this.version(2).stores({
      activeGame: "id, updatedAt",
      settings: "key",
      completedGames: "++id, puzzleId, completedAt",
      syncMeta: "key"
    });
  }
}

export const db = new SudokuDatabase();

export async function loadActiveGame(): Promise<SerializedGameState | null> {
  const record = await db.activeGame.get("current");
  return record?.state ?? null;
}

export async function saveActiveGame(state: SerializedGameState): Promise<void> {
  await db.activeGame.put({
    id: "current",
    state,
    updatedAt: new Date().toISOString()
  });
}

export async function clearActiveGame(): Promise<void> {
  await db.activeGame.delete("current");
}

export async function saveSetting(key: string, value: string): Promise<void> {
  await db.settings.put({ key, value });
}

export async function loadSetting(key: string): Promise<string | null> {
  const record = await db.settings.get(key);
  return record?.value ?? null;
}

export async function appendCompletedGame(record: CompletedGameRecord): Promise<void> {
  await db.completedGames.add(record);
}

export async function listCompletedGames(limit = 8): Promise<CompletedGameRecord[]> {
  return db.completedGames.orderBy("completedAt").reverse().limit(limit).toArray();
}

export async function saveSyncVersion(version: number): Promise<void> {
  await db.syncMeta.put({ key: "syncVersion", value: String(version) });
}

export async function loadSyncVersion(): Promise<number> {
  const record = await db.syncMeta.get("syncVersion");
  return record ? Number(record.value) : 0;
}
