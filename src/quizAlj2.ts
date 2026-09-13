// Bank soal quiz Aljabar Linier — bag 2: determinan, invers, Gauss.

import { QuizTopic } from './quizAlj1';

export const QUIZ_B: Record<string, QuizTopic> = {
  aljP4: {
    id: 'aljP4', title: 'DETERMINAN', sub: '2×2 • 3×3 • sifat',
    howto: 'ad−bc untuk 2×2, Sarrus untuk 3×3.\nHati-hati tanda minus!',
    keywords: 'Determinan • Sarrus • singular',
    levels: [
      {
        id: 1, title: 'Det 2×2 Dasar', sub: 'ad − bc',
        questions: [
          { q: 'det [1 2;3 4]?', opts: ['−2', '2', '10'], ans: 0, expl: '4−6 = −2.', sesat: ['', '6−4? Urutan: ad−bc!', '10 = 4+6? Harus KURANG!'] },
          { q: 'det [5 1;2 3]?', opts: ['13', '17', '11'], ans: 0, expl: '15−2 = 13.', sesat: ['', '15+2? Kurang!', '11 = 15−...? Hitung lagi!'] },
          { q: 'det [2 0;0 3]?', opts: ['6', '5', '0'], ans: 0, expl: '6−0 = 6.', sesat: ['', '2+3? Kali, bukan tambah!', 'Nol dari mana?'] },
        ],
      },
      {
        id: 2, title: 'Det Nol & Negatif', sub: 'Kasus khusus',
        questions: [
          { q: 'det [2 4;1 2]?', opts: ['0', '8', '4'], ans: 0, expl: '4−4 = 0.', sesat: ['', '4+4? Kurang!', 'Itu 2×2? Bukan!'] },
          { q: 'det [−1 2;3 4]?', opts: ['−10', '2', '10'], ans: 0, expl: '−4−6 = −10.', sesat: ['', '−4+6? Tetap kurang!', 'Tanda minus jangan hilang!'] },
          { q: 'det = 0 artinya...?', opts: ['Tak punya invers', 'Itu identitas', 'Semua nol'], ans: 0, expl: 'Singular → tak ada invers.', sesat: ['', 'Identitas det-nya 1!', 'Belum tentu semua nol!'] },
        ],
      },
      {
        id: 3, title: 'Sarrus 1', sub: 'Ekspansi 3×3',
        questions: [
          { q: 'det |1 2 3;0 1 4;5 6 0|?', opts: ['1', '0', '−1'], ans: 0, expl: '−24+40−15 = 1.', sesat: ['', 'Hitung Sarrus teliti lagi!', 'Cek tanda minusnya!'] },
          { q: 'det matriks segitiga:\n|2 1 3;0 4 5;0 0 6|?', opts: ['48', '12', '24'], ans: 0, expl: 'Segitiga: 2×4×6.', sesat: ['', '2+4+6? Harus KALI!', '2×4×...? Jangan lupa 6!'] },
          { q: 'det I₃ (identitas 3×3)?', opts: ['1', '0', '3'], ans: 0, expl: '1×1×1 = 1.', sesat: ['', 'Bukan nol!', '3 itu ordonya!'] },
        ],
      },
      {
        id: 4, title: 'Sarrus 2', sub: 'Trik cepat',
        questions: [
          { q: 'det |2 1 0;3 2 1;1 0 2|?', opts: ['3', '5', '8'], ans: 0, expl: '8−5 = 3.', sesat: ['', 'Itu baru sebagian!', 'Itu baru suku pertama!'] },
          { q: 'det |1 2 1;2 4 2;3 1 0|?', opts: ['0', '4', '−4'], ans: 0, expl: 'Baris 2 = 2× baris 1 → 0!', sesat: ['', 'Lihat ketergantungan baris!', 'Lihat ketergantungan baris!'] },
          { q: 'Tukar 2 baris, determinan...?', opts: ['Ganti tanda', 'Tetap', 'Jadi nol'], ans: 0, expl: 'Swap = ×(−1).', sesat: ['', 'Tanda BERUBAH!', 'Nol kalau baris kembar!'] },
        ],
      },
      {
        id: 5, title: 'Sifat Det', sub: 'Rumus cepat',
        questions: [
          { q: 'det(AB) = ...?', opts: ['detA·detB', 'detA+detB', 'detA−detB'], ans: 0, expl: 'Determinan perkalian = kali.', sesat: ['', 'Bukan tambah!', 'Bukan kurang!'] },
          { q: 'A 2×2, det(3A)?', opts: ['9·detA', '3·detA', 'detA'], ans: 0, expl: 'Tiap baris ×3: 3².', sesat: ['', '2 baris ikut dikali: 3²!', 'Berubah dong!'] },
          { q: 'det(Aᵀ) = ...?', opts: ['detA', '−detA', '0'], ans: 0, expl: 'Transpose tak mengubah det.', sesat: ['', 'Tidak dinegatifkan!', 'Bukan nol!'] },
        ],
      },
      {
        id: 6, title: 'Det Spesial', sub: 'Pola cantik',
        questions: [
          { q: 'det |1 2 3;4 5 6;7 8 9|?', opts: ['0', '9', '−9'], ans: 0, expl: 'Baris kombinasi linear → 0.', sesat: ['', 'Hitung Sarrus sampai tuntas!', 'Cek lagi!'] },
          { q: 'det |2 0 1;3 1 0;1 2 1|?', opts: ['7', '5', '9'], ans: 0, expl: '2·1 + 1·5 = 7.', sesat: ['', 'Ekspansi baris 1 teliti!', 'Kelebihan 2!'] },
          { q: 'Satu kolom penuh nol → det?', opts: ['0', '1', 'Tak tentu'], ans: 0, expl: 'Pasti nol.', sesat: ['', 'Pasti NOL!', 'Sudah tentu: nol!'] },
        ],
      },
      {
        id: 7, title: 'Kofaktor', sub: 'Tanda +−+',
        questions: [
          { q: 'Ekspansi baris 1 memakai...?', opts: ['Kofaktor + tanda +−+', 'Hanya diagonal', 'Sarrus saja'], ans: 0, expl: 'Kofaktor + pola tanda.', sesat: ['', 'Semua entri ikut!', 'Sarrus cuma jalan pintas!'] },
          { q: 'Tanda kofaktor a₂₃?', opts: ['Negatif', 'Positif', 'Nol'], ans: 0, expl: '(−1)²⁺³ = −.', sesat: ['', '2+3=5 ganjil → negatif!', 'Ada tandanya!'] },
          { q: 'det matriks diagonal 3×3?', opts: ['Kali diagonal', 'Jumlah diagonal', 'Nol'], ans: 0, expl: 'Hasilnya kali diagonal.', sesat: ['', 'Bukan jumlah!', 'Kecuali ada nol!'] },
        ],
      },
      {
        id: 8, title: 'Campuran Det', sub: 'Ujian kilat',
        questions: [
          { q: 'det [4 2;1 3]?', opts: ['10', '14', '8'], ans: 0, expl: '12−2 = 10.', sesat: ['', '12+2? Kurang!', '12−...? Hitung lagi!'] },
          { q: 'det = 5. det(2A) untuk 2×2?', opts: ['20', '10', '5'], ans: 0, expl: '2²×5 = 20.', sesat: ['', '2², bukan 2¹!', 'Berubah!'] },
          { q: 'Matriks singular artinya...?', opts: ['det = 0', 'det = 1', 'Bukan persegi'], ans: 0, expl: 'Singular ⟺ det nol.', sesat: ['', 'det=1 itu UNMODULAR/baik!', 'Singular tetap persegi!'] },
        ],
      },
    ],
  },
  aljP7: {
    id: 'aljP7', title: 'GAUSS & JORDAN', sub: 'OBE • eselon • solusi',
    howto: 'Nolkan bawah (Gauss), teruskan sampai I (Jordan).',
    keywords: 'Eselon • OBE • substitusi mundur',
    levels: [
      {
        id: 1, title: 'Eselon Baris', sub: 'Kenali bentuknya',
        questions: [
          { q: 'Mana bentuk ESELON baris?\nA=[1 2 3;0 1 4;0 0 1]\nB=[0 0 1;0 1 0;1 0 0]\nC=[1 2 0;0 0 1;0 1 0]', opts: ['A', 'B', 'C'], ans: 0, expl: 'Tangga turun rapi.', sesat: ['', 'Tangganya kebalik!', 'Baris 2-3 ketuker tangga!'] },
          { q: 'Baris nol (semua 0) terletak...?', opts: ['Paling bawah', 'Paling atas', 'Bebas'], ans: 0, expl: 'Aturan eselon.', sesat: ['', 'Harus di bawah!', 'Ada aturannya!'] },
          { q: '1 utama tiap baris ada di ... 1 utama baris atasnya?', opts: ['Kanan', 'Kiri', 'Sejajar'], ans: 0, expl: 'Bergeser ke kanan.', sesat: ['', 'Geser ke KANAN!', 'Tidak boleh sejajar!'] },
        ],
      },
      {
        id: 2, title: 'OBE', sub: 'Operasi baris',
        questions: [
          { q: 'Contoh OBE?', opts: ['Tukar dua baris', 'Kali dua matriks', 'Hapus baris'], ans: 0, expl: 'Tukar = OBE tipe 1.', sesat: ['', 'Itu bukan operasi baris!', 'Baris tak boleh dihapus!'] },
          { q: '"R₂ ← R₂ + 3R₁" jenis OBE?', opts: ['Tambah kelipatan baris lain', 'Tukar', 'Kali skalar'], ans: 0, expl: 'OBE tipe 3.', sesat: ['', 'Tidak ada yang ditukar!', 'Ada penambahannya!'] },
          { q: 'OBE yang SALAH?', opts: ['R₁ ← 0×R₁', 'R₁ ↔ R₂', 'R₂ ← R₂+3R₁'], ans: 0, expl: 'Baris tak boleh dinolkan!', sesat: ['', 'Itu sah!', 'Itu sah!'] },
        ],
      },
      {
        id: 3, title: 'Substitusi Mundur', sub: 'Dari bawah',
        questions: [
          { q: 'x+2y = 7 dan y = 2. x = ...?', opts: ['3', '5', '2'], ans: 0, expl: 'x = 7−4 = 3.', sesat: ['', 'Masukkan y=2 dulu!', 'Itu y-nya!'] },
          { q: '2x−y = 1 dan y = 3. x = ...?', opts: ['2', '1', '4'], ans: 0, expl: '2x = 4 → x = 2.', sesat: ['', 'Pindah ruas dulu!', 'Cek: 8−3=5 ≠ 1!'] },
          { q: 'Substitusi mundur mulai dari...?', opts: ['Persamaan bawah', 'Persamaan atas', 'Tengah'], ans: 0, expl: 'Yang sudah ketahuan 1 variabel.', sesat: ['', 'Mulai yang paling sederhana!', 'Mulai dari bawah!'] },
        ],
      },
      {
        id: 4, title: 'Gauss 2 Variabel', sub: 'Eliminasi penuh',
        questions: [
          { q: 'SPL: x+y=5, 2x−y=4. Jumlahkan → ...?', opts: ['3x = 9', 'x = 9', '3y = 1'], ans: 0, expl: 'y habis: 3x = 9.', sesat: ['', 'Bagi 3 dulu!', 'y-nya habis, bukan 3y!'] },
          { q: 'Lanjutan: 3x = 9. x = ...?', opts: ['2', '3', '9'], ans: 1, expl: 'x = 3.', sesat: ['Cek: itu y-nya!', '', 'Bagi 3!'] },
          { q: 'x=3 → y = ...? (x+y=5)', opts: ['2', '3', '1'], ans: 0, expl: 'y = 5−3 = 2.', sesat: ['', 'Itu x-nya!', '5−3, bukan 5−...? Hitung!'] },
        ],
      },
      {
        id: 5, title: 'Gauss-Jordan', sub: 'Sampai identitas',
        questions: [
          { q: 'Beda Gauss-Jordan vs Gauss?', opts: ['Lanjut sampai identitas', 'Berhenti di eselon', 'Tanpa OBE'], ans: 0, expl: 'Jordan teruskan ke atas.', sesat: ['', 'Jordan LEBIH jauh!', 'OBE tetap dipakai!'] },
          { q: 'Hasil akhir Gauss-Jordan SPL unik?', opts: ['[I|x]', 'Eselon biasa', 'Nol'], ans: 0, expl: 'Kiri jadi I, kanan solusi.', sesat: ['', 'Itu baru Gauss!', 'Bukan nol!'] },
          { q: 'SPL 3 variabel butuh ... pivot?', opts: ['3', '2', '1'], ans: 0, expl: 'Satu pivot per variabel.', sesat: ['', 'Tiap variabel 1 pivot!', 'Kurang!'] },
        ],
      },
      {
        id: 6, title: 'Ujian Eliminasi', sub: 'SPL 3 variabel',
        questions: [
          { q: 'x+y+z=6, 2x−y+z=3, x+2y−z=2. x = ...?', opts: ['1', '2', '3'], ans: 0, expl: 'Eliminasi → x = 1.', sesat: ['', 'Cek ke persamaan 1!', 'Cek ke persamaan 2!'] },
          { q: 'Lanjutan SPL di atas. y = ...?', opts: ['1', '2', '3'], ans: 1, expl: 'y = 2.', sesat: ['Itu x-nya!', '', 'Cek: 1+2·3−... ≠ 2!'] },
          { q: 'Lanjutan SPL di atas. z = ...?', opts: ['2', '3', '1'], ans: 1, expl: 'z = 6−1−2 = 3.', sesat: ['6−1−...? Hitung!', '', 'Itu x-nya!'] },
        ],
      },
    ],
  },
};
