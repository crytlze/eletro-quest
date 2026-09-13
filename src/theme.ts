import { getSettings, setSettings } from './util';

export type ThemeName = 'neon' | 'terang' | 'klasik' | 'modern' | 'minimal';

export interface ThemeMeta {
  id: ThemeName;
  icon: string;
  name: string;
}

export const THEME_ORDER: ThemeMeta[] = [
  { id: 'neon', icon: '◐', name: 'Neon Malam' },
  { id: 'terang', icon: '☀', name: 'Terang' },
  { id: 'klasik', icon: '●', name: 'Klasik' },
  { id: 'modern', icon: '◆', name: 'Modern' },
  { id: 'minimal', icon: '□', name: 'Minimalis' },
];

export interface Palette {
  bgTop: number;
  bgBot: number;
  grid: number;
  gridAlpha: number;
  dot: number;
  line: number;
  dots: number;
  page: 'dark' | 'light';
  ink: string; // teks utama di atas background
  dim: string; // teks sekunder di atas background
  title: string; // judul besar glow
  accentTx: string; // link & aksen teks
  good: string; // teks sukses/benar di atas background
  bad: string; // teks gagal/salah di atas background
  warn: string; // teks peringatan/hint di atas background
}

export const THEMES: Record<ThemeName, Palette> = {
  neon: {
    bgTop: 0x0e2a52,
    bgBot: 0x060d1d,
    grid: 0x3b82f6,
    gridAlpha: 0.13,
    dot: 0xfbbf24,
    line: 0x22d3ee,
    dots: 24,
    page: 'dark',
    ink: '#e2e8f0',
    dim: '#94a3b8',
    title: '#fcd34d',
    accentTx: '#67e8f9',
    good: '#4ade80',
    bad: '#f87171',
    warn: '#fde68a',
  },
  terang: {    bgTop: 0xe0f2fe,
    bgBot: 0xf1f5f9,
    grid: 0x0284c7,
    gridAlpha: 0.13,
    dot: 0x0284c7,
    line: 0x0284c7,
    dots: 24,
    page: 'light',
    ink: '#0f172a',
    dim: '#475569',
    title: '#0c4a6e',
    accentTx: '#0e7490',
    good: '#15803d',
    bad: '#dc2626',
    warn: '#92400e',
  },
  klasik: {
    bgTop: 0x0a1f14,
    bgBot: 0x020604,
    grid: 0x22c55e,
    gridAlpha: 0.14,
    dot: 0x4ade80,
    line: 0x4ade80,
    dots: 18,
    page: 'dark',
    ink: '#e7f6ec',
    dim: '#7fa88f',
    title: '#fbbf24',
    accentTx: '#6ee7b7',
    good: '#4ade80',
    bad: '#f87171',
    warn: '#fde68a',
  },
  modern: {
    bgTop: 0x2e1065,
    bgBot: 0x0b0620,
    grid: 0xa78bfa,
    gridAlpha: 0.15,
    dot: 0xf0abfc,
    line: 0xc084fc,
    dots: 30,
    page: 'dark',
    ink: '#f3e8ff',
    dim: '#b8a6e8',
    title: '#f0abfc',
    accentTx: '#c4b5fd',
    good: '#4ade80',
    bad: '#f87171',
    warn: '#fde68a',
  },
  minimal: {
    bgTop: 0xffffff,
    bgBot: 0xeef1f5,
    grid: 0x94a3b8,
    gridAlpha: 0.1,
    dot: 0x64748b,
    line: 0x2563eb,
    dots: 10,
    page: 'light',
    ink: '#1e293b',
    dim: '#64748b',
    title: '#1d4ed8',
    accentTx: '#1d4ed8',
    good: '#15803d',
    bad: '#dc2626',
    warn: '#92400e',
  },
};

export function getTheme(): ThemeName {
  const raw = getSettings().theme;
  if (raw === 'dark') return 'neon'; // migrasi simpanan lama
  if (raw === 'light') return 'terang';
  const hit = THEME_ORDER.find((t) => t.id === raw);
  return hit !== undefined ? hit.id : 'neon';
}

export function applyThemeBody(t: ThemeName): void {
  try {
    document.body.classList.toggle('light', THEMES[t].page === 'light');
  } catch {
    /* non-DOM (tes) */
  }
}

export function setTheme(t: ThemeName): void {
  const s = getSettings();
  s.theme = t;
  setSettings(s);
  applyThemeBody(t);
}

export function nextTheme(): ThemeName {
  const ids = THEME_ORDER.map((t) => t.id);
  return ids[(ids.indexOf(getTheme()) + 1) % ids.length];
}

export function pal(): Palette {
  return THEMES[getTheme()];
}
