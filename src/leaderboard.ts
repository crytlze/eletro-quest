// Leaderboard: online (/api/board via server kelas) + fallback lokal (localStorage stars).
// Dipakai LeaderboardScene. Gagal fetch = offline, tampilkan progres HP ini.

import { getStars, getSession } from './util';

export interface BoardEntry {
  name: string;
  fullname: string;
  stars: number;
  levels: number;
}

export interface BoardResult {
  online: boolean;
  board: BoardEntry[];
  at: number;
}

const LOCAL_COURSES = ['tde', 'atom', 'listrik', 'rl', 'elka', 'digi', 'aljP1', 'aljP2', 'aljP3', 'aljP4', 'aljP5', 'alj', 'aljP7', 'stat', 'prog'];

function localBoard(): BoardEntry[] {
  let stars = 0;
  let levels = 0;
  for (const c of LOCAL_COURSES) {
    try {
      const s = getStars(c);
      levels += Object.keys(s).length;
      stars += Object.values(s).reduce((a, b) => a + b, 0);
    } catch {
      /* abaikan */
    }
  }
  if (stars === 0) return [];
  const sess = getSession();
  return [{ name: sess?.username ?? 'Kamu', fullname: sess?.fullname ?? '', stars, levels }];
}

export async function fetchBoard(): Promise<BoardResult> {
  try {
    const r = await fetch('api/board', { cache: 'no-store' });
    if (!r.ok) throw new Error('no board');
    const j = (await r.json()) as { board: BoardEntry[]; at: number };
    if (!Array.isArray(j.board)) throw new Error('bad board');
    return { online: true, board: j.board.slice(0, 20), at: j.at ?? Date.now() };
  } catch {
    return { online: false, board: localBoard(), at: Date.now() };
  }
}
