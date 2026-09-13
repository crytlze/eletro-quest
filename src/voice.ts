import { getSettings } from './util';

// Suara Pak Volt — text-to-speech bawaan browser (offline di kebanyakan HP).
// Nonaktif via Pengaturan → Suara / Suara Pak Volt.

// Catatan: pola regex DIBANGUN via string ASCII (bukan literal emoji),
// karena literal emoji di dalam kelas regex mengacaukan pemindai TS.
const EMOJI_SRC =
  '\\u25C0\\u25B6\\u2039\\u203A\\u2606\\u2605\\u26A1\\u269B\\u2713\\u2717' +
  '\\u{1F300}-\\u{1FAFF}\\u{2600}-\\u{26FF}\\u{2700}-\\u{27BF}\\u{2B00}-\\u{2BFF}' +
  '\\u0300-\\u036F\\u1DC0-\\u1DFF\\uFE0F\\u200D';

const SUBS: [RegExp, string][] = [
  [new RegExp('[' + EMOJI_SRC + ']', 'gu'), ''],
  [new RegExp('\\u2082', 'g'), '2'],
  [new RegExp('\\u2083', 'g'), '3'],
  [new RegExp('\\u1D40', 'g'), ' transpose'],
  [new RegExp('\\u207B\\u00B9', 'g'), ' invers'],
  [/×/g, ' kali '],
  [/√/g, 'akar '],
  [/→/g, ' menjadi '],
  [/−/g, ' kurang '],
  [/≈/g, ' sekitar '],
  [/≠/g, ' tidak sama dengan '],
  [/≤/g, ' kurang dari '],
  [/≥/g, ' lebih dari '],
  [/°/g, ' derajat '],
  [/Ω/g, ' ohm '],
  [/µ/g, ' mikro '],
  [/φ/g, ' phi '],
  [/π/g, ' pi '],
  [/·/g, ' '],
  [/ {2,}/g, ' '],
];

function cleanSpoken(s: string): string {
  let out = s;
  for (const sub of SUBS) out = out.replace(sub[0], sub[1]);
  return out.trim().slice(0, 400);
}

export function speak(text: string): void {
  try {
    const s = getSettings();
    if (!s.sound || !s.voice) return;
    const synth = window.speechSynthesis;
    if (synth === undefined || synth === null) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(cleanSpoken(text));
    u.lang = 'id-ID';
    u.rate = 1.0;
    u.pitch = 1.1;
    synth.speak(u);
  } catch {
    /* abaikan */
  }
}

export function stopVoice(): void {
  try {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  } catch {
    /* abaikan */
  }
}
