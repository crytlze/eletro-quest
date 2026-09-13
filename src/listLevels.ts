// Bank soal Dasar Kelistrikan — konsep, satuan, alat ukur.
// 8 level x 3 soal. Jawaban disebar di posisi 0/1/2.

export interface ListQ {
  q: string;
  opts: [string, string, string];
  ans: number;
  expl: string;
  sesat: [string, string, string];
}

export interface ListLevel {
  id: number;
  title: string;
  sub: string;
  questions: [ListQ, ListQ, ListQ];
}

export const LIST_LEVELS: ListLevel[] = [
  {
    id: 1, title: 'Satuan Listrik', sub: 'Volt • ampere • ohm',
    questions: [
      { q: 'Satuan tegangan listrik?', opts: ['Ampere', 'Volt', 'Ohm'], ans: 1, expl: 'Tegangan → volt (V).', sesat: ['Ampere itu satuan ARUS!', '', 'Ohm itu satuan HAMBATAN!'] },
      { q: 'Satuan arus listrik?', opts: ['Volt', 'Ampere', 'Watt'], ans: 1, expl: 'Arus → ampere (A).', sesat: ['Volt itu satuan TEGANGAN!', '', 'Watt itu satuan DAYA!'] },
      { q: 'Satuan hambatan listrik?', opts: ['Ohm', 'Volt', 'Joule'], ans: 0, expl: 'Hambatan → ohm (Ω).', sesat: ['', 'Volt = tegangan!', 'Joule = energi!'] },
    ],
  },
  {
    id: 2, title: 'Alat Ukur', sub: 'Seri vs paralel',
    questions: [
      { q: 'Voltmeter dipasang secara...?', opts: ['Seri', 'Paralel', 'Bebas'], ans: 1, expl: 'Voltmeter paralel dengan beban.', sesat: ['Seri itu buat AMPEREMETER!', '', 'Sembarang pasang bisa korslet/merusak!'] },
      { q: 'Amperemeter dipasang secara...?', opts: ['Seri', 'Paralel', 'Bebas'], ans: 0, expl: 'Amperemeter seri — arus lewat alat.', sesat: ['', 'Paralel bikin amperemeter korslet-terbakar!', 'Tetap harus seri supaya arus lewat alat!'] },
      { q: 'Mode Ω pada multimeter mengukur...?', opts: ['Arus', 'Tegangan', 'Hambatan'], ans: 2, expl: 'Ω = hambatan.', sesat: ['Arus diukur mode A!', 'Tegangan diukur mode V!', ''] },
    ],
  },
  {
    id: 3, title: 'Bahan Listrik', sub: 'Konduktor • isolator',
    questions: [
      { q: 'Konduktor terbaik berikut?', opts: ['Tembaga', 'Karet', 'Plastik'], ans: 0, expl: 'Tembaga penghantar ulung untuk kabel.', sesat: ['', 'Karet ISOLATOR (gagang obeng)!', 'Plastik ISOLATOR (bungkus kabel)!'] },
      { q: 'Isolator berikut?', opts: ['Aluminium', 'Besi', 'Kaca'], ans: 2, expl: 'Kaca menahan arus (isolator).', sesat: ['Aluminium konduktor — dipakai kabel PLN!', 'Besi konduktor!', ''] },
      { q: 'Kenapa kabel dilapisi plastik?', opts: ['Agar kuat', 'Agar aman', 'Agar ringan'], ans: 1, expl: 'Plastik isolator → aman dipegang.', sesat: ['Kuat sih iya, tapi tujuan utamanya keamanan!', '', 'Ringan itu bonus — tujuannya isolasi!'] },
    ],
  },
  {
    id: 4, title: 'Muatan & Arus', sub: 'Arah • pembawa muatan',
    questions: [
      { q: 'Arah arus konvensional?', opts: ['+ ke −', '− ke +', 'Acak'], ans: 0, expl: 'Konvensi: dari + ke −.', sesat: ['', 'Itu arah ELEKTRON, bukan arus konvensional!', 'Arus punya arah pasti, tidak acak!'] },
      { q: 'Pembawa muatan di logam?', opts: ['Proton', 'Elektron', 'Neutron'], ans: 1, expl: 'Elektron bebas bergerak di logam.', sesat: ['Proton terkunci di inti, tidak bergerak!', '', 'Neutron netral & terkunci di inti!'] },
      { q: '1 ampere artinya...?', opts: ['1 volt/detik', '1 coulomb/detik', '1 ohm/detik'], ans: 1, expl: 'Arus = muatan per detik.', sesat: ['Volt/detik bukan satuan arus!', '', 'Ohm/detik tidak ada artinya!'] },
    ],
  },
  {
    id: 5, title: 'Hukum Ohm', sub: 'V = I × R',
    questions: [
      { q: 'V=12V, R=4Ω. Arusnya?', opts: ['3A', '48A', '8A'], ans: 0, expl: 'I = 12/4 = 3A.', sesat: ['', '48 = 12×4 — rumusnya BAGI, bukan kali!', '8 = 12−4? Jangan dikurang, dibagi!'] },
      { q: 'V tetap, R naik 2× lipat. Arus...?', opts: ['Naik 2×', 'Turun setengah', 'Tetap'], ans: 1, expl: 'I = V/R — R naik, I turun.', sesat: ['Terbalik! Penyebut besar → hasil kecil.', '', 'R berubah, I pasti ikut berubah!'] },
      { q: 'I=2A lewat R=5Ω. Tegangannya?', opts: ['10V', '2,5V', '7V'], ans: 0, expl: 'V = 2×5 = 10V.', sesat: ['', '2,5 = 5/2? Rumusnya KALI: V = I×R!', '7 = 2+5? Tegangan = kali, bukan tambah!'] },
    ],
  },
  {
    id: 6, title: 'Daya & Energi', sub: 'Watt • joule • kWh',
    questions: [
      { q: 'Lampu 12V × 2A. Dayanya?', opts: ['24W', '6W', '10W'], ans: 0, expl: 'P = 12×2 = 24W.', sesat: ['', '6 = 12/2? Daya = KALI: P = V×I!', '10 = 12−2? Bukan kurang-kurangan!'] },
      { q: 'Satuan energi listrik?', opts: ['Watt', 'Joule', 'Ampere'], ans: 1, expl: 'Energi → joule (watt = daya).', sesat: ['Watt = DAYA (laju energi), bukan energi!', '', 'Ampere = arus!'] },
      { q: '1 kWh sama dengan...?', opts: ['1000 joule', '3,6 juta joule', '100 watt'], ans: 1, expl: '1000W × 3600s = 3,6 juta joule.', sesat: ['1000 joule terlalu kecil — itu cuma 1 kJ!', '', '100 watt itu DAYA, bukan energi!'] },
    ],
  },
  {
    id: 7, title: 'Seri vs Paralel', sub: 'Konsep nyala lampu',
    questions: [
      { q: 'Dua lampu identik dipasang SERI dibanding satu lampu?', opts: ['Lebih terang', 'Lebih redup', 'Sama'], ans: 1, expl: 'Tegangan terbagi → redup.', sesat: ['Terbalik! Tegangan terbagi → redup.', '', 'R total naik → arus turun → redup!'] },
      { q: 'Dua lampu identik dipasang PARALEL dibanding satu lampu?', opts: ['Lebih terang', 'Lebih redup', 'Sama terang'], ans: 2, expl: 'Tegangan penuh di tiap lampu.', sesat: ['Tegangan tetap penuh — tidak lebih terang!', 'Paralel tidak membagi tegangan!', ''] },
      { q: 'Fuse putus karena...?', opts: ['Tegangan turun', 'Arus berlebih', 'Hambatan besar'], ans: 1, expl: 'Arus berlebih melelehkan fuse.', sesat: ['Fuse tidak peduli tegangan turun!', '', 'Hambatan besar justru bikin arus KECIL!'] },
    ],
  },
  {
    id: 8, title: 'Ujian Akhir', sub: 'Campuran',
    questions: [
      { q: 'Elektron bermuatan...?', opts: ['Positif', 'Negatif', 'Netral'], ans: 1, expl: 'Elektron = negatif, proton = positif.', sesat: ['Positif itu PROTON!', '', 'Netral itu NEUTRON!'] },
      { q: 'Kawat makin panjang, hambatannya...?', opts: ['Makin besar', 'Makin kecil', 'Tetap'], ans: 0, expl: 'R = ρL/A — L naik, R naik.', sesat: ['', 'Terbalik! R = ρL/A — L naik, R naik.', 'Panjang mengubah hambatan!'] },
      { q: 'Lampu 60W/220V. Arusnya?', opts: ['0,27A', '3,6A', '13A'], ans: 0, expl: 'I = 60/220 ≈ 0,27A.', sesat: ['', 'I = P/V = 60/220, bukan 220/60!', '13A itu buat beban ~3000W!'] },
    ],
  },
];
