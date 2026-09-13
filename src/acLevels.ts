// Model RLC seri + fasor (Rangkaian Listrik / AC).
// Z = sqrt(R² + (Xl−Xc)²), I = Vs/Z, φ = atan2(Xl−Xc, R).

export interface ACOpt {
  label: string;
  v: number; // F untuk C, H untuk L, Hz untuk f
}

export interface ACSlot {
  id: string;
  kind: 'C' | 'L' | 'f';
  options: ACOpt[];
  def: number;
}

export interface ACMeas {
  xl: number;
  xc: number;
  z: number;
  i: number;
  vr: number;
  vl: number;
  vc: number;
  phi: number; // derajat, + = induktif
  pf: number; // cos φ
  nature: 'RES' | 'IND' | 'CAP';
}

export interface ACLevel {
  id: number;
  title: string;
  sub: string;
  briefing: string;
  hint: string;
  vs: number;
  f: number | null; // null = jadi slot
  R: number;
  L: number | null; // Henry, null = jadi slot
  C: number | null; // Farad, null = jadi slot
  slots: ACSlot[];
  targetLabel: string;
  check: (m: ACMeas) => boolean;
  prinsip: string;
  bedah: string[];
}

export function measureAC(vs: number, f: number, R: number, L: number, C: number): ACMeas {
  const xl = 2 * Math.PI * f * L;
  const xc = 1 / (2 * Math.PI * f * C);
  const x = xl - xc;
  const z = Math.sqrt(R * R + x * x);
  const i = vs / z;
  const phi = (Math.atan2(x, R) * 180) / Math.PI;
  const pf = Math.cos(Math.atan2(x, R));
  const nature = Math.abs(x) < R * 0.08 ? 'RES' : x > 0 ? 'IND' : 'CAP';
  return { xl, xc, z, i, vr: i * R, vl: i * xl, vc: i * xc, phi, pf, nature };
}

const U = 1e-6;
const M = 1e-3;

export const AC_LEVELS: ACLevel[] = [
  {
    id: 1, title: 'Resonansi', sub: 'XL = XC • arus max',
    briefing: 'Vs 10V f 100Hz, R 10Ω, L 100mH. Pilih C supaya resonansi (XL = XC, arus maksimum!).',
    hint: 'XL = 2π·100·0,1 ≈ 63Ω. Butuh XC sama → C ≈ 25µF.',
    vs: 10, f: 100, R: 10, L: 100 * M, C: null,
    slots: [{ id: 'C', kind: 'C', def: 0, options: [{ label: '10µF', v: 10 * U }, { label: '25µF', v: 25 * U }, { label: '47µF', v: 47 * U }] }],
    targetLabel: 'Target: I total 0,9 – 1,1 A (maks!)',
    check: (m) => m.i >= 0.9 && m.i <= 1.1,
    prinsip: 'Resonansi seri: XL=XC → Z minimum (=R) → arus maksimum.',
    bedah: [
      'XL = 2π·100·0,1 ≈ 63Ω',
      'Butuh XC sama → C ≈ 25µF',
      'Cek: Z ≈ 10Ω, I ≈ 1A ✓',
    ],
  },
  {
    id: 2, title: 'Samakan Reaktansi', sub: 'Cari L yang pas',
    briefing: 'Vs 10V f 100Hz, R 20Ω, C 47µF. Pilih L supaya impedansi minimum (arus max).',
    hint: 'XC ≈ 34Ω. Butuh XL ≈ sama → L ≈ 60mH (XL ≈ 38Ω).',
    vs: 10, f: 100, R: 20, L: null, C: 47 * U,
    slots: [{ id: 'L', kind: 'L', def: 0, options: [{ label: '20mH', v: 20 * M }, { label: '60mH', v: 60 * M }, { label: '150mH', v: 150 * M }] }],
    targetLabel: 'Target: I total 0,45 – 0,55 A',
    check: (m) => m.i >= 0.45 && m.i <= 0.55,
    prinsip: 'Samakan reaktansi untuk impedansi minimum.',
    bedah: [
      'XC ≈ 34Ω (dari 47µF @100Hz)',
      'Butuh XL ≈ sama → L ≈ 60mH',
      'I ≈ 0,49A ✓ terbesar!',
    ],
  },
  {
    id: 3, title: 'Pengali Tegangan', sub: 'Resonansi seri • Vc besar',
    briefing: 'Vs 12V f 50Hz, R 15Ω, L 0,2H. Saat resonansi, Vc bisa JAUH lebih besar dari sumber! Buktikan.',
    hint: 'XL ≈ 63Ω. C = 47µF → XC ≈ 68Ω ≈ resonansi. Lihat Vc-nya!',
    vs: 12, f: 50, R: 15, L: 0.2, C: null,
    slots: [{ id: 'C', kind: 'C', def: 0, options: [{ label: '22µF', v: 22 * U }, { label: '47µF', v: 47 * U }, { label: '100µF', v: 100 * U }] }],
    targetLabel: 'Target: Vc 45 – 60 V (dari sumber 12V!)',
    check: (m) => m.vc >= 45 && m.vc <= 60,
    prinsip: 'Resonansi seri melipatgandakan tegangan (Q × Vs)!',
    bedah: [
      'XL ≈ 63Ω, C=47µF → XC ≈ 68Ω',
      'Hampir resonansi → arus besar',
      'Vc = I·XC ≈ 51V dari 12V! ✓',
    ],
  },
  {
    id: 4, title: 'Putar Frekuensi', sub: 'Knob osiloskop',
    briefing: 'Vs 10V, R 10Ω, L 100mH, C 47µF. Putar knob FREKUENSI sampai arus maksimum!',
    hint: 'f₀ = 1/(2π√LC) ≈ 73 Hz. Putar ke 73!',
    vs: 10, f: null, R: 10, L: 100 * M, C: 47 * U,
    slots: [{ id: 'f', kind: 'f', def: 0, options: [{ label: '50 Hz', v: 50 }, { label: '73 Hz', v: 73 }, { label: '120 Hz', v: 120 }] }],
    targetLabel: 'Target: I total 0,9 – 1,1 A',
    check: (m) => m.i >= 0.9 && m.i <= 1.1,
    prinsip: 'Frekuensi resonansi f₀ = 1/(2π√LC).',
    bedah: [
      'f₀ = 1/(2π√LC) ≈ 73 Hz',
      'Putar knob tepat ke 73',
      'I ≈ 1A ✓ resonansi!',
    ],
  },
  {
    id: 5, title: 'Denda PLN', sub: 'Faktor daya • kompensasi',
    briefing: 'Vs 20V f 50Hz, R 30Ω, L 0,3H. Pabrik kena denda kalau cos φ < 0,7. Pilih kapasitor kompensasi!',
    hint: 'XL ≈ 94Ω (sangat induktif). C makin besar → XC makin kecil → makin kompensasi. C = 47µF!',
    vs: 20, f: 50, R: 30, L: 0.3, C: null,
    slots: [{ id: 'C', kind: 'C', def: 0, options: [{ label: '10µF', v: 10 * U }, { label: '22µF', v: 22 * U }, { label: '47µF', v: 47 * U }] }],
    targetLabel: 'Target: cos φ ≥ 0,7',
    check: (m) => m.pf >= 0.7 && m.pf <= 1.0,
    prinsip: 'Kapasitor seri melawan sifat induktif → cos φ naik.',
    bedah: [
      'XL ≈ 94Ω, sangat induktif',
      'C=47µF → XC ≈ 68Ω kompensasi',
      'cos φ ≈ 0,75 ✓ lolos denda!',
    ],
  },
  {
    id: 6, title: 'Duet L-C', sub: 'Dua slot sekaligus',
    briefing: 'Vs 10V f 100Hz, R 10Ω. Atur L DAN C supaya arus 0,9 – 1,05 A.',
    hint: 'Butuh XL ≈ XC. Pasangan (50mH, 47µF): XL ≈ 31Ω, XC ≈ 34Ω. Dekat!',
    vs: 10, f: 100, R: 10, L: null, C: null,
    slots: [
      { id: 'L', kind: 'L', def: 0, options: [{ label: '50mH', v: 50 * M }, { label: '150mH', v: 150 * M }] },
      { id: 'C', kind: 'C', def: 0, options: [{ label: '22µF', v: 22 * U }, { label: '47µF', v: 47 * U }] },
    ],
    targetLabel: 'Target: I total 0,9 – 1,05 A',
    check: (m) => m.i >= 0.9 && m.i <= 1.05,
    prinsip: 'Dua variabel, satu syarat: XL ≈ XC.',
    bedah: [
      '(50mH, 47µF): 31Ω vs 34Ω',
      'Pasangan paling dekat!',
      'I ≈ 0,97A ✓',
    ],
  },
  {
    id: 7, title: 'Induktif Tegas', sub: 'Sifat & sudut fasa',
    briefing: 'Vs 10V f 100Hz, R 15Ω, C 100µF. Bikin rangkaian INDUKTIF dengan φ 50° – 75°.',
    hint: 'XC ≈ 16Ω. Butuh XL jauh lebih besar → L = 80mH (XL ≈ 50Ω, φ ≈ 66°).',
    vs: 10, f: 100, R: 15, L: null, C: 100 * U,
    slots: [{ id: 'L', kind: 'L', def: 0, options: [{ label: '10mH', v: 10 * M }, { label: '30mH', v: 30 * M }, { label: '80mH', v: 80 * M }] }],
    targetLabel: 'Target: induktif, φ 50° – 75°',
    check: (m) => m.nature === 'IND' && m.phi >= 50 && m.phi <= 75,
    prinsip: 'Tanda φ = sifat: + induktif, − kapasitif.',
    bedah: [
      'XC ≈ 16Ω (kecil)',
      'L=80mH → XL ≈ 50Ω (besar)',
      'φ = atan(34/15) ≈ 66° induktif ✓',
    ],
  },
  {
    id: 8, title: 'Ujian Akhir', sub: 'Vc ekstrem',
    briefing: 'Vs 24V f 50Hz, R 20Ω. Atur L & C supaya Vc 70 – 90V. Q tinggi, presisi master!',
    hint: 'Kombinasi (200mH, 47µF): dekat resonansi + XC besar → Vc melambung!',
    vs: 24, f: 50, R: 20, L: null, C: null,
    slots: [
      { id: 'L', kind: 'L', def: 0, options: [{ label: '100mH', v: 100 * M }, { label: '200mH', v: 200 * M }] },
      { id: 'C', kind: 'C', def: 0, options: [{ label: '47µF', v: 47 * U }, { label: '100µF', v: 100 * U }] },
    ],
    targetLabel: 'Target: Vc 70 – 90 V',
    check: (m) => m.vc >= 70 && m.vc <= 90,
    prinsip: 'Q tinggi + XC besar = Vc ekstrem.',
    bedah: [
      '(200mH, 47µF): XL≈63Ω, XC≈68Ω',
      'Dekat resonansi → I ≈ 1,17A',
      'Vc = 1,17×68 ≈ 79V ✓',
    ],
  },
];
