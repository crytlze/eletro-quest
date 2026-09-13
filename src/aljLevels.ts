// Level Misi Vektor — Aljabar Linier (kombinasi linear = SPL 2x2)
// Target T = a*u + b*v. Pemain mencari a, b bulat (-6..6).
// Semua solusi sudah diverifikasi bilangan bulat.

export interface AljLevel {
  id: number;
  title: string;
  sub: string;
  briefing: string;
  hint: string;
  u: [number, number];
  v: [number, number];
  a: number;
  b: number;
  prinsip: string;
  bedah: string[];
}

export const ALJ_LEVELS: AljLevel[] = [
  {
    id: 1, title: 'Langkah Pertama', sub: 'Skalar • satu arah',
    briefing: 'Atur a dan b supaya panah KUNING tepat di cincin hijau. Target (6,0).',
    hint: '(6,0) = a·(2,0) + b·(0,2). Butuh a=3, b=0.',
    prinsip: 'Kombinasi linear a·u + b·v. Skalar a memperbesar u.',
    bedah: [
      'Target (6,0) = a·(2,0) + b·(0,2)',
      'Arah-x hanya dari u: 2a = 6 → a=3',
      'Arah-y: 2b = 0 → b=0',
      'Cek: 3·(2,0) = (6,0) ✓',
    ],
    u: [2, 0], v: [0, 2], a: 3, b: 0,
  },
  {
    id: 2, title: 'Dua Arah', sub: 'Kombinasi dua vektor',
    briefing: 'Target (4,6). Gerakkan a dan b, lihat panah kuning ikut bergerak!',
    hint: '2a = 4 dan 3b = 6. Jadi a=2, b=2.',
    prinsip: 'Basis sumbu = SPL terpisah per sumbu. Selesaikan sendiri-sendiri.',
    bedah: [
      '2a = 4 → a=2',
      '3b = 6 → b=2',
      'Cek: 2·(2,0)+2·(0,3) = (4,6) ✓',
    ],
    u: [2, 0], v: [0, 3], a: 2, b: 2,
  },
  {
    id: 3, title: 'Minus itu Maju', sub: 'Skalar negatif',
    briefing: 'Target (-3,2). Skalar boleh NEGATIF — panah berbalik arah!',
    hint: 'Butuh ke kiri 3 dan ke atas 2: a=-3, b=2.',
    prinsip: 'Skalar negatif membalik arah vektor 180°.',
    bedah: [
      'Mau x=−3 dari (1,0) → a=−3',
      'Mau y=2 dari (0,1) → b=2',
      'Panah a·u menunjuk ke kiri ✓',
    ],
    u: [1, 0], v: [0, 1], a: -3, b: 2,
  },
  {
    id: 4, title: 'Miring Menantang', sub: 'Basis tak-sumbu • SPL',
    briefing: 'Basisnya miring! Target (3,4). Ini sama dengan SPL: 2a−b=3 dan a+2b=4.',
    hint: 'Dari persamaan: a=2, b=1. Cek: 2·(2,1)+1·(−1,2) = (3,4).',
    prinsip: 'Basis miring = SPL 2×2 sejati. Tulis persamaannya!',
    bedah: [
      '2a−b = 3 (sumbu x)',
      'a+2b = 4 (sumbu y)',
      'Substitusi: a=2, b=1. Cek ✓',
    ],
    u: [2, 1], v: [-1, 2], a: 2, b: 1,
  },
  {
    id: 5, title: 'Angka Besar', sub: 'Koefisien besar',
    briefing: 'Target (11,7). Selesaikan 3a+b=11 dan a+2b=7.',
    hint: 'Coba a=3, b=2: 3·(3,1)+2·(1,2) = (11,7). Pas!',
    prinsip: 'Eliminasi: samakan satu koefisien, lalu kurangkan.',
    bedah: [
      '3a+b = 11 ... (1)',
      'a+2b = 7 ... (2)',
      '(1) − 3×(2): −5b = −10 → b=2',
      'Masukkan: 3a = 9 → a=3 ✓',
    ],
    u: [3, 1], v: [1, 2], a: 3, b: 2,
  },
  {
    id: 6, title: 'Negatif Ganda', sub: 'Dua-duanya minus/plus',
    briefing: 'Target (-1,11). a negatif, b positif. Panah a·u berbalik!',
    hint: 'a=-2, b=3. Cek: −2·(2,−1)+3·(1,3) = (−1,11).',
    prinsip: 'Tanda minus cuma soal arah. Aljabarnya jalan terus.',
    bedah: [
      '2a+b = −1',
      '−a+3b = 11',
      'Selesaikan: a=−2, b=3 ✓',
    ],
    u: [2, -1], v: [1, 3], a: -2, b: 3,
  },
  {
    id: 7, title: 'Ujian SPL', sub: 'Sistem penuh',
    briefing: 'Target (-1,3). Tulis dulu SPL-nya: a+3b=−1 dan 2a+b=3.',
    hint: 'Solusinya a=2, b=−1. Eliminasi b: kalikan persamaan 2 dengan 3!',
    prinsip: 'Eliminasi butuh pengali: samakan koefisien b.',
    bedah: [
      'a+3b = −1 ... (1)',
      '2a+b = 3 ... (2)',
      '3×(2)−(1): 5a = 10 → a=2',
      'Masukkan: b = −1 ✓',
    ],
    u: [1, 2], v: [3, 1], a: 2, b: -1,
  },
  {
    id: 8, title: 'Master Vektor', sub: 'Ujian akhir modul',
    briefing: 'Target (12,1). Basis (3,2) dan (2,−1). Buktikan kamu master SPL 2×2!',
    hint: '3a+2b=12 dan 2a−b=1. Dari persamaan 2: b=2a−1. Substitusi!',
    prinsip: 'Substitusi tercepat kalau satu variabel gampang diisolasi.',
    bedah: [
      '3a+2b = 12',
      '2a−b = 1 → b = 2a−1',
      'Substitusi: 3a+2(2a−1) = 12',
      '7a = 14 → a=2, b=3 ✓',
    ],
    u: [3, 2], v: [2, -1], a: 2, b: 3,
  },
  {
    id: 9, title: 'Skala Besar', sub: 'Koefisien besar',
    briefing: 'Target (10,8). Basis (4,1) dan (1,3). Selesaikan 4a+b=10 dan a+3b=8.',
    hint: 'Coba a=2, b=2: 2·(4,1)+2·(1,3) = (10,8).',
    prinsip: 'Tebak simetris dulu: kalau target "seimbang", coba a=b.',
    bedah: [
      '4a+b = 10',
      'a+3b = 8',
      'Coba a=b → 5a=10 → a=2?',
      'Cek (2): 2+3b=8 → b=2 ✓',
    ],
    u: [4, 1], v: [1, 3], a: 2, b: 2,
  },
  {
    id: 10, title: 'Negatif Penuh', sub: 'Dua-duanya negatif',
    briefing: 'Target (-7,-7) di kuadran III. Basis (2,3) dan (3,1). Berani negatif?',
    hint: '2a+3b=−7 dan 3a+b=−7. Solusinya a=−2, b=−1.',
    prinsip: 'Target negatif semua → curigai solusi negatif semua.',
    bedah: [
      '2a+3b = −7 ... (1)',
      '3a+b = −7 ... (2)',
      '3×(2)−(1): 7a = −14 → a=−2',
      'Masukkan: b = −1 ✓',
    ],
    u: [2, 3], v: [3, 1], a: -2, b: -1,
  },
  {
    id: 11, title: 'Silang Tajam', sub: 'Tanda berlawanan',
    briefing: 'Target (1,-8). Basis (5,2) dan (2,5). Satu plus, satu minus!',
    hint: '5a+2b=1 dan 2a+5b=−8. Solusi: a=1, b=−2.',
    prinsip: 'Tanda solusi mengikuti "tarikan" target di tiap basis.',
    bedah: [
      '5a+2b = 1',
      '2a+5b = −8',
      'Eliminasi: a=1, b=−2',
      'Cek: (5−4, 2−10) = (1,−8) ✓',
    ],
    u: [5, 2], v: [2, 5], a: 1, b: -2,
  },
  {
    id: 12, title: 'Eliminasi Cepat', sub: 'Teknik eliminasi',
    briefing: 'Target (9,5). Basis (4,3) dan (3,4). Eliminasi: jumlahkan kedua persamaan!',
    hint: '4a+3b=9 dan 3a+4b=5. Jumlahkan: 7a+7b=14 → a+b=2. Lanjut!',
    prinsip: 'Koefisien simetris? Jumlahkan/kurangkan persamaannya!',
    bedah: [
      '4a+3b = 9',
      '3a+4b = 5',
      'Jumlahkan: 7a+7b=14 → a+b=2',
      'Kurangkan: a−b=4 → a=3, b=−1 ✓',
    ],
    u: [4, 3], v: [3, 4], a: 3, b: -1,
  },
  {
    id: 13, title: 'Koordinat Jauh', sub: 'Target tinggi',
    briefing: 'Target (9,11) — paling tinggi sejauh ini! Basis (2,5) dan (5,1).',
    hint: '2a+5b=9 dan 5a+b=11. Dari persamaan 2: b=11−5a. Substitusi!',
    prinsip: 'Substitusi paling enak saat ada koefisien 1.',
    bedah: [
      '2a+5b = 9',
      '5a+b = 11 → b = 11−5a',
      'Substitusi: 2a+5(11−5a) = 9',
      '−23a = −46 → a=2, b=1 ✓',
    ],
    u: [2, 5], v: [5, 1], a: 2, b: 1,
  },
  {
    id: 14, title: 'Simetri', sub: 'Basis cermin',
    briefing: 'Target (1,8). Basis (3,−2) dan (2,3). Perhatikan tanda minusnya!',
    hint: '3a+2b=1 dan −2a+3b=8. Solusi: a=−1, b=2.',
    prinsip: 'Hati-hati tanda minus saat substitusi — sumber salah #1!',
    bedah: [
      '3a+2b = 1',
      '−2a+3b = 8',
      'Selesaikan: a=−1, b=2',
      'Cek tanda: −3+4=1 ✓, 2+6=8 ✓',
    ],
    u: [3, -2], v: [2, 3], a: -1, b: 2,
  },
  {
    id: 15, title: 'Ujian 2', sub: 'Campuran menantang',
    briefing: 'Target (9,2). Basis (5,3) dan (1,4). Tanpa hint persamaan — kamu pasti bisa!',
    hint: 'Tulis SPL-nya dulu: 5a+b=9 dan 3a+4b=2. Eliminasi b!',
    prinsip: 'Tanpa hint persamaan pun kamu bisa: tulis SPL-nya sendiri!',
    bedah: [
      '5a+b = 9 → b = 9−5a',
      '3a+4b = 2',
      'Substitusi: 3a+4(9−5a) = 2',
      '−17a = −34 → a=2, b=−1 ✓',
    ],
    u: [5, 3], v: [1, 4], a: 2, b: -1,
  },
  {
    id: 16, title: 'Grand Master', sub: 'x saling meniadakan',
    briefing: 'Target (0,10) — tepat di sumbu y! Basis (4,1) dan (2,3). Komponen x harus saling menghapus.',
    hint: '4a+2b=0 → b=−2a. Masukkan ke a+3b=10!',
    prinsip: 'Target di sumbu = satu kombinasi saling menghapus. Indah!',
    bedah: [
      '4a+2b = 0 → b = −2a',
      'a+3b = 10',
      'Substitusi: a+3(−2a) = 10',
      '−5a = 10 → a=−2, b=4 ✓',
    ],
    u: [4, 1], v: [2, 3], a: -2, b: 4,
  },
  {
    id: 17, title: 'Dobel Basis', sub: 'Skala enam',
    briefing: 'Target (10,-2). Basis (6,2) dan (2,6). Bagi persamaan 1 dengan 2 dulu biar kecil!',
    hint: '6a+2b=10 dan 2a+6b=−2. Sederhanakan: 3a+b=5. Solusi: a=2, b=−1.',
    prinsip: 'Angka besar? Sederhanakan dulu (bagi FPB)!',
    bedah: [
      '6a+2b = 10 → bagi 2: 3a+b = 5',
      '2a+6b = −2 → bagi 2: a+3b = −1',
      'Selesaikan: a=2, b=−1',
      'Cek: (12−2, 4−6) = (10,−2) ✓',
    ],
    u: [6, 2], v: [2, 6], a: 2, b: -1,
  },
  {
    id: 18, title: 'Raksasa Miring', sub: 'Basis besar',
    briefing: 'Target (8,2). Basis (6,4) dan (4,6) — angka terbesar sejauh ini, jangan panik!',
    hint: '6a+4b=8 dan 4a+6b=2. Bagi 2 semua: 3a+2b=4 dan 2a+3b=1.',
    prinsip: 'Sama seperti Level 17: kecilkan dulu, baru eliminasi.',
    bedah: [
      'Bagi 2: 3a+2b = 4 dan 2a+3b = 1',
      'Jumlahkan: 5a+5b = 5 → a+b = 1',
      'Kurangkan: a−b = 3',
      'Dapat a=2, b=−1 ✓',
    ],
    u: [6, 4], v: [4, 6], a: 2, b: -1,
  },
  {
    id: 19, title: 'Bidik Jauh', sub: 'Kuadran IV',
    briefing: 'Target (12,1) jauh di kanan. Basis (3,5) dan (5,2).',
    hint: '3a+5b=12 dan 5a+2b=1. Eliminasi: kalikan persamaan 1 dengan 5, persamaan 2 dengan 3!',
    prinsip: 'Eliminasi klasik: kali-silangkan koefisien a.',
    bedah: [
      '3a+5b = 12 ... (1)',
      '5a+2b = 1 ... (2)',
      '5×(1)−3×(2): 19b = 57 → b=3',
      'Masukkan: a = −1 ✓',
    ],
    u: [3, 5], v: [5, 2], a: -1, b: 3,
  },
  {
    id: 20, title: 'Legenda Vektor', sub: 'Ujian grand master',
    briefing: 'Target (9,-2). Basis (5,2) dan (3,4). Level terakhir — buktikan gelar mastermu!',
    hint: '5a+3b=9 dan 2a+4b=−2. Sederhanakan persamaan 2: a+2b=−1. Substitusi!',
    prinsip: 'Kombinasikan semua teknik: sederhanakan, eliminasi, cek!',
    bedah: [
      '5a+3b = 9',
      '2a+4b = −2 → bagi 2: a+2b = −1',
      'a = −1−2b, substitusi ke (1)',
      '−5−7b = 9 → b=−2, a=3 ✓',
    ],
    u: [5, 2], v: [3, 4], a: 3, b: -2,
  },
];
