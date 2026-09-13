import { LEVELS, getLevelDefinition, type LevelDefinition } from '../data/levels';
import { STORAGE_KEYS } from '../utils/constants';

/**
 * Tracks unlocks + completions. Local-only (no backend, no login).
 * Milestone 1: minimal but real — LevelSelect + GameScene already consume it.
 */
export class LevelManager {
  private completed = new Set<number>();

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.progress);
      if (raw === null || raw === '') return;
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        for (const v of parsed) {
          if (typeof v === 'number' && Number.isInteger(v)) this.completed.add(v);
        }
      }
    } catch {
      // Corrupt save → start fresh. Never crash the shell over progress data.
      this.completed.clear();
    }
  }

  private save(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.progress, JSON.stringify([...this.completed]));
    } catch {
      // Storage full/blocked (private mode) — game still works, just not persisted.
    }
  }

  getLevels(): LevelDefinition[] {
    return LEVELS;
  }

  getLevel(id: number): LevelDefinition | undefined {
    return getLevelDefinition(id);
  }

  isCompleted(id: number): boolean {
    return this.completed.has(id);
  }

  /** Sequential unlock: level 1 open, next opens after previous completes. */
  isUnlocked(id: number): boolean {
    if (id <= 1) return true;
    return this.completed.has(id - 1);
  }

  completeLevel(id: number): void {
    this.completed.add(id);
    this.save();
  }

  completedCount(): number {
    return this.completed.size;
  }
}

export const levelManager = new LevelManager();
