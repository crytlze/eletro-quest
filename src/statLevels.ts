// Bank soal Lab Peluang — Statistika & Probabilitas
// 8 level x 3 soal. Jawaban (ans) disebar di posisi 0/1/2.

export interface StatQ {
  q: string;
  opts: [string, string, string];
  ans: number;
  expl: string;
  sesat: [string, string, string]; // bedah tiap opsi salah ('' utk jawaban benar)
}

export interface StatLevel {
  id: number;
  title: string;
  sub: string;
  questions: [StatQ, StatQ, StatQ];
}

export const STAT_LEVELS: StatLevel[] = [
  {
    id: 1, title: 'Koin Perdana', sub: 'Peluang dasar • koin',
    questions: [
      { q: 'Koin dilempar sekali. P(muncul ANGKA)?', opts: ['1/4', '1/2', '1'], ans: 1, expl: '2 sisi sama mungkin → 1/2.', sesat: ['Koin cuma 2 sisi, bukan 4 — 1/4 itu buat DUA koin!', '', '1 = pasti, padahal gambar bisa muncul!'] },
      { q: 'Koin dilempar sekali. P(muncul GAMBAR)?', opts: ['1/2', '1/3', '2/3'], ans: 0, expl: 'Simetris dengan angka → 1/2.', sesat: ['', '1/3 itu kalau sisinya 3 — koin cuma 2!', '2/3 itu P(TIDAK gambar), kebalik!'] },
      { q: 'Dua koin dilempar. P(keduanya ANGKA)?', opts: ['1/2', '1/3', '1/4'], ans: 2, expl: 'AA, AG, GA, GG — 1 dari 4.', sesat: ['1/2 itu P(satu koin angka), bukan dua-duanya!', '1/3 tidak ada: ruang sampelnya 4, bukan 3!', ''] },
    ],
  },
  {
    id: 2, title: 'Dadu Dasar', sub: 'Peluang dasar • dadu',
    questions: [
      { q: 'Dadu dilempar. P(mata 6)?', opts: ['1/3', '1/2', '1/6'], ans: 2, expl: '1 sisi cocok dari 6.', sesat: ['1/3 itu P(genap), bukan P(6)!', '1/2 itu P(ganjil atau genap)!', ''] },
      { q: 'Dadu dilempar. P(mata GANJIL)?', opts: ['1/2', '1/3', '2/3'], ans: 0, expl: '{1,3,5} → 3 dari 6.', sesat: ['', 'Ganjil ada 3 sisi {1,3,5}, bukan 2!', '2/3 berarti 4 sisi — ganjil cuma 3!'] },
      { q: 'Dadu dilempar. P(mata LEBIH DARI 4)?', opts: ['1/2', '1/3', '1/6'], ans: 1, expl: '{5,6} → 2/6 = 1/3.', sesat: ['1/2 itu P(≥4)? {4,5,6} — tapi yang ditanya >4!', '', '1/6 itu P(satu mata spesifik)!'] },
    ],
  },
  {
    id: 3, title: 'Dadu Ganda', sub: 'Dua dadu • ruang sampel',
    questions: [
      { q: 'Dua dadu. P(jumlah 7)?', opts: ['5/36', '6/36', '7/36'], ans: 1, expl: '(1,6)…(6,1): 6 dari 36.', sesat: ['Ada 6 pasang — jangan lupa (1,6) & (6,1) itu BEDA!', '', '7/36: angka 7 itu jumlahnya, bukan cacah pasangannya!'] },
      { q: 'Dua dadu. P(kembar)?', opts: ['1/6', '1/12', '1/3'], ans: 0, expl: '6 pasang kembar dari 36 = 1/6.', sesat: ['', 'Kembar ada 6 pasang {(1,1)..(6,6)}, bukan 3!', '1/3 itu 12/36 — kebanyakan!'] },
      { q: 'Dua dadu. P(jumlah 2)?', opts: ['1/18', '1/12', '1/36'], ans: 2, expl: 'Hanya (1,1). 2/36 itu untuk jumlah 3!', sesat: ['1/18 = 2/36 itu P(jumlah 3), bukan 2!', '1/12 tidak ada di tabel 36!', ''] },
    ],
  },
  {
    id: 4, title: 'Kartu Remi', sub: 'Peluang • 52 kartu',
    questions: [
      { q: 'Satu kartu diambil. P(kartu As)?', opts: ['1/4', '4/13', '1/13'], ans: 2, expl: '4 As dari 52 = 1/13.', sesat: ['1/4 itu P(satu daun), bukan As!', 'Ruang sampelnya 52 kartu, bukan 13!', ''] },
      { q: 'Satu kartu diambil. P(berdaun HATI ♥)?', opts: ['1/13', '1/4', '1/2'], ans: 1, expl: '13 hati dari 52 = 1/4.', sesat: ['1/13 itu P(As)!', '', '1/2 itu P(merah/hitam)!'] },
      { q: 'Satu kartu diambil. P(King MERAH)?', opts: ['1/26', '1/13', '1/52'], ans: 0, expl: 'King hati + King diamond = 2 dari 52.', sesat: ['', '1/13 itu SEMUA king (4 kartu)!', '1/52 itu SATU kartu spesifik!'] },
    ],
  },
  {
    id: 5, title: 'Rata-rata', sub: 'Statistika • mean',
    questions: [
      { q: 'Mean dari 4, 6, 8?', opts: ['7', '6', '5'], ans: 1, expl: '(4+6+8)/3 = 18/3 = 6.', sesat: ['Jumlahnya 18, bukan 21 — cek lagi tambahannya!', '', 'Jumlahnya 18, bukan 15!'] },
      { q: 'Mean dari 2, 3, 10?', opts: ['5', '6', '4'], ans: 0, expl: '(2+3+10)/3 = 15/3 = 5.', sesat: ['', 'Jumlahnya 15, bukan 18!', 'Jumlahnya 15, bukan 12!'] },
      { q: 'Mean dari 5, 5, 5, 9?', opts: ['7', '5', '6'], ans: 2, expl: '(5+5+5+9)/4 = 24/4 = 6.', sesat: ['Jumlahnya 24, bukan 28!', '5 itu MODUS-nya, bukan mean!', ''] },
    ],
  },
  {
    id: 6, title: 'Tengah & Sering', sub: 'Median • modus',
    questions: [
      { q: 'Median dari 3, 1, 2?', opts: ['3', '1', '2'], ans: 2, expl: 'Urutkan 1,2,3 → tengahnya 2.', sesat: ['3 itu nilai MAX, median = nilai TENGAH setelah diurutkan!', '1 itu nilai MIN!', ''] },
      { q: 'Modus dari 2, 3, 3, 5?', opts: ['2', '3', '5'], ans: 1, expl: '3 muncul paling sering (2×).', sesat: ['2 cuma muncul 1× — modus = paling SERING!', '', '5 cuma muncul 1×!'] },
      { q: 'Median dari 1, 2, 3, 4?', opts: ['2,5', '2', '3'], ans: 0, expl: 'Data genap: (2+3)/2 = 2,5.', sesat: ['', 'Data genap → rata-ratakan 2 tengah (2&3)!', '3 juga tengah, tapi harus (2+3)/2!'] },
    ],
  },
  {
    id: 7, title: 'Harapan', sub: 'Frekuensi harapan',
    questions: [
      { q: 'Dadu dilempar 60×. Harapan muncul mata 6?', opts: ['12', '10', '6'], ans: 1, expl: '60 × 1/6 = 10.', sesat: ['12 = 60×1/5? Peluang 6 itu 1/6, bukan 1/5!', '', '6 itu kalau pelemparannya 36×!'] },
      { q: 'Koin dilempar 100×. Harapan muncul angka?', opts: ['25', '75', '50'], ans: 2, expl: '100 × 1/2 = 50.', sesat: ['25 itu 100×1/4 — koin cuma 2 sisi!', '75 itu harapan TIDAK angka!', ''] },
      { q: 'Spinner 4 warna sama besar diputar 80×. Harapan warna merah?', opts: ['20', '40', '10'], ans: 0, expl: '80 × 1/4 = 20.', sesat: ['', '40 itu 80×1/2 — spinnernya 4 warna!', '10 itu 80×1/8!'] },
    ],
  },
  {
    id: 8, title: 'Ujian Akhir', sub: 'Campuran • komplen & gabungan',
    questions: [
      { q: 'P(hujan hari ini) = 0,3. P(tidak hujan)?', opts: ['0,3', '0,7', '0,5'], ans: 1, expl: 'Komplemen: 1 − 0,3 = 0,7.', sesat: ['0,3 itu P(hujannya) — baca lagi soalnya!', '', 'Komplemen bukan setengah-setengah!'] },
      { q: 'Kotak berisi 3 merah + 2 putih. Diambil 1. P(merah)?', opts: ['3/5', '2/5', '1/2'], ans: 0, expl: '3 bola cocok dari 5.', sesat: ['', '2/5 itu P(putih) — ketuker!', 'Merah ada 3, putih 2 — tidak seimbang!'] },
      { q: 'Dua dadu. P(jumlah 11)?', opts: ['1/12', '1/9', '1/18'], ans: 2, expl: '(5,6),(6,5) → 2/36 = 1/18.', sesat: ['Pasangan 11 cuma (5,6),(6,5) = 2, bukan 3!', '1/9 = 4/36 — kebanyakan!', ''] },
    ],
  },
];
