/**
 * Central design tokens + layout metrics for ElectroPuzzle.
 * Milestone 1: game shell. Keeps magic numbers out of scenes.
 */

export const GAME_WIDTH = 720;
export const GAME_HEIGHT = 1280;

/** Minimum touch target in *game units* (≈44 CSS px at 0.5 render scale). */
export const MIN_TOUCH_SIZE = 88;

export const FONT_FAMILY =
  "'Segoe UI', system-ui, -apple-system, Roboto, Inter, 'Helvetica Neue', Arial, sans-serif";

export const COLORS = {
  bgDeep: 0x050914,
  bgPanel: 0x0a1428,
  glassFill: 0x0e1e3a,
  glassFillLight: 0x14294d,
  glassBorder: 0x1e3a5f,
  cyan: 0x22d3ee,
  electricBlue: 0x3b82f6,
  neonGreen: 0x4ade80,
  amber: 0xfbbf24,
  danger: 0xfb7185,
  textPrimary: '#eaf6ff',
  textMuted: '#8aa0b8',
  textDim: '#5b7190'
} as const;

export const CSS_COLORS = {
  cyan: '#22d3ee',
  electricBlue: '#3b82f6',
  neonGreen: '#4ade80',
  amber: '#fbbf24',
  textPrimary: '#eaf6ff',
  textMuted: '#8aa0b8'
} as const;

export const SCENE_KEYS = {
  Boot: 'BootScene',
  MainMenu: 'MainMenuScene',
  LevelSelect: 'LevelSelectScene',
  Game: 'GameScene',
  Result: 'ResultScene'
} as const;

export const STORAGE_KEYS = {
  progress: 'electropuzzle.progress.v1',
  settings: 'electropuzzle.settings.v1'
} as const;

/** Vertical layout slots for the 720×1280 portrait shell. */
export const LAYOUT = {
  pad: 32,
  topBarY: 24,
  topBarH: 148,
  circuitY: 196,
  circuitH: 560,
  trayY: 780,
  trayH: 220,
  bottomY: 1024,
  bottomH: 232
} as const;

export const TOTAL_LEVEL_SLOTS = 20;
