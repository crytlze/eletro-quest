// Bank soal quiz Aljabar Linier — bag 1: pengenalan, jenis matriks, operasi.
// Dipakai QuizScene generik (3 soal/level, sesat per opsi).

export interface QuizQ {
  q: string;
  opts: [string, string, string];
  ans: number;
  expl: string;
  sesat: [string, string, string];
}

export interface QuizLevel {
  id: number;
  title: string;
  sub: string;
  questions: [QuizQ, QuizQ, QuizQ];
}

export interface QuizTopic {
  id: string;
  title: string;
  sub: string;
  howto: string;
  keywords: string;
  levels: QuizLevel[];
}

export const QUIZ_A: Record<string, QuizTopic> = {
  aljP3: {
    id: 'aljP3', title: 'OPERASI MATRIKS', sub: 'Jumlah • kurang • kali • transpose',
    howto: 'Hitung dengan teliti!\nJumlah/kurang: entri seletak.',
    keywords: 'Tambah • kurang • kali • transpose',
    levels: [
      {
        id: 1, title: 'Penjumlahan', sub: 'A + B',
        questions: [
          { q: 'A=[1 2;3 4], B=[5 6;7 8]. Entri (1,1) A+B?', opts: ['6', '5', '7'], ans: 0, expl: '1+5 = 6.', sesat: ['', 'Itu cuma B!', 'Itu 1+6? Seletak!'] },
          { q: 'A=[1 2;3 4], B=[5 6;7 8]. Entri (2,2) A+B?', opts: ['11', '12', '10'], ans: 1, expl: '4+8 = 12.', sesat: ['4+7? Seletak: 4+8!', '', '10 = 3+7? Salah posisi!'] },
          { q: 'A+B ... B+A?', opts: ['Sama (komutatif)', 'Beda', 'Tergantung'], ans: 0, expl: 'Jumlah matriks komutatif.', sesat: ['', 'Untuk JUMLAH selalu sama!', 'Tidak tergantung!'] },
        ],
      },
      {
        id: 2, title: 'Pengurangan', sub: 'A − B',
        questions: [
          { q: 'A=[1 2;3 4], B=[5 6;7 8]. Entri (1,1) A−B?', opts: ['−4', '4', '6'], ans: 0, expl: '1−5 = −4.', sesat: ['', '5−1? Urutan penting: A−B!', 'Itu 1+5!'] },
          { q: 'A=[1 2;3 4], B=[5 6;7 8]. Entri (2,1) A−B?', opts: ['4', '−4', '0'], ans: 1, expl: '3−7 = −4.', sesat: ['7−3? A dulu: 3−7!', '', 'Bukan nol!'] },
          { q: 'A − A = ...?', opts: ['Matriks nol', 'A', 'I'], ans: 0, expl: 'Semua entri 0.', sesat: ['', 'Kurang dengan dirinya = nol!', 'I cuma untuk kali!'] },
        ],
      },
      {
        id: 3, title: 'Skalar × Matriks', sub: 'Kali semua entri',
        questions: [
          { q: '3×[1 2;0 −1]. Entri (1,2)?', opts: ['6', '5', '2'], ans: 0, expl: '3×2 = 6.', sesat: ['', '3+2? Harus KALI!', 'Itu tanpa dikali!'] },
          { q: '3×[1 2;0 −1]. Entri (2,2)?', opts: ['−3', '3', '0'], ans: 0, expl: '3×(−1) = −3.', sesat: ['', 'Tanda minus ikut!', 'Nol dari mana?'] },
          { q: '0 × A = ...?', opts: ['Nol', 'A', 'I'], ans: 0, expl: 'Semua jadi 0.', sesat: ['', 'Nol kali apa pun = nol!', 'I untuk perkalian!'] },
        ],
      },
      {
        id: 4, title: 'Transpose', sub: 'Baris ↔ kolom',
        questions: [
          { q: 'A=[1 2 3;4 5 6]. Ordo Aᵀ?', opts: ['3×2', '2×3', '6'], ans: 0, expl: 'Tukar: 3×2.', sesat: ['', 'Transpose MENUKAR ordo!', 'Itu jumlah elemen!'] },
          { q: 'A=[1 2 3;4 5 6]. Entri (2,1) Aᵀ?', opts: ['4', '2', '5'], ans: 1, expl: 'Baris 2 Aᵀ = [2,5], jadi (2,1) = 2.', sesat: ['4 = a₂₁, bukan (2,1) Aᵀ!', '', '5 = (2,2) Aᵀ!'] },
          { q: '(Aᵀ)ᵀ = ...?', opts: ['A', '−A', 'I'], ans: 0, expl: 'Transpose 2× = semula.', sesat: ['', 'Tidak dinegatifkan!', 'Bukan I!'] },
        ],
      },
      {
        id: 5, title: 'Perkalian 2×2', sub: 'Baris × kolom',
        questions: [
          { q: 'A=[1 2;3 4], B=[2 0;1 2]. Entri (1,1) AB?', opts: ['4', '2', '6'], ans: 0, expl: '1·2+2·1 = 4.', sesat: ['', 'Itu cuma 1·2, tambah 2·1!', '1+2+...? Baris×kolom!'] },
          { q: 'A=[1 2;3 4], B=[2 0;1 2]. Entri (2,1) AB?', opts: ['10', '7', '14'], ans: 0, expl: '3·2+4·1 = 10.', sesat: ['', '3·2=6, +4·1=4!', '14 = 6+...? Hitung lagi!'] },
          { q: 'A=[1 2;3 4], B=[2 0;1 2]. Entri (2,2) AB?', opts: ['8', '4', '10'], ans: 0, expl: '3·0+4·2 = 8.', sesat: ['', '3·0=0, jangan lupa!', 'Itu (2,1)!'] },
        ],
      },
      {
        id: 6, title: 'Kali Identitas', sub: 'A × I = A',
        questions: [
          { q: 'A=[2 5;1 3]. A×I = ...?', opts: ['[2 5;1 3]', '[1 0;0 1]', '[3 7;4 4]'], ans: 0, expl: 'Identitas = netral kali.', sesat: ['', 'Itu I-nya, bukan hasilnya!', 'Itu A+I!'] },
          { q: 'A=[2 5;1 3]. I×A = ...?', opts: ['[2 5;1 3]', '[1 1;1 1]', '[2 5;1 3]ᵀ'], ans: 0, expl: 'Kiri-kanan sama untuk I.', sesat: ['', 'Bukan matriks 1 semua!', 'Tidak di-transpose!'] },
          { q: 'A(2×3)·B(3×2). Ordonya?', opts: ['2×2', '3×3', '2×3'], ans: 0, expl: '(m×n)(n×p) = m×p.', sesat: ['', 'Dalamnya (3) hilang!', 'Luarnya yang dipakai!'] },
        ],
      },
      {
        id: 7, title: 'Baris × Kolom', sub: 'Hasil skalar',
        questions: [
          { q: '[1 2 3]×[4;5;6] = ...?', opts: ['32', '[4 10 18]', '14'], ans: 0, expl: '4+10+18 = 32.', sesat: ['', 'Itu belum dijumlah!', '14 = 4+10? Tambah 18!'] },
          { q: '[1 2 3]×[4;5;6]. Ordonya?', opts: ['1×1 (skalar)', '1×3', '3×1'], ans: 0, expl: '(1×3)(3×1) = 1×1.', sesat: ['', 'Ordo HASIL, bukan input!', 'Terbalik!'] },
          { q: '[2 0]×[3;4] = ...?', opts: ['6', '14', '10'], ans: 0, expl: '6+0 = 6.', sesat: ['', '2·4=8? Pasangannya 2·3!', '10 = 6+4? 0·4=0!'] },
        ],
      },
      {
        id: 8, title: 'Sifat Kali', sub: 'Tak komutatif!',
        questions: [
          { q: 'Umumnya, AB ... BA?', opts: ['=', '≠', '= A+B'], ans: 1, expl: 'Kali matriks tak komutatif!', sesat: ['Berbeda dengan jumlah!', '', 'Bukan tambah-tambahan!'] },
          { q: '(AB)ᵀ = ...?', opts: ['BᵀAᵀ', 'AᵀBᵀ', '−AB'], ans: 0, expl: 'Transpose MEMBALIK urutan!', sesat: ['', 'Urutan ikut terbalik!', 'Tidak dinegatifkan!'] },
          { q: 'A(B+C) = ...?', opts: ['AB+AC', 'AB+C', 'A+BC'], ans: 0, expl: 'Distributif kiri.', sesat: ['', 'C ikut dikali A!', 'Kurungnya dibuka semua!'] },
        ],
      },
    ],
  },
};
