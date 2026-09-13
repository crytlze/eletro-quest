// Data level ElectroPuzzle — fokus Rangkaian DC dasar
// Topologi didefinisikan sebagai graph node:
// node 0 = GND, node 1 = V+ (baterai). Node lain bebas.

export interface SlotOption {
  label: string;
  r: number; // ohm, Infinity = putus
  desc: string;
}

export interface SlotDef {
  id: string;
  a: number;
  b: number;
  options: SlotOption[];
  def: number; // index default
}

export interface FixedBranch {
  a: number;
  b: number;
  r: number;
  label: string;
  isLamp?: boolean;
}

export interface Target {
  label: string;
  check: (s: { lampV: number; lampI: number; lampP: number; totalI: number }) => boolean;
  hintOk: string;
}

export interface LevelDef {
  id: number;
  title: string;
  sub: string;
  briefing: string;
  rumus: string;
  vs: number;
  fuse: number;
  numNodes: number;
  nodePos: Record<number, { x: number; y: number }>; // 0..100
  fixed: FixedBranch[];
  slots: SlotDef[];
  targetLabel: string;
  check: (s: { lampV: number; lampI: number; lampP: number; totalI: number }) => boolean;
  hint: string;
  prinsip: string;
  bedah: string[];
}

const INF = Infinity;

export const LEVELS: LevelDef[] = [
  {
    id: 1,
    title: 'Kenalan Ohm',
    sub: 'Hukum Ohm • V = I × R',
    briefing: 'Baterai 9V + lampu 18Ω. Ketuk kotak oranye untuk ganti komponen, lalu tekan POWER. Target: arus lampu ≈ 0.5A.',
    rumus: 'I = V / R = 9 / 18 = 0.5 A',
    vs: 9,
    fuse: 3,
    numNodes: 3,
    nodePos: { 0: { x: 50, y: 82 }, 1: { x: 50, y: 18 }, 2: { x: 78, y: 50 } },
    fixed: [{ a: 2, b: 0, r: 18, label: 'Lampu 18Ω', isLamp: true }],
    slots: [
      {
        id: 'S1', a: 1, b: 2,
        def: 2,
        options: [
          { label: 'Kabel', r: 0.2, desc: 'tanpa hambatan' },
          { label: '9Ω', r: 9, desc: 'seri 9Ω' },
          { label: '18Ω', r: 18, desc: 'seri 18Ω' },
          { label: 'Putus', r: INF, desc: 'rangkaian terbuka' },
        ],
      },
    ],
    targetLabel: 'Target: I lampu 0.45 – 0.55 A',
    check: (s) => s.lampI >= 0.45 && s.lampI <= 0.55,
    hint: 'Total R = R_seri + 18. Supaya I ≈ 0.5A, total harus ≈ 18Ω. Jadi pilih yang R-nya paling kecil.',
    prinsip: 'Hukum Ohm: I = V/R. Tanpa hambatan seri, seluruh 9V jatuh di lampu.',
    bedah: [
      'Diketahui: Vs=9V, lampu 18Ω',
      'Tanpa R seri → total R = 18Ω',
      'I = 9/18 = 0,5A ✓ pas target!',
      'R tambahan hanya mengecilkan arus',
    ],
  },
  {
    id: 2,
    title: 'Pembatas Arus',
    sub: 'Seri • jangan sampai gosong',
    briefing: 'Baterai 9V, lampu 6Ω. Lampu mau arus 0.7–0.85A. Kegedean = overheat, kekecilan = redup.',
    rumus: 'I = 9 / (6 + Rs)',
    vs: 9,
    fuse: 2,
    numNodes: 3,
    nodePos: { 0: { x: 50, y: 82 }, 1: { x: 50, y: 18 }, 2: { x: 78, y: 50 } },
    fixed: [{ a: 2, b: 0, r: 6, label: 'Lampu 6Ω', isLamp: true }],
    slots: [
      {
        id: 'Rs', a: 1, b: 2, def: 0,
        options: [
          { label: '2Ω', r: 2, desc: '' },
          { label: '3Ω', r: 3, desc: '' },
          { label: '6Ω', r: 6, desc: '' },
          { label: '12Ω', r: 12, desc: '' },
        ],
      },
    ],
    targetLabel: 'Target: I lampu 0.70 – 0.85 A',
    check: (s) => s.lampI >= 0.7 && s.lampI <= 0.85,
    hint: 'Coba Rs=6Ω: total 12Ω → I=9/12=0.75A. Pas!',
    prinsip: 'Resistor seri = keran arus. Makin besar R, makin kecil I.',
    bedah: [
      'Target I = 0,75A dari 9V',
      'Total R perlu = 9/0,75 = 12Ω',
      'Lampu sudah 6Ω → tambah 6Ω',
      'Cek: I = 9/12 = 0,75A ✓',
    ],
  },
  {
    id: 3,
    title: 'Pembagi Tegangan',
    sub: 'Seri • KVL',
    briefing: 'Baterai 12V, lampu 12Ω butuh tepat 6V. Atur R seri sebagai pembagi tegangan.',
    rumus: 'V_lampu = 12 × 12/(Rs+12)',
    vs: 12,
    fuse: 3,
    numNodes: 3,
    nodePos: { 0: { x: 50, y: 82 }, 1: { x: 50, y: 18 }, 2: { x: 78, y: 50 } },
    fixed: [{ a: 2, b: 0, r: 12, label: 'Lampu 12Ω', isLamp: true }],
    slots: [
      {
        id: 'Rs', a: 1, b: 2, def: 0,
        options: [
          { label: 'Kabel', r: 0.2, desc: '' },
          { label: '6Ω', r: 6, desc: '' },
          { label: '12Ω', r: 12, desc: '' },
          { label: '24Ω', r: 24, desc: '' },
        ],
      },
    ],
    targetLabel: 'Target: V lampu 5.5 – 6.5 V',
    check: (s) => s.lampV >= 5.5 && s.lampV <= 6.5,
    hint: 'Supaya terbagi 50:50, Rs harus = R_lampu = 12Ω.',
    prinsip: 'Tegangan terbagi sebanding R (KVL: jumlahnya = sumber).',
    bedah: [
      'Mau 6V dari 12V = tepat setengah',
      'Bagi rata → Rs = R lampu = 12Ω',
      'Cek: V = 12×12/24 = 6V ✓',
    ],
  },
  {
    id: 4,
    title: 'Paralel KCL',
    sub: 'Paralel • arus terbagi',
    briefing: 'Sumber 6V. Lampu 12Ω (0.5A) sudah nyala. Tambah cabang paralel supaya total arus = 1.0A (hemat tapi cukup).',
    rumus: 'I_total = I_lampu + I_cabang (KCL)',
    vs: 6,
    fuse: 3,
    numNodes: 2,
    nodePos: { 0: { x: 50, y: 82 }, 1: { x: 50, y: 18 } },
    fixed: [{ a: 1, b: 0, r: 12, label: 'Lampu 12Ω', isLamp: true }],
    slots: [
      {
        id: 'Rp', a: 1, b: 0, def: 3,
        options: [
          { label: '6Ω', r: 6, desc: '' },
          { label: '12Ω', r: 12, desc: '' },
          { label: '24Ω', r: 24, desc: '' },
          { label: 'Putus', r: INF, desc: '' },
        ],
      },
    ],
    targetLabel: 'Target: I total 0.9 – 1.1 A',
    check: (s) => s.totalI >= 0.9 && s.totalI <= 1.1 && s.lampI > 0.4,
    hint: 'Lampu ambil 0.5A. Butuh tambahan 0.5A → R = V/I = 6/0.5 = 12Ω.',
    prinsip: 'Cabang paralel tidak saling ganggu (V sama). KCL: Itotal = jumlah cabang.',
    bedah: [
      'Lampu ambil 0,5A (6V/12Ω)',
      'Butuh total 1,0A → kurang 0,5A',
      'R = 6/0,5 = 12Ω',
      'Lampu tetap 0,5A ✓ (paralel!)',
    ],
  },
  {
    id: 5,
    title: 'Campuran Seri-Paralel',
    sub: 'Reduksi ekuivalen',
    briefing: '12V. Rs seri + (lampu 12Ω || Rp). Bikin tegangan lampu = 6V.',
    rumus: 'V2 = 12 × Rparalel/(Rs+Rparalel)',
    vs: 12,
    fuse: 3,
    numNodes: 3,
    nodePos: { 0: { x: 50, y: 82 }, 1: { x: 50, y: 18 }, 2: { x: 50, y: 50 } },
    fixed: [{ a: 2, b: 0, r: 12, label: 'Lampu 12Ω', isLamp: true }],
    slots: [
      {
        id: 'Rs', a: 1, b: 2, def: 0,
        options: [
          { label: '6Ω', r: 6, desc: '' },
          { label: '12Ω', r: 12, desc: '' },
        ],
      },
      {
        id: 'Rp', a: 2, b: 0, def: 1,
        options: [
          { label: '12Ω', r: 12, desc: '' },
          { label: '24Ω', r: 24, desc: '' },
        ],
      },
    ],
    targetLabel: 'Target: V lampu 5.5 – 6.5 V',
    check: (s) => s.lampV >= 5.5 && s.lampV <= 6.5,
    hint: 'Pilih Rp=12Ω → Rparalel=6Ω. Lalu Rs=6Ω biar terbagi 50:50.',
    prinsip: 'Sederhanakan paralel dulu, lalu jadi pembagi tegangan.',
    bedah: [
      'Rp 12Ω ∥ lampu 12Ω → 6Ω',
      'Rangkaian jadi 6Ω + 6Ω seri',
      'Terbagi 50:50 → V lampu = 6V ✓',
    ],
  },
  {
    id: 6,
    title: 'Hemat Baterai',
    sub: 'Daya • efisiensi',
    briefing: '9V. Lampu utama 18Ω harus tetap nyala (I>0.4A), tapi total < 0.8A. Matikan beban tambahan kalau boros!',
    rumus: 'P_total = V × I_total',
    vs: 9,
    fuse: 3,
    numNodes: 2,
    nodePos: { 0: { x: 50, y: 82 }, 1: { x: 50, y: 18 } },
    fixed: [{ a: 1, b: 0, r: 18, label: 'Lampu 18Ω', isLamp: true }],
    slots: [
      {
        id: 'SW', a: 1, b: 0, def: 0,
        options: [
          { label: 'ON 18Ω', r: 18, desc: 'beban tambahan' },
          { label: 'OFF', r: INF, desc: 'putus' },
        ],
      },
    ],
    targetLabel: 'Target: I lampu > 0.4A & I total < 0.8A',
    check: (s) => s.lampI > 0.4 && s.totalI < 0.8,
    hint: 'Kalau beban tambahan ON, total = 0.5+0.5 = 1.0A (boros). OFF-kan!',
    prinsip: 'Daya total P = V×Itotal. Matikan beban yang tak perlu!',
    bedah: [
      'Lampu butuh 0,5A (lolos > 0,4 ✓)',
      'Beban ON → total 1,0A, boros ✗',
      'Beban OFF → total 0,5A ✓ hemat!',
    ],
  },
  {
    id: 7,
    title: 'Awas Korslet!',
    sub: 'Fuse • hubung singkat',
    briefing: '12V, fuse 2A. Lampu 12Ω (1A). Cari R paralel supaya total 1.4–1.6A. Kabel = korslet!',
    rumus: 'Kabel 0.2Ω → I = 12/0.2 = 60A!',
    vs: 12,
    fuse: 2,
    numNodes: 2,
    nodePos: { 0: { x: 50, y: 82 }, 1: { x: 50, y: 18 } },
    fixed: [{ a: 1, b: 0, r: 12, label: 'Lampu 12Ω', isLamp: true }],
    slots: [
      {
        id: 'Rp', a: 1, b: 0, def: 2,
        options: [
          { label: '12Ω', r: 12, desc: '' },
          { label: '24Ω', r: 24, desc: '' },
          { label: 'Kabel!', r: 0.2, desc: 'short!' },
          { label: 'Putus', r: INF, desc: '' },
        ],
      },
    ],
    targetLabel: 'Target: I total 1.4 – 1.6 A, fuse aman',
    check: (s) => s.totalI >= 1.4 && s.totalI <= 1.6 && s.totalI <= 2,
    hint: 'Butuh tambahan 0.5A → R = 12/0.5 = 24Ω. Jangan pilih kabel!',
    prinsip: 'Kabel ≈ 0Ω → arus raksasa → fuse putus. Fuse itu berkorban!',
    bedah: [
      'Lampu ambil 1,0A (12V/12Ω)',
      'Butuh total 1,5A → tambah 0,5A',
      'R = 12/0,5 = 24Ω',
      'Kabel? I = 12/0,2 = 60A, boom!',
    ],
  },
  {
    id: 8,
    title: 'Ujian Akhir Lab',
    sub: 'Gabungan semua',
    briefing: '12V. R1 seri + (lampu 12Ω || R2). Target V lampu 5.5–6.5V. Ada 2 solusi — cari yang paling hemat!',
    rumus: 'R1 = R_lampu || R2',
    vs: 12,
    fuse: 4,
    numNodes: 3,
    nodePos: { 0: { x: 50, y: 82 }, 1: { x: 50, y: 18 }, 2: { x: 50, y: 50 } },
    fixed: [{ a: 2, b: 0, r: 12, label: 'Lampu 12Ω', isLamp: true }],
    slots: [
      {
        id: 'R1', a: 1, b: 2, def: 0,
        options: [
          { label: '4Ω', r: 4, desc: '' },
          { label: '6Ω', r: 6, desc: '' },
          { label: '12Ω', r: 12, desc: '' },
        ],
      },
      {
        id: 'R2', a: 2, b: 0, def: 0,
        options: [
          { label: '6Ω', r: 6, desc: '' },
          { label: '12Ω', r: 12, desc: '' },
          { label: '24Ω', r: 24, desc: '' },
        ],
      },
    ],
    targetLabel: 'Target: V lampu 5.5 – 6.5 V',
    check: (s) => s.lampV >= 5.5 && s.lampV <= 6.5,
    hint: '(R1=6,R2=12) atau (R1=4,R2=6). Yang kedua total arusnya lebih besar — kurang hemat.',
    prinsip: 'Gabungan seri-paralel: cari R ekuivalen, samakan dengan Rs.',
    bedah: [
      '12Ω ∥ 12Ω → Rparalel = 6Ω',
      'Rs = 6Ω → terbagi 50:50',
      'V lampu = 6V ✓, arus total hemat',
    ],
  },
  {
    id: 9,
    title: 'Daya Lampu',
    sub: 'Daya • P = I²R',
    briefing: 'Baterai 12V, lampu 12Ω. Atur R seri supaya daya lampu pas 3 watt (tidak redup, tidak gosong).',
    rumus: 'P = I² × R = 0.5² × 12 = 3 W',
    vs: 12,
    fuse: 3,
    numNodes: 3,
    nodePos: { 0: { x: 50, y: 82 }, 1: { x: 50, y: 18 }, 2: { x: 78, y: 50 } },
    fixed: [{ a: 2, b: 0, r: 12, label: 'Lampu 12Ω', isLamp: true }],
    slots: [
      {
        id: 'Rs', a: 1, b: 2, def: 0,
        options: [
          { label: '6Ω', r: 6, desc: '' },
          { label: '12Ω', r: 12, desc: '' },
          { label: '24Ω', r: 24, desc: '' },
          { label: 'Kabel', r: 0.2, desc: '' },
        ],
      },
    ],
    targetLabel: 'Target: P lampu 2,7 – 3,3 W',
    check: (s) => s.lampP >= 2.7 && s.lampP <= 3.3,
    hint: 'Butuh I = 0,5A → total R = 24Ω → Rs = 12Ω. Kabel bikin 11,6W (gosong!).',
    prinsip: 'Daya P = V×I = I²R. Daya pas = terang pas.',
    bedah: [
      'Target P = 3W di lampu 12Ω',
      'I perlu = √(3/12) = 0,5A',
      'Total R = 12/0,5 = 24Ω → Rs = 12Ω',
      'Kabel → 11,6W, gosong!',
    ],
  },
  {
    id: 10,
    title: 'Dua Lampu Seri',
    sub: 'Seri • bagi rata',
    briefing: 'Baterai 12V, dua lampu 6Ω seri. Atur Rs supaya tiap lampu dapat 4V (terang seimbang).',
    rumus: 'V_tiap = 12 × 6/(Rs+12)',
    vs: 12,
    fuse: 3,
    numNodes: 4,
    nodePos: { 0: { x: 50, y: 82 }, 1: { x: 50, y: 18 }, 2: { x: 78, y: 35 }, 3: { x: 78, y: 65 } },
    fixed: [
      { a: 2, b: 3, r: 6, label: 'Lampu A 6Ω', isLamp: true },
      { a: 3, b: 0, r: 6, label: 'Lampu B 6Ω' },
    ],
    slots: [
      {
        id: 'Rs', a: 1, b: 2, def: 0,
        options: [
          { label: 'Kabel', r: 0.2, desc: '' },
          { label: '6Ω', r: 6, desc: '' },
          { label: '12Ω', r: 12, desc: '' },
          { label: 'Putus', r: INF, desc: '' },
        ],
      },
    ],
    targetLabel: 'Target: V lampu A 3,5 – 4,5 V',
    check: (s) => s.lampV >= 3.5 && s.lampV <= 4.5,
    hint: 'Mau 4V per lampu dari 12V → Rs harus = 6Ω (4V + 4V + 4V pas 12V).',
    prinsip: 'Seri = arus sama, tegangan berbagi. R sama → bagi rata.',
    bedah: [
      'Mau 4V + 4V + sisa 4V = 12V',
      'Tiap bagian 4V → R harus sama',
      'Rs = 6Ω = tiap lampu ✓',
    ],
  },
  {
    id: 11,
    title: 'Paralel Jumbo',
    sub: 'Paralel • arus besar',
    briefing: 'Sumber 12V. Lampu 24Ω (0,5A) + 1 cabang paralel. Bikin total tepat 1,5A.',
    rumus: 'I_total = 0,5 + 12/Rp',
    vs: 12,
    fuse: 3,
    numNodes: 2,
    nodePos: { 0: { x: 50, y: 82 }, 1: { x: 50, y: 18 } },
    fixed: [{ a: 1, b: 0, r: 24, label: 'Lampu 24Ω', isLamp: true }],
    slots: [
      {
        id: 'Rp', a: 1, b: 0, def: 3,
        options: [
          { label: '6Ω', r: 6, desc: '' },
          { label: '12Ω', r: 12, desc: '' },
          { label: '24Ω', r: 24, desc: '' },
          { label: 'Putus', r: INF, desc: '' },
        ],
      },
    ],
    targetLabel: 'Target: I total 1,4 – 1,6 A',
    check: (s) => s.totalI >= 1.4 && s.totalI <= 1.6 && s.lampI > 0.4,
    hint: 'Kurang 1,0A dari cabang baru → Rp = 12/1 = 12Ω.',
    prinsip: 'KCL: tambah cabang = tambah arus. Total = jumlah semua.',
    bedah: [
      'Lampu: 0,5A. Target: 1,5A',
      'Kurang 1,0A dari cabang baru',
      'Rp = 12/1,0 = 12Ω ✓',
    ],
  },
  {
    id: 12,
    title: 'Saklar Pilih',
    sub: 'Switch • pilih beban',
    briefing: '9V. S1 seri lampu utama 18Ω, S2 ke beban tambahan 18Ω. Nyalakan lampu UTAMA saja (total < 0,8A)!',
    rumus: 'S1 ON + S2 OFF → I = 0,5A',
    vs: 9,
    fuse: 3,
    numNodes: 3,
    nodePos: { 0: { x: 50, y: 82 }, 1: { x: 50, y: 18 }, 2: { x: 78, y: 50 } },
    fixed: [{ a: 2, b: 0, r: 18, label: 'Lampu 18Ω', isLamp: true }],
    slots: [
      {
        id: 'S1', a: 1, b: 2, def: 1,
        options: [
          { label: 'ON', r: 0.2, desc: 'saklar tutup' },
          { label: 'OFF', r: INF, desc: 'saklar buka' },
        ],
      },
      {
        id: 'S2', a: 1, b: 0, def: 0,
        options: [
          { label: 'ON 18Ω', r: 18, desc: 'beban tambahan' },
          { label: 'OFF', r: INF, desc: 'putus' },
        ],
      },
    ],
    targetLabel: 'Target: I lampu > 0,4A & I total < 0,8A',
    check: (s) => s.lampI > 0.4 && s.totalI < 0.8,
    hint: 'S1 harus ON (kalau OFF lampu mati). S2 harus OFF (kalau ON total jadi 1,0A).',
    prinsip: 'Saklar seri = nyala/mati beban itu. Saklar paralel = tambah total.',
    bedah: [
      'S1 OFF → lampu mati total (0A) ✗',
      'S2 ON → total 1,0A, boros ✗',
      'S1 ON + S2 OFF → 0,5A ✓',
    ],
  },
  {
    id: 13,
    title: 'Tiga Cabang',
    sub: 'Paralel 3 cabang • KCL',
    briefing: 'Sumber 12V. Lampu 24Ω + 2 cabang paralel (A dan B). Bikin total tepat 2,0A!',
    rumus: 'I = 0,5 + 12/RA + 12/RB',
    vs: 12,
    fuse: 3,
    numNodes: 2,
    nodePos: { 0: { x: 50, y: 82 }, 1: { x: 50, y: 18 } },
    fixed: [{ a: 1, b: 0, r: 24, label: 'Lampu 24Ω', isLamp: true }],
    slots: [
      {
        id: 'RA', a: 1, b: 0, def: 2,
        options: [
          { label: '12Ω', r: 12, desc: '' },
          { label: '36Ω', r: 36, desc: '' },
          { label: 'Putus', r: INF, desc: '' },
        ],
      },
      {
        id: 'RB', a: 1, b: 0, def: 2,
        options: [
          { label: '24Ω', r: 24, desc: '' },
          { label: '36Ω', r: 36, desc: '' },
          { label: 'Putus', r: INF, desc: '' },
        ],
      },
    ],
    targetLabel: 'Target: I total 1,9 – 2,1 A',
    check: (s) => s.totalI >= 1.9 && s.totalI <= 2.1 && s.lampI > 0.4,
    hint: 'Butuh tambahan 1,5A: 1,0A dari A (12Ω) + 0,5A dari B (24Ω).',
    prinsip: 'KCL untuk N cabang: Itotal = I1 + I2 + I3.',
    bedah: [
      'Lampu: 0,5A. Target: 2,0A',
      'Butuh 1,5A dari A + B',
      'A=12Ω (1,0A) + B=24Ω (0,5A) ✓',
    ],
  },
  {
    id: 14,
    title: 'Mode Hemat Ganda',
    sub: 'Daya • 2 beban ekstra',
    briefing: '12V. Lampu 12Ω harus nyala (I > 0,4A), total < 1,3A. Dua beban ekstra menggoda — matikan semua!',
    rumus: 'Lampu ON saja → I = 1,0A',
    vs: 12,
    fuse: 3,
    numNodes: 2,
    nodePos: { 0: { x: 50, y: 82 }, 1: { x: 50, y: 18 } },
    fixed: [{ a: 1, b: 0, r: 12, label: 'Lampu 12Ω', isLamp: true }],
    slots: [
      {
        id: 'SA', a: 1, b: 0, def: 0,
        options: [
          { label: 'ON 12Ω', r: 12, desc: '' },
          { label: 'OFF', r: INF, desc: '' },
        ],
      },
      {
        id: 'SB', a: 1, b: 0, def: 0,
        options: [
          { label: 'ON 12Ω', r: 12, desc: '' },
          { label: 'OFF', r: INF, desc: '' },
        ],
      },
    ],
    targetLabel: 'Target: I lampu > 0,4A & I total < 1,3A',
    check: (s) => s.lampI > 0.4 && s.totalI < 1.3,
    hint: 'Tiap beban ON nambah 1A. Lampu sendiri sudah 1,0A — tidak ada ruang buat beban!',
    prinsip: 'Tiap beban paralel nambah arus penuh. Hemat = matikan semua!',
    bedah: [
      'Lampu sendiri 1,0A (< 1,3 ✓)',
      'Satu beban ON → total 2,0A ✗',
      'Matikan SA & SB ✓',
    ],
  },
  {
    id: 15,
    title: 'Ujian Campuran 2',
    sub: 'Seri-paralel • presisi',
    briefing: '9V. Rs seri + (lampu 6Ω || Rp). Bikin V lampu 4,2 – 4,8V.',
    rumus: 'V = 9 × Rparalel/(Rs+Rparalel)',
    vs: 9,
    fuse: 3,
    numNodes: 3,
    nodePos: { 0: { x: 50, y: 82 }, 1: { x: 50, y: 18 }, 2: { x: 50, y: 50 } },
    fixed: [{ a: 2, b: 0, r: 6, label: 'Lampu 6Ω', isLamp: true }],
    slots: [
      {
        id: 'Rs', a: 1, b: 2, def: 1,
        options: [
          { label: '3Ω', r: 3, desc: '' },
          { label: '6Ω', r: 6, desc: '' },
        ],
      },
      {
        id: 'Rp', a: 2, b: 0, def: 1,
        options: [
          { label: '6Ω', r: 6, desc: '' },
          { label: '12Ω', r: 12, desc: '' },
        ],
      },
    ],
    targetLabel: 'Target: V lampu 4,2 – 4,8 V',
    check: (s) => s.lampV >= 4.2 && s.lampV <= 4.8,
    hint: 'Rp=6Ω → Rparalel=3Ω. Lalu Rs=3Ω biar terbagi 50:50 → 4,5V.',
    prinsip: 'Pola Level 5: paralel dulu, baru bagi tegangan.',
    bedah: [
      '6Ω ∥ 6Ω → Rparalel = 3Ω',
      'Rs = 3Ω → terbagi 50:50',
      'V = 9/2 = 4,5V ✓',
    ],
  },
  {
    id: 16,
    title: 'Proyek Akhir',
    sub: 'Tegangan besar • presisi',
    briefing: 'Sumber 24V! Rs seri + (lampu 8Ω || Rp). Bikin V lampu tepat 7,5 – 8,5V. Hati-hati, angka besar!',
    rumus: 'V = 24 × Rparalel/(Rs+Rparalel)',
    vs: 24,
    fuse: 3,
    numNodes: 3,
    nodePos: { 0: { x: 50, y: 82 }, 1: { x: 50, y: 18 }, 2: { x: 50, y: 50 } },
    fixed: [{ a: 2, b: 0, r: 8, label: 'Lampu 8Ω', isLamp: true }],
    slots: [
      {
        id: 'Rs', a: 1, b: 2, def: 1,
        options: [
          { label: '8Ω', r: 8, desc: '' },
          { label: '16Ω', r: 16, desc: '' },
        ],
      },
      {
        id: 'Rp', a: 2, b: 0, def: 1,
        options: [
          { label: '8Ω', r: 8, desc: '' },
          { label: '24Ω', r: 24, desc: '' },
        ],
      },
    ],
    targetLabel: 'Target: V lampu 7,5 – 8,5 V',
    check: (s) => s.lampV >= 7.5 && s.lampV <= 8.5,
    hint: 'Rp=8Ω → Rparalel=4Ω. Rs=8Ω → terbagi 1:2 → 8V. Pas!',
    prinsip: 'Prinsip sama, angka besar. Teliti = master.',
    bedah: [
      '8Ω ∥ 8Ω → Rparalel = 4Ω',
      'Rs = 8Ω → perbandingan 1:2',
      'V = 24×4/12 = 8V ✓',
    ],
  },
];
