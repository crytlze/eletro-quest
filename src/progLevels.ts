// Robot Kode — Dasar Komputer & Pemrograman (sekuens perintah).
// Legenda grid: '#'=tembok '.'=kosong 'O'=lubang 'R'=robot(start,E)
// 'F'=finish '*'=bintang. Perintah: F=maju L=kiri R=kanan.

export type Cmd = 'F' | 'L' | 'R';

export interface ProgLevel {
  id: number;
  title: string;
  sub: string;
  briefing: string;
  hint: string;
  grid: string[];
  par: number;
  limit: number;
}

export const PROG_LEVELS: ProgLevel[] = [
  {
    id: 1, title: 'Maju!', sub: 'Sekuens lurus',
    briefing: 'Susun perintah MAJU 3× untuk sampai ke bendera ⚑.',
    hint: 'F, F, F. Robot mulai menghadap kanan.',
    grid: ['R..F'], par: 3, limit: 5,
  },
  {
    id: 2, title: 'Belok Kanan', sub: 'Perintah belok',
    briefing: 'Bendera ada di bawah. Belokkan robot dulu, baru maju!',
    hint: 'R (hadap bawah), F, F.',
    grid: ['R..', '...', 'F..'], par: 3, limit: 5,
  },
  {
    id: 3, title: 'Zigzag', sub: 'Rute siku',
    briefing: 'Lintasan siku: maju 3, belok, maju 2!',
    hint: 'F F F R F F.',
    grid: ['R...', '....', '...F'], par: 6, limit: 8,
  },
  {
    id: 4, title: 'Ambil Bintang', sub: 'Misi ambil + sampai',
    briefing: 'Injak SEMUA ★ baru finish dihitung. Satu garis lurus!',
    hint: 'F F F F — lewati bintang di tengah.',
    grid: ['R.*.F'], par: 4, limit: 6,
  },
  {
    id: 5, title: 'Jangan Jatuh!', sub: 'Hindari lubang',
    briefing: 'Ada LUBANG 🕳 di jalan. Memutar lewat bawah!',
    hint: 'F R F L F F F L F — turun, lewat, naik lagi.',
    grid: ['R.O.F', '.....', '.....'], par: 9, limit: 10,
  },
  {
    id: 6, title: 'Koridor', sub: 'Labirin tembok',
    briefing: 'Tembok 🧱 di mana-mana. Ikuti satu-satunya koridor!',
    hint: 'R F F L F F L F F R F F R F — 14 langkah.',
    grid: ['R#...', '.#.#F', '...#.'], par: 14, limit: 16,
  },
  {
    id: 7, title: 'Dua Bintang', sub: 'Rute ambil ganda',
    briefing: 'Dua ★ harus diambil sebelum finish!',
    hint: 'F F R F F L F F.',
    grid: ['R.*..', '.....', '..*.F'], par: 8, limit: 10,
  },
  {
    id: 8, title: 'Ujian Labirin', sub: 'Misi akhir 18 langkah',
    briefing: 'Labirin penuh. Rencanakan 18 langkah tanpa nabrak & tanpa jatuh!',
    hint: 'F R F R F L F F L F F F L F F F R F.',
    grid: ['R.#.F', '..#..', '.##..', '.....'], par: 18, limit: 20,
  },
];

export interface ProgState {
  x: number;
  y: number;
  dir: number; // 0=E 1=S 2=W 3=N
  stars: number;
  totalStars: number;
  alive: boolean;
  won: boolean;
  crash: string;
}

export function findProg(lv: ProgLevel): { sx: number; sy: number; fx: number; fy: number; stars: number } {
  let sx = 0;
  let sy = 0;
  let fx = 0;
  let fy = 0;
  let stars = 0;
  lv.grid.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (ch === 'R') { sx = x; sy = y; }
      if (ch === 'F') { fx = x; fy = y; }
      if (ch === '*') stars += 1;
    });
  });
  return { sx, sy, fx, fy, stars };
}

const DX = [1, 0, -1, 0];
const DY = [0, 1, 0, -1];

export function simProg(lv: ProgLevel, prog: Cmd[]): ProgState {
  const meta = findProg(lv);
  const st: ProgState = { x: meta.sx, y: meta.sy, dir: 0, stars: 0, totalStars: meta.stars, alive: true, won: false, crash: '' };
  const got = new Set<string>();
  const rows = lv.grid.length;
  const cols = lv.grid[0].length;
  const at = (x: number, y: number): string => lv.grid[y][x];
  const check = (): void => {
    const key = `${st.x},${st.y}`;
    if (at(st.x, st.y) === '*' && !got.has(key)) {
      got.add(key);
      st.stars += 1;
    }
    if (st.x === meta.fx && st.y === meta.fy && st.stars === meta.stars) st.won = true;
  };
  check();
  for (const c of prog) {
    if (!st.alive || st.won) break;
    if (c === 'L') st.dir = (st.dir + 3) % 4;
    else if (c === 'R') st.dir = (st.dir + 1) % 4;
    else {
      const nx = st.x + DX[c === 'F' ? st.dir : 0];
      const ny = st.y + DY[c === 'F' ? st.dir : 0];
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) {
        st.alive = false;
        st.crash = 'keluar arena';
        break;
      }
      if (at(nx, ny) === '#') {
        st.alive = false;
        st.crash = 'nabrak tembok 🧱';
        break;
      }
      if (at(nx, ny) === 'O') {
        st.x = nx;
        st.y = ny;
        st.alive = false;
        st.crash = 'jatuh ke lubang 🕳';
        break;
      }
      st.x = nx;
      st.y = ny;
      check();
    }
  }
  return st;
}
