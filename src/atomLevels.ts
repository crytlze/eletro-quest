// Data unsur — Struktur Atom (atom netral: elektron = proton).
// N = A − Z. Isotop paling melimpah.

export interface AtomLevel {
  id: number;
  name: string;
  symbol: string;
  z: number; // nomor atom = proton
  a: number; // nomor massa
  briefing: string;
  hint: string;
  fakta: string; // fun fact saat menang
}

export const ATOM_LEVELS: AtomLevel[] = [
  {
    id: 1, name: 'Hidrogen', symbol: 'H', z: 1, a: 1,
    briefing: 'Rakit atom HIDROGEN (H). Paling simpel: Z=1, A=1.',
    hint: 'A−Z = 0 → tanpa neutron! Butuh p=1, n=0, e=1.',
    fakta: 'Hidrogen unsur paling ringan & terbanyak di alam semesta! 🌌',
  },
  {
    id: 2, name: 'Helium', symbol: 'He', z: 2, a: 4,
    briefing: 'Rakit HELIUM (He). Z=2, A=4. Kulit K penuh!',
    hint: 'N = 4−2 = 2. Butuh p=2, n=2, e=2. Kulit K pas penuh (2).',
    fakta: 'Helium bikin suaramu melengking + balon bisa terbang! 🎈',
  },
  {
    id: 3, name: 'Litium', symbol: 'Li', z: 3, a: 7,
    briefing: 'Rakit LITIUM (Li). Z=3, A=7. Elektron ke-3 masuk kulit L!',
    hint: 'N = 7−3 = 4. Butuh p=3, n=4, e=3 (K=2, L=1).',
    fakta: 'Litium ada di baterai HP yang kamu pegang!',
  },
  {
    id: 4, name: 'Karbon', symbol: 'C', z: 6, a: 12,
    briefing: 'Rakit KARBON (C). Z=6, A=12. Basis kehidupan!',
    hint: 'N = 12−6 = 6. Butuh p=6, n=6, e=6 (K=2, L=4).',
    fakta: 'Intan dan pensil sama-sama karbon murni! ✏️💎',
  },
  {
    id: 5, name: 'Oksigen', symbol: 'O', z: 8, a: 16,
    briefing: 'Rakit OKSIGEN (O). Z=8, A=16. Kulit L hampir penuh!',
    hint: 'N = 16−8 = 8. Butuh p=8, n=8, e=8 (K=2, L=6).',
    fakta: 'Oksigen = 21% udara yang kamu hirup sekarang! 😮‍💨',
  },
  {
    id: 6, name: 'Natrium', symbol: 'Na', z: 11, a: 23,
    briefing: 'Rakit NATRIUM (Na). Z=11, A=23. Masuk kulit M!',
    hint: 'N = 23−11 = 12. Butuh p=11, n=12, e=11 (K=2, L=8, M=1).',
    fakta: 'Natrium + klor = garam dapur! 🧂',
  },
  {
    id: 7, name: 'Magnesium', symbol: 'Mg', z: 12, a: 24,
    briefing: 'Rakit MAGNESIUM (Mg). Z=12, A=24.',
    hint: 'N = 24−12 = 12. Butuh p=12, n=12, e=12 (K=2, L=8, M=2).',
    fakta: 'Magnesium terbakar putih menyilaukan — dipakai di kembang api! 🎇',
  },
  {
    id: 8, name: 'Kalsium', symbol: 'Ca', z: 20, a: 40,
    briefing: 'Rakit KALSIUM (Ca). Z=20, A=40. Ujian akhir: 4 kulit!',
    hint: 'N = 40−20 = 20. Butuh p=20, n=20, e=20 (K=2, L=8, M=8, N=2).',
    fakta: 'Kalsium bahan tulang & gigimu! 🦷',
  },
];

/** Sebaran elektron per kulit (K≤2, L≤8, M≤18, N≤32). */
export function shellsOf(e: number): number[] {
  const caps = [2, 8, 18, 32];
  const out: number[] = [];
  let rest = e;
  for (const cap of caps) {
    if (rest <= 0) break;
    const take = Math.min(rest, cap);
    out.push(take);
    rest -= take;
  }
  return out;
}
