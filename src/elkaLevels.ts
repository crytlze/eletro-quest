// Model transistor NPN bias pembagi tegangan (aproksimasi praktis kuliah).
// Vb = Vcc*R2/(R1+R2); Ve = Vb-0.7; Ie = Ve/Re; Ic≈Ie; Vc = Vcc-Ic*Rc; Vce = Vc-Ve.

export interface BiasOpt {
  label: string;
  r: number; // ohm
}

export interface BiasSlot {
  id: string;
  options: BiasOpt[];
  def: number;
}

export interface BiasLevel {
  id: number;
  title: string;
  sub: string;
  briefing: string;
  hint: string;
  vcc: number;
  rc: number;
  re: number;
  r1fixed: number | null;
  r1slot: BiasSlot | null;
  r2fixed: number | null;
  r2slot: BiasSlot | null;
  tVmin: number;
  tVmax: number;
  tImin?: number | null;
  tImax?: number | null;
  targetLabel: string;
  prinsip: string;
  bedah: string[];
}

export interface BiasMeas {
  vb: number;
  ve: number;
  vc: number;
  ic: number; // mA
  vce: number;
  status: 'AKTIF' | 'JENUH' | 'CUTOFF' | 'HAMPIR-JENUH';
}

export function measureBias(vcc: number, rc: number, re: number, r1: number, r2: number): BiasMeas {
  const vb = (vcc * r2) / (r1 + r2);
  if (vb <= 0.7) return { vb, ve: 0, vc: vcc, ic: 0, vce: vcc, status: 'CUTOFF' };
  const ve = vb - 0.7;
  const ic = (ve / re) * 1000; // mA
  const vc = vcc - (ic / 1000) * rc;
  const vce = vc - ve;
  if (vc < ve) return { vb, ve, vc, ic, vce, status: 'JENUH' };
  if (vce < 1.0) return { vb, ve, vc, ic, vce, status: 'HAMPIR-JENUH' };
  return { vb, ve, vc, ic, vce, status: 'AKTIF' };
}

const K = 1000;

export const BIAS_LEVELS: BiasLevel[] = [
  {
    id: 1, title: 'Kenalan Transistor', sub: 'Titik kerja • Vce',
    briefing: 'Vcc 12V, Rc 1k, Re 1k. Atur R2 supaya Vce ≈ 5,4V (tengah-tengah, ayunan maksimal).',
    hint: 'Vb = 12·R2/(10k+R2). Butuh Vb ≈ 4V → R2 = 5k.',
    prinsip: 'Vb menentukan segalanya: Ie = (Vb−0,7)/Re.',
    bedah: [
      'Mau Vce ≈ 5,4V',
      'Vb = 12·5/15 = 4V → R2 = 5k',
      'Cek: Vce = 5,4V ✓',
    ],
    vcc: 12, rc: 1 * K, re: 1 * K,
    r1fixed: 10 * K, r1slot: null,
    r2fixed: null, r2slot: { id: 'R2', def: 0, options: [{ label: '2k', r: 2 * K }, { label: '5k', r: 5 * K }, { label: '10k', r: 10 * K }] },
    tVmin: 5.0, tVmax: 5.8, tImax: null,
    targetLabel: 'Target: Vce 5,0 – 5,8 V',
  },
  {
    id: 2, title: 'Bagi Tegangan', sub: 'R1 menentukan Vb',
    briefing: 'Vcc 12V, Rc 2k, Re 1k, R2 = 4k. Atur R1 supaya Vce ≈ 2,1V. Awas: R kekecilan bikin JENUH!',
    hint: 'Butuh Vb = 4V → R1 = 8k. R1 = 4k bikin Vc < Ve (jenuh!).',
    prinsip: 'R1 mengendalikan Vb dari atas.',
    bedah: [
      'Mau Vce ≈ 2,1V → Vb = 4V',
      'R1 = 8k memberi Vb pas',
      'R1 = 4k → Vc<Ve, JENUH! ✓ pelajaran',
    ],
    vcc: 12, rc: 2 * K, re: 1 * K,
    r1fixed: null, r1slot: { id: 'R1', def: 0, options: [{ label: '4k', r: 4 * K }, { label: '8k', r: 8 * K }, { label: '12k', r: 12 * K }] },
    r2fixed: 4 * K, r2slot: null,
    tVmin: 1.8, tVmax: 2.4, tImax: null,
    targetLabel: 'Target: Vce 1,8 – 2,4 V',
  },
  {
    id: 3, title: 'Target Arus', sub: 'Ic presisi',
    briefing: 'Vcc 10V, Rc 2k, Re 2k, R1 = 10k. Kejar Ic tepat ≈ 1,9 mA.',
    hint: 'Ic = (Vb−0,7)/Re. Butuh Vb ≈ 4,5V → R2 = 8,2k.',
    prinsip: 'Ic presisi datang dari Vb presisi.',
    bedah: [
      'Mau Ic = 1,9 mA → Vb ≈ 4,5V',
      'R2 = 8,2k memberi Vb pas',
      'Cek: Ic = 1,90 mA ✓',
    ],
    vcc: 10, rc: 2 * K, re: 2 * K,
    r1fixed: 10 * K, r1slot: null,
    r2fixed: null, r2slot: { id: 'R2', def: 0, options: [{ label: '4,7k', r: 4.7 * K }, { label: '8,2k', r: 8.2 * K }, { label: '15k', r: 15 * K }] },
    tVmin: 0, tVmax: 999, tImin: 1.8, tImax: 2.1,
    targetLabel: 'Target: Ic 1,8 – 2,1 mA',
  },
  {
    id: 4, title: 'Dua Slot', sub: 'R1 & R2 bebas',
    briefing: 'Vcc 12V, Rc 1k, Re 1k. Atur R1 DAN R2 supaya Vce 5,4 – 6,0V.',
    hint: 'Pasangan (10k, 4,7k) memberi Vb ≈ 3,8V → Vce ≈ 5,7V.',
    prinsip: 'Dua knob, satu target: coba kombinasi logis.',
    bedah: [
      'Target Vce ≈ 5,7V',
      '(10k, 4,7k) → Vb ≈ 3,8V',
      'Cek: Vce = 5,7V ✓',
    ],
    vcc: 12, rc: 1 * K, re: 1 * K,
    r1fixed: null, r1slot: { id: 'R1', def: 1, options: [{ label: '10k', r: 10 * K }, { label: '22k', r: 22 * K }] },
    r2fixed: null, r2slot: { id: 'R2', def: 0, options: [{ label: '2,2k', r: 2.2 * K }, { label: '4,7k', r: 4.7 * K }] },
    tVmin: 5.4, tVmax: 6.0, tImax: null,
    targetLabel: 'Target: Vce 5,4 – 6,0 V',
  },
  {
    id: 5, title: 'Hindari Saturasi', sub: 'Jenuh = gagal',
    briefing: 'Vcc 9V, Rc 1k, Re 1k, R1 = 10k. Kejar Vce 5,5 – 6,3V. R2 = 10k bikin Vce anjlok ke 1,4V!',
    hint: 'R2 = 3,3k → Vb ≈ 2,2V → Vce ≈ 5,9V. R2 besar → Vb besar → arus besar → jenuh.',
    prinsip: 'R2 besar → Vb besar → arus besar → JENUH.',
    bedah: [
      'R2 = 3,3k → Vce ≈ 5,9V ✓',
      'R2 = 10k → Vce anjlok 1,4V!',
      'Ingat: lawan dari TDE, besar ≠ aman',
    ],
    vcc: 9, rc: 1 * K, re: 1 * K,
    r1fixed: 10 * K, r1slot: null,
    r2fixed: null, r2slot: { id: 'R2', def: 2, options: [{ label: '2,2k', r: 2.2 * K }, { label: '3,3k', r: 3.3 * K }, { label: '10k', r: 10 * K }] },
    tVmin: 5.5, tVmax: 6.3, tImax: null,
    targetLabel: 'Target: Vce 5,5 – 6,3 V (jangan jenuh!)',
  },
  {
    id: 6, title: 'Q-Point Tengah', sub: 'Ayunan simetris',
    briefing: 'Vcc 12V. Titik kerja ideal di tengah: Vce ≈ ½Vcc supaya ayunan sinyal simetris.',
    hint: 'Butuh Vce ≈ 5,7V. R2 = 4,7k memberi Vb ≈ 3,8V. Pas!',
    prinsip: 'Q-point ideal di tengah: Vce ≈ ½Vcc.',
    bedah: [
      'Target ≈ 6V (½ dari 12V)',
      'R2 = 4,7k → Vb ≈ 3,8V',
      'Cek: Vce = 5,7V ✓ simetris!',
    ],
    vcc: 12, rc: 1 * K, re: 1 * K,
    r1fixed: 10 * K, r1slot: null,
    r2fixed: null, r2slot: { id: 'R2', def: 0, options: [{ label: '2,2k', r: 2.2 * K }, { label: '4,7k', r: 4.7 * K }, { label: '10k', r: 10 * K }] },
    tVmin: 5.4, tVmax: 6.0, tImax: null,
    targetLabel: 'Target: Vce 5,4 – 6,0 V',
  },
  {
    id: 7, title: 'Efisiensi Daya', sub: 'Vce pas + arus hemat',
    briefing: 'Vcc 12V, Rc 2k, Re 1k, R1 = 10k. Vce 4,8 – 5,6V DAN Ic ≤ 2,5 mA (hemat baterai!).',
    hint: 'R2 = 3,3k → Vce ≈ 5,2V, Ic ≈ 2,3 mA. Dua syarat sekaligus!',
    prinsip: 'Desain nyata: dua syarat sekaligus (Vce + hemat).',
    bedah: [
      'R2 = 3,3k → Vce ≈ 5,2V ✓',
      'Ic ≈ 2,3 mA ≤ 2,5 ✓',
      'Dua-duanya lolos, hemat pula!',
    ],
    vcc: 12, rc: 2 * K, re: 1 * K,
    r1fixed: 10 * K, r1slot: null,
    r2fixed: null, r2slot: { id: 'R2', def: 0, options: [{ label: '2,2k', r: 2.2 * K }, { label: '3,3k', r: 3.3 * K }, { label: '5,6k', r: 5.6 * K }] },
    tVmin: 4.8, tVmax: 5.6, tImax: 2.5,
    targetLabel: 'Target: Vce 4,8–5,6V & Ic ≤ 2,5 mA',
  },
  {
    id: 8, title: 'Ujian Akhir', sub: 'Presisi penuh',
    briefing: 'Vcc 15V, Rc 1k, Re 1k. Atur R1 & R2 supaya Vce tepat 8,8 – 9,2V. Presisi master!',
    hint: 'Butuh Vb ≈ 3,7V. Pasangan (10k, 3,3k) memberi Vce ≈ 9,0V.',
    prinsip: 'Presisi master: Vb dihitung, bukan ditebak.',
    bedah: [
      'Target Vce 8,8–9,2V → Vb ≈ 3,7V',
      '(10k, 3,3k) → Vb pas',
      'Cek: Vce = 9,0V ✓',
    ],
    vcc: 15, rc: 1 * K, re: 1 * K,
    r1fixed: null, r1slot: { id: 'R1', def: 1, options: [{ label: '10k', r: 10 * K }, { label: '15k', r: 15 * K }] },
    r2fixed: null, r2slot: { id: 'R2', def: 1, options: [{ label: '3,3k', r: 3.3 * K }, { label: '5,6k', r: 5.6 * K }] },
    tVmin: 8.8, tVmax: 9.2, tImax: null,
    targetLabel: 'Target: Vce 8,8 – 9,2 V',
  },
];
