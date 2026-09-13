import Phaser from 'phaser';

// Re-ekspor suara agar scene cukup import dari util.
export { speak, stopVoice } from './voice';

const LEGACY_KEY = 'electroquest_stars_v1';
const starKey = (course: string): string => `electroquest_stars_${course}`;

function readStarsRaw(key: string): Record<number, number> {
  try {
    return JSON.parse(localStorage.getItem(key) || '{}') as Record<number, number>;
  } catch {
    return {};
  }
}

export function getStars(course = 'tde'): Record<number, number> {
  const s = readStarsRaw(starKey(course));
  if (course === 'tde' && Object.keys(s).length === 0) {
    const leg = readStarsRaw(LEGACY_KEY);
    if (Object.keys(leg).length > 0) {
      localStorage.setItem(starKey(course), JSON.stringify(leg));
      return leg;
    }
  }
  return s;
}

export function setStar(course: string, levelId: number, star: number): void {
  try {
    const s = getStars(course);
    s[levelId] = Math.max(s[levelId] || 0, star);
    localStorage.setItem(starKey(course), JSON.stringify(s));
  } catch {
    /* mode privat: progres sesi ini saja */
  }
}

export function clearStars(): void {
  try {
    for (const k of [LEGACY_KEY, starKey('tde'), starKey('alj'), starKey('stat'), starKey('rl'), starKey('elka'), starKey('digi'), starKey('prog'), starKey('atom'), starKey('listrik'), starKey('aljP1'), starKey('aljP2'), starKey('aljP3'), starKey('aljP4'), starKey('aljP5'), starKey('aljP7')]) {
      localStorage.removeItem(k);
    }
  } catch {
    /* abaikan */
  }
}

const NAME_KEY = 'electroquest_name';
let nameAsked = false;

export function playerName(): string | null {
  try {
    return localStorage.getItem(NAME_KEY) || null;
  } catch {
    return null;
  }
}

/** Minta nama sekali per sesi (buat papan peringkat kelas). */
export function askName(): string | null {
  if (nameAsked) return playerName();
  return renamePlayer();
}

export function renamePlayer(): string | null {
  nameAsked = true;
  try {
    const v = window.prompt('Tulis namamu buat papan peringkat kelas:', playerName() ?? '');
    if (v !== null && v.trim() !== '') {
      localStorage.setItem(NAME_KEY, v.trim().slice(0, 16));
    }
  } catch {
    /* abaikan */
  }
  return playerName();
}

/** Kirim skor ke server kelas (kalau ada). Gagal = diam (main offline). */
export function submitScore(course: string, level: number, stars: number): void {
  try {
    const sess = getSession();
    const name = (sess !== null && sess.name !== '') ? sess.name : askName();
    if (name === null || name === '') return;
    void fetch('api/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, course, level, stars }),
    }).catch(() => undefined);
  } catch {
    /* bukan server kelas — abaikan */
  }
}

const REVIEW_KEY = 'electroquest_reviews_outbox';

export interface PendingReview {
  token: string;
  rating: number;
  text: string;
  at: number;
}

function readOutbox(): PendingReview[] {
  try {
    const r = JSON.parse(localStorage.getItem(REVIEW_KEY) || '[]') as PendingReview[];
    return Array.isArray(r) ? r : [];
  } catch {
    return [];
  }
}

/** Coba kirim antrean ulasan yang tersimpan di HP. */
export async function flushReviews(): Promise<void> {
  const box = readOutbox();
  if (box.length === 0) return;
  const rest: PendingReview[] = [];
  for (const v of box) {
    if (typeof v.token !== 'string' || v.token === '') continue;
    try {
      const r = await fetch('api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(v),
      });
      if (r.status === 401) continue; // token mati, buang
      if (!r.ok) rest.push(v);
    } catch {
      rest.push(v);
    }
  }
  try {
    localStorage.setItem(REVIEW_KEY, JSON.stringify(rest));
  } catch {
    /* abaikan */
  }
}

export async function reviewStats(): Promise<{ count: number; avg: string } | null> {
  try {
    const r = await fetch('api/reviews', { cache: 'no-store' });
    if (!r.ok) return null;
    return (await r.json()) as { count: number; avg: string };
  } catch {
    return null;
  }
}

// ---------- Pelacak kelemahan (buat Latihan Kelemahan) ----------

const WEAK_KEY = 'electroquest_weak_v1';

export interface WeakStat {
  miss: number;
  ok: number;
}

function readWeak(): Record<string, WeakStat> {
  try {
    const r = JSON.parse(localStorage.getItem(WEAK_KEY) || '{}') as Record<string, WeakStat>;
    return r !== null && typeof r === 'object' ? r : {};
  } catch {
    return {};
  }
}

function writeWeak(s: Record<string, WeakStat>): void {
  try {
    const keys = Object.keys(s).slice(-300);
    const slim: Record<string, WeakStat> = {};
    for (const k of keys) slim[k] = s[k];
    localStorage.setItem(WEAK_KEY, JSON.stringify(slim));
  } catch {
    /* abaikan */
  }
}

/** Kunci soal: "topik:level:nomor". */
export function weakKey(topic: string, level: number, qi: number): string {
  return `${topic}:${level}:${qi}`;
}

export function recordMistake(key: string): void {
  const s = readWeak();
  const cur = s[key] ?? { miss: 0, ok: 0 };
  cur.miss += 1;
  s[key] = cur;
  writeWeak(s);
}

export function recordOk(key: string): void {
  const s = readWeak();
  const cur = s[key] ?? { miss: 0, ok: 0 };
  cur.ok += 1;
  s[key] = cur;
  writeWeak(s);
}

export interface WeakItem {
  key: string;
  miss: number;
  ok: number;
}

/** Daftar soal bermasalah (salah > benar), terurut paling parah dulu. */
export function weakList(): WeakItem[] {
  const s = readWeak();
  return Object.keys(s)
    .map((key) => ({ key, miss: s[key].miss, ok: s[key].ok }))
    .filter((v) => v.miss > v.ok)
    .sort((a, b) => b.miss - a.miss || b.miss / Math.max(1, b.ok) - a.miss / Math.max(1, a.ok));
}

/** Jumlah soal yang perlu latihan. */
export function weakCount(): number {
  return weakList().length;
}

// ---------- Akun murid (buat review) ----------

const AUTH_KEY = 'electroquest_auth';

export interface Session {
  name: string;
  kelas: string;
  token: string;
}

export function getSession(): Session | null {
  try {
    const r = JSON.parse(localStorage.getItem(AUTH_KEY) || 'null') as Session | null;
    if (r !== null && typeof r.token === 'string' && typeof r.name === 'string') return r;
    return null;
  } catch {
    return null;
  }
}

function saveSession(s: Session): void {
  try {
    localStorage.setItem(AUTH_KEY, JSON.stringify(s));
  } catch {
    /* abaikan */
  }
}

export function logoutSession(): void {
  try {
    localStorage.removeItem(AUTH_KEY);
  } catch {
    /* abaikan */
  }
}

export interface AuthResult {
  ok: boolean;
  err: string;
}

export async function apiDaftar(name: string, kelas: string, pass: string): Promise<AuthResult> {
  try {
    const r = await fetch('api/daftar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, kelas, pass }),
    });
    const j = (await r.json()) as { ok: boolean; token?: string; name?: string; kelas?: string; err?: string };
    if (r.ok && j.ok && typeof j.token === 'string') {
      saveSession({ name: j.name ?? name, kelas: j.kelas ?? kelas, token: j.token });
      return { ok: true, err: '' };
    }
    return { ok: false, err: typeof j.err === 'string' && j.err !== '' ? j.err : 'Gagal daftar.' };
  } catch {
    return { ok: false, err: 'Tidak konek ke server kelas.' };
  }
}

export async function apiMasuk(name: string, pass: string): Promise<AuthResult> {
  try {
    const r = await fetch('api/masuk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, pass }),
    });
    const j = (await r.json()) as { ok: boolean; token?: string; name?: string; kelas?: string; err?: string };
    if (r.ok && j.ok && typeof j.token === 'string') {
      saveSession({ name: j.name ?? name, kelas: j.kelas ?? '', token: j.token });
      return { ok: true, err: '' };
    }
    return { ok: false, err: typeof j.err === 'string' && j.err !== '' ? j.err : 'Gagal masuk.' };
  } catch {
    return { ok: false, err: 'Tidak konek ke server kelas.' };
  }
}

/** Kirim ulasan pakai akun. 'ok' | 'offline' | 'auth' (harus daftar/masuk). */
export async function submitReview(rating: number, text: string): Promise<'ok' | 'offline' | 'auth'> {
  const sess = getSession();
  if (sess === null) return 'auth';
  try {
    const r = await fetch('api/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: sess.token, rating, text }),
    });
    if (r.ok) {
      void flushReviews();
      return 'ok';
    }
    if (r.status === 401) {
      logoutSession();
      return 'auth';
    }
  } catch {
    /* offline */
  }
  try {
    const box = readOutbox();
    box.push({ token: sess.token, rating, text, at: Date.now() });
    localStorage.setItem(REVIEW_KEY, JSON.stringify(box.slice(-20)));
  } catch {
    /* abaikan */
  }
  return 'offline';
}

const SET_KEY = 'electroquest_settings_v1';

export interface Settings {
  sound: boolean;
  shake: boolean;
  theme: string;
  music: boolean;
  voice: boolean;
}

export function getSettings(): Settings {
  try {
    const raw = JSON.parse(localStorage.getItem(SET_KEY) || '{}') as Partial<Settings>;
    return {
      sound: raw.sound ?? true,
      shake: raw.shake ?? true,
      theme: raw.theme ?? 'neon',
      music: raw.music ?? true,
      voice: raw.voice ?? true,
    };
  } catch {
    return { sound: true, shake: true, theme: 'neon', music: true, voice: true };
  }
}

/** Getar HP (kalau ada). Ikut setting Getar. */
export function vibrate(pattern: number | number[]): void {
  if (!getSettings().shake) return;
  try {
    const nav = navigator as Navigator & { vibrate?: (p: number | number[]) => boolean };
    if (typeof nav.vibrate === 'function') nav.vibrate(pattern);
  } catch {
    /* abaikan */
  }
}

export function setSettings(s: Settings): void {
  try {
    localStorage.setItem(SET_KEY, JSON.stringify(s));
  } catch {
    /* mode privat: abaikan */
  }
}

let actx: AudioContext | null = null;

function ac(): AudioContext | null {
  try {
    if (actx === null) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      actx = new AC();
    }
    if (actx.state === 'suspended') void actx.resume();
    return actx;
  } catch {
    return null;
  }
}

export function beep(freq = 440, dur = 0.12, type: OscillatorType = 'sine', vol = 0.15): void {
  if (!getSettings().sound) return;
  const c = ac();
  if (c === null) return;
  try {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.value = vol;
    o.connect(g);
    g.connect(c.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    o.stop(c.currentTime + dur);
  } catch {
    /* audio opsional */
  }
}

function noiseBurst(dur: number, vol: number): void {
  if (!getSettings().sound) return;
  try {
    const c = ac();
    if (c === null) return;
    const len = Math.max(1, Math.floor(c.sampleRate * dur));
    const buf = c.createBuffer(1, len, c.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource();
    src.buffer = buf;
    const f = c.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 800;
    const g = c.createGain();
    g.gain.value = vol;
    src.connect(f);
    f.connect(g);
    g.connect(c.destination);
    src.start();
  } catch {
    /* abaikan */
  }
}

/** Koin bintang: nada naik ceria. */
export function sfxStar(): void {
  vibrate([70, 40, 70]);
  beep(880, 0.1, 'sine', 0.12);
  setTimeout(() => beep(1174, 0.14, 'sine', 0.12), 90);
  setTimeout(() => beep(1568, 0.2, 'sine', 0.1), 180);
}

/** Ledakan fuse: dentum + desis. */
export function sfxBoom(): void {
  vibrate(220);
  beep(70, 0.3, 'sawtooth', 0.16);
  noiseBurst(0.35, 0.18);
}

export function sfxClick(): void {
  beep(660, 0.07, 'square', 0.06);
}
export function sfxPower(): void {
  beep(220, 0.12, 'sawtooth', 0.08);
  setTimeout(() => beep(440, 0.15, 'sine', 0.1), 90);
}
export function sfxWin(): void {
  [523, 659, 784].forEach((f, i) => setTimeout(() => beep(f, 0.18, 'sine', 0.12), i * 120));
}
export function sfxFail(): void {
  vibrate(120);
  beep(160, 0.25, 'sawtooth', 0.1);
}

/** Shortcut keyboard (PC) yang otomatis dibersihkan saat scene mati. */
export function bindKeys(scene: Phaser.Scene, map: Record<string, () => void>): void {
  const kb = scene.input.keyboard;
  if (!kb) return;
  const cleanups: Array<() => void> = [];
  for (const key of Object.keys(map)) {
    const cb = map[key];
    const handler = (): void => {
      cb();
    };
    kb.on(`keydown-${key}`, handler);
    cleanups.push(() => kb.off(`keydown-${key}`, handler));
  }
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    for (const fn of cleanups) fn();
  });
}

export function makeButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  opts: { bg?: number; fg?: string; size?: number } = {}
): { c: Phaser.GameObjects.Container; setLabel(s: string): void } {
  const bg = scene.add.rectangle(0, 0, w, h, opts.bg ?? 0x22d3ee, 1).setOrigin(0.5);
  bg.setStrokeStyle(2, 0x0e7490, 1);
  const tx = scene.add
    .text(0, 0, label, {
      fontSize: `${opts.size ?? 28}px`,
      color: opts.fg ?? '#04121a',
      fontStyle: 'bold',
      align: 'center',
    })
    .setOrigin(0.5);
  const c = scene.add.container(x, y, [bg, tx]);
  c.setSize(w, h);
  c.setInteractive({ useHandCursor: true });
  return {
    c,
    setLabel(s: string) {
      tx.setText(s);
    },
  };
}
