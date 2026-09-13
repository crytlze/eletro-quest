import { getSettings } from './util';

// Musik chiptune prosedural (tanpa file audio).
// Jalan di luar Phaser scene agar tidak putus saat ganti layar.
// Mulai otomatis setelah gestur pertama (aturan browser).

let ctx: AudioContext | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
let step = 0;
let nextT = 0;
let started = false;

const STEP = 0.215;
const BASS = [110, 0, 110, 0, 130.81, 0, 164.81, 0, 98, 0, 98, 0, 146.83, 0, 164.81, 0];
const LEAD = [440, 0, 523.25, 0, 587.33, 659.25, 0, 523.25, 392, 0, 440, 0, 523.25, 0, 392, 0];

function ac(): AudioContext | null {
  try {
    if (ctx === null) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(t: number, f: number, dur: number, type: OscillatorType, vol: number): void {
  const c = ctx;
  if (c === null) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = f;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function tick(): void {
  const c = ctx;
  if (c === null) return;
  const s = getSettings();
  if (!s.sound || !s.music) {
    nextT = Math.max(nextT, c.currentTime + 0.1);
    return;
  }
  while (nextT < c.currentTime + 0.35) {
    const b = BASS[step];
    const l = LEAD[step];
    if (b > 0) tone(nextT, b, STEP * 0.9, 'triangle', 0.055);
    if (l > 0) tone(nextT, l, STEP * 0.85, 'square', 0.02);
    nextT += STEP;
    step = (step + 1) % 16;
  }
}

/** Panggil sekali dari menu utama. Musik mulai setelah sentuhan/klik pertama. */
export function ensureMusic(): void {
  if (started) return;
  started = true;
  const kick = (): void => {
    const c = ac();
    if (c === null) return;
    if (timer === null) {
      nextT = c.currentTime + 0.1;
      timer = setInterval(tick, 110);
    } else if (c.state === 'suspended') {
      void c.resume();
    }
  };
  document.addEventListener('pointerdown', kick);
  document.addEventListener('keydown', kick);
}

export function setMusicEnabled(on: boolean): void {
  if (on && ctx !== null && ctx.state === 'suspended') void ctx.resume();
}
