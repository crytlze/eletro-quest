// Deck Sortir Kilat — pilah kartu ke wadah yang benar secepatnya.
// Dipakai topik Pengenalan (skalar/vektor/matriks) & Jenis Matriks.

export interface SortCard {
  t: string;
  bin: number;
}

export interface SortLevel {
  id: number;
  title: string;
  sub: string;
  briefing: string;
  hint: string;
  bins: [string, string] | [string, string, string];
  timeMs: number;
  cards: SortCard[];
}

export interface SortTopic {
  id: string;
  title: string;
  sub: string;
  howto: string;
  keywords: string;
  levels: SortLevel[];
}

export const SORT_TOPICS: Record<string, SortTopic> = {
  aljP1: {
    id: 'aljP1', title: 'PENGENALAN', sub: 'Skalar • vektor • matriks',
    howto: 'Pilah kartu secepatnya!\nPunya ARAH = vektor.',
    keywords: 'Skalar • vektor • matriks • notasi',
    levels: [
      {
        id: 1, title: 'Skalar vs Vektor', sub: 'Ada arah?',
        briefing: 'Pilah 8 kartu: SKALAR atau VEKTOR!',
        hint: '°C, kg, jam, ampere = skalar (tanpa arah).',
        bins: ['SKALAR', 'VEKTOR'], timeMs: 6000,
        cards: [
          { t: '30°C', bin: 0 }, { t: '5 N ke kanan', bin: 1 },
          { t: '5 kg', bin: 0 }, { t: '10 m ke timur', bin: 1 },
          { t: '3 ampere', bin: 0 }, { t: '60 km/jam ke utara', bin: 1 },
          { t: '2 jam', bin: 0 }, { t: '9,8 m/s² ke bawah', bin: 1 },
        ],
      },
      {
        id: 2, title: 'Tambah Matriks', sub: 'Tiga wadah',
        briefing: 'Sekarang 3 wadah: SKALAR, VEKTOR, MATRIKS!',
        hint: 'Kurung siku = matriks. |v| = panjang (skalar!).',
        bins: ['SKALAR', 'VEKTOR', 'MATRIKS'], timeMs: 6000,
        cards: [
          { t: '7', bin: 0 }, { t: '(2, 5)', bin: 1 }, { t: '[1 2; 3 4]', bin: 2 },
          { t: '100 watt', bin: 0 }, { t: 'v (tebal)', bin: 1 }, { t: '|v|', bin: 0 },
          { t: 'det(A)', bin: 0 }, { t: 'gaya 10 N', bin: 1 }, { t: '[5]', bin: 2 },
        ],
      },
      {
        id: 3, title: 'Jebakan Notasi', sub: 'Waspada simbol!',
        briefing: 'Simbol menipu: A⁻¹ itu matriks, |A| itu angka!',
        hint: 'Pangkat −1 & transpose = matriks. |…| & det = angka.',
        bins: ['SKALAR', 'VEKTOR', 'MATRIKS'], timeMs: 5000,
        cards: [
          { t: 'A⁻¹', bin: 2 }, { t: '|A|', bin: 0 }, { t: 'AB', bin: 2 },
          { t: '3v', bin: 1 }, { t: 'A+B', bin: 2 }, { t: 'v+w', bin: 1 },
          { t: '25', bin: 0 }, { t: 'Aᵀ', bin: 2 }, { t: '−7', bin: 0 },
        ],
      },
      {
        id: 4, title: 'Kilat Campuran', sub: 'Waktu mepet!',
        briefing: '10 kartu, waktu cuma 3,5 detik per kartu!',
        hint: 'Fokus: ada arah? ada kurung? tinggal ketuk!',
        bins: ['SKALAR', 'VEKTOR', 'MATRIKS'], timeMs: 3500,
        cards: [
          { t: '−3', bin: 0 }, { t: '(0, −4)', bin: 1 }, { t: '[0 0; 0 0]', bin: 2 },
          { t: '72°F', bin: 0 }, { t: 'c = 3×10⁸ m/s', bin: 0 }, { t: 'perpindahan', bin: 1 },
          { t: '[I]', bin: 2 }, { t: 'massa jenis', bin: 0 }, { t: 'momentum', bin: 1 },
          { t: '[x y z]', bin: 2 },
        ],
      },
    ],
  },
  aljP2: {
    id: 'aljP2', title: 'JENIS MATRIKS', sub: 'Kenali dari bentuknya',
    howto: 'Lihat polanya, pilah cepat!\nWaspada jebakan 1×1.',
    keywords: 'Persegi • nol • identitas • simetris',
    levels: [
      {
        id: 1, title: 'Persegi?', sub: 'Baris = kolom?',
        briefing: 'Pilah: PERSEGI atau BUKAN. Awas jebakan 1×1!',
        hint: '[5] dan [0] itu persegi 1×1!',
        bins: ['PERSEGI', 'BUKAN'], timeMs: 6000,
        cards: [
          { t: '[1 2; 3 4]', bin: 0 }, { t: '[1 2 3; 4 5 6]', bin: 1 },
          { t: '[5]', bin: 0 }, { t: '[1 2]', bin: 1 },
          { t: '[3; 4]', bin: 1 }, { t: '[2 0; 0 2]', bin: 0 },
          { t: '[7 8]', bin: 1 }, { t: '[0]', bin: 0 },
        ],
      },
      {
        id: 2, title: 'Nol?', sub: 'Semua nol?',
        briefing: 'Pilah: NOL (semua elemen 0) atau BUKAN!',
        hint: 'Satu angka bukan-nol saja = BUKAN!',
        bins: ['NOL', 'BUKAN'], timeMs: 6000,
        cards: [
          { t: '[0 0; 0 0]', bin: 0 }, { t: '[1 0; 0 1]', bin: 1 },
          { t: '[0 0 0]', bin: 0 }, { t: '[0 1; 0 0]', bin: 1 },
          { t: '[0]', bin: 0 }, { t: '[2 0; 0 0]', bin: 1 },
          { t: '[0 0; 0 0; 0 0]', bin: 0 }, { t: '[0 5; 0 0]', bin: 1 },
        ],
      },
      {
        id: 3, title: 'Identitas?', sub: 'Diagonal 1!',
        briefing: 'IDENTITAS = diagonal 1, sisanya 0. Ketat!',
        hint: '[2 0;0 2] itu SKALAR, bukan identitas!',
        bins: ['IDENTITAS', 'BUKAN'], timeMs: 6000,
        cards: [
          { t: '[1 0; 0 1]', bin: 0 }, { t: '[1 0 0; 0 1 0; 0 0 1]', bin: 0 },
          { t: '[2 0; 0 2]', bin: 1 }, { t: '[1 0; 1 1]', bin: 1 },
          { t: '[1]', bin: 0 }, { t: '[0 1; 1 0]', bin: 1 },
          { t: '[1 0; 0 0]', bin: 1 }, { t: '[1 0 0; 0 1 0]', bin: 1 },
        ],
      },
      {
        id: 4, title: 'Diagonal?', sub: 'Luar diagonal nol',
        briefing: 'DIAGONAL: yang boleh isi cuma diagonal utama!',
        hint: 'Satu angka nyasar di luar diagonal = BUKAN!',
        bins: ['DIAGONAL', 'BUKAN'], timeMs: 6000,
        cards: [
          { t: '[2 0; 0 3]', bin: 0 }, { t: '[1 0 0; 0 5 0; 0 0 9]', bin: 0 },
          { t: '[1 2; 0 3]', bin: 1 }, { t: '[4 0; 0 4]', bin: 0 },
          { t: '[0 0; 5 0]', bin: 1 }, { t: '[7]', bin: 0 },
          { t: '[1 0; 0 0]', bin: 0 }, { t: '[3 1; 0 2]', bin: 1 },
        ],
      },
      {
        id: 5, title: 'Simetris?', sub: 'Cermin diagonal',
        briefing: 'SIMETRIS: cermin terhadap diagonal sama persis!',
        hint: 'Bandingkan a₁₂ vs a₂₁. Beda = BUKAN!',
        bins: ['SIMETRIS', 'BUKAN'], timeMs: 6000,
        cards: [
          { t: '[1 2; 2 1]', bin: 0 }, { t: '[1 2; 3 1]', bin: 1 },
          { t: '[5]', bin: 0 }, { t: '[2 0; 0 2]', bin: 0 },
          { t: '[1 2 3; 4 5 6]', bin: 1 }, { t: '[0 1; 1 0]', bin: 0 },
          { t: '[1 0 0; 0 2 0; 0 0 3]', bin: 0 }, { t: '[3 1; 2 3]', bin: 1 },
        ],
      },
      {
        id: 6, title: 'Segitiga?', sub: 'Nol separuh!',
        briefing: 'SEGITIGA: nol semua di atas ATAU di bawah diagonal!',
        hint: 'Penuh semua = BUKAN. Diagonal pun segitiga!',
        bins: ['SEGITIGA', 'BUKAN'], timeMs: 5000,
        cards: [
          { t: '[1 2; 0 3]', bin: 0 }, { t: '[4 0; 5 6]', bin: 0 },
          { t: '[1 2 3; 0 4 5; 0 0 6]', bin: 0 }, { t: '[1 2; 3 4]', bin: 1 },
          { t: '[2 0; 0 5]', bin: 0 }, { t: '[0 1; 1 0]', bin: 1 },
          { t: '[1 0 0; 2 3 0; 4 5 6]', bin: 0 }, { t: '[0 2; 3 4]', bin: 1 },
        ],
      },
    ],
  },
};
