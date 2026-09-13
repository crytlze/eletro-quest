// Gerbang logika (Elektronika Digital). Evaluasi DAG boolean.
// Sumber: 'IN0'.. atau 'G<id>'. Gerbang diurut topologis di data.

export type GateType = 'AND' | 'OR' | 'XOR' | 'NAND' | 'NOR' | 'NOT';

export interface DigiGate {
  id: string;
  type: GateType | null; // null = slot pilihan pemain
  options?: GateType[];
  def?: number;
  ins: string[];
}

export interface DigiLevel {
  id: number;
  title: string;
  sub: string;
  briefing: string;
  hint: string;
  inputs: string[];
  gates: DigiGate[];
  out: string;
  expect: number[]; // output per baris (baris = biner, IN0 = LSB)
}

export function evalGate(t: GateType, vals: number[]): number {
  const b = vals.map((v) => v > 0);
  switch (t) {
    case 'AND': return b.every(Boolean) ? 1 : 0;
    case 'OR': return b.some(Boolean) ? 1 : 0;
    case 'XOR': return b.filter(Boolean).length % 2 === 1 ? 1 : 0;
    case 'NAND': return b.every(Boolean) ? 0 : 1;
    case 'NOR': return b.some(Boolean) ? 0 : 1;
    case 'NOT': return b[0] ? 0 : 1;
  }
}

export function evalCircuit(lv: DigiLevel, types: Record<string, GateType>, row: number): number {
  const sig = new Map<string, number>();
  lv.inputs.forEach((nm, i) => sig.set(nm, (row >> i) & 1));
  for (const g of lv.gates) {
    const t = g.type ?? types[g.id];
    sig.set(g.id, evalGate(t, g.ins.map((s) => sig.get(s) ?? 0)));
  }
  return sig.get(lv.out) ?? 0;
}

export function checkCircuit(lv: DigiLevel, types: Record<string, GateType>): { ok: boolean; badRow: number } {
  const n = 1 << lv.inputs.length;
  for (let r = 0; r < n; r++) {
    if (evalCircuit(lv, types, r) !== lv.expect[r]) return { ok: false, badRow: r };
  }
  return { ok: true, badRow: -1 };
}

export function rowLabel(lv: DigiLevel, row: number): string {
  return lv.inputs.map((nm, i) => `${nm}=${(row >> i) & 1}`).join(' ');
}

export const DIGI_LEVELS: DigiLevel[] = [
  {
    id: 1, title: 'Pembalik', sub: 'NOT • inverter',
    briefing: 'Satu input, satu slot. Bikin output selalu KEBALIKAN input!',
    hint: 'Butuh gerbang NOT. AND/OR 1-input = buffer (lolos terus).',
    inputs: ['A'], gates: [{ id: 'G0', type: null, options: ['NOT', 'AND', 'OR'], def: 1, ins: ['A'] }],
    out: 'G0', expect: [1, 0],
  },
  {
    id: 2, title: 'Dan', sub: 'AND 2 input',
    briefing: 'Output 1 hanya kalau A DAN B dua-duanya 1!',
    hint: 'Itu definisi AND.',
    inputs: ['A', 'B'], gates: [{ id: 'G0', type: null, options: ['AND', 'OR', 'XOR'], def: 1, ins: ['A', 'B'] }],
    out: 'G0', expect: [0, 0, 0, 1],
  },
  {
    id: 3, title: 'Beda', sub: 'XOR • beda itu nyala',
    briefing: 'Output 1 hanya kalau A dan B BERBEDA!',
    hint: 'Beda = XOR.',
    inputs: ['A', 'B'], gates: [{ id: 'G0', type: null, options: ['AND', 'OR', 'XOR'], def: 0, ins: ['A', 'B'] }],
    out: 'G0', expect: [0, 1, 1, 0],
  },
  {
    id: 4, title: 'NAND Serbaguna', sub: 'AND + NOT sekaligus',
    briefing: 'Output 0 hanya kalau A dan B dua-duanya 1. Kebalikan AND!',
    hint: 'NAND = NOT(AND).',
    inputs: ['A', 'B'], gates: [{ id: 'G0', type: null, options: ['AND', 'NAND', 'OR'], def: 0, ins: ['A', 'B'] }],
    out: 'G0', expect: [1, 1, 1, 0],
  },
  {
    id: 5, title: 'AND dari NAND', sub: 'Gerbang universal',
    briefing: 'G0 sudah NAND. Tambah 1 gerbang supaya hasil akhir = AND. (NAND itu universal!)',
    hint: 'NOT(NAND(A,B)) = AND(A,B). Slot G1 = NOT.',
    inputs: ['A', 'B'],
    gates: [
      { id: 'G0', type: 'NAND', ins: ['A', 'B'] },
      { id: 'G1', type: null, options: ['AND', 'OR', 'NOT'], def: 0, ins: ['G0'] },
    ],
    out: 'G1', expect: [0, 0, 0, 1],
  },
  {
    id: 6, title: 'Half-Adder', sub: 'Penjumlah 1-bit',
    briefing: 'S = A xor B (G0, slotmu), C = AND (sudah dipasang). Cocokkan S DAN C!',
    hint: 'S = XOR. C ngikut otomatis dari gerbang AND.',
    inputs: ['A', 'B'],
    gates: [
      { id: 'G0', type: null, options: ['AND', 'OR', 'XOR'], def: 0, ins: ['A', 'B'] },
      { id: 'GC', type: 'AND', ins: ['A', 'B'] },
    ],
    out: 'G0', expect: [0, 1, 1, 0],
  },
  {
    id: 7, title: 'Penyeleksi', sub: 'MUX 2-ke-1',
    briefing: 'S=0 → OUT=A, S=1 → OUT=B. G0..G2 sudah dipasang, tentukan G3!',
    hint: 'OUT = (A·~S) + (B·S). Dua suku digabung pakai OR.',
    inputs: ['A', 'B', 'S'],
    gates: [
      { id: 'G0', type: 'NOT', ins: ['S'] },
      { id: 'G1', type: 'AND', ins: ['A', 'G0'] },
      { id: 'G2', type: 'AND', ins: ['B', 'S'] },
      { id: 'G3', type: null, options: ['OR', 'AND', 'NOR'], def: 1, ins: ['G1', 'G2'] },
    ],
    out: 'G3', expect: [0, 0, 0, 1, 1, 0, 1, 1],
  },
  {
    id: 8, title: 'Full-Adder Sum', sub: 'Penjumlah + Cin',
    briefing: 'S = A ⊕ B ⊕ Cin. G0 = XOR(A,B) sudah ada. Tentukan G1!',
    hint: 'S = G0 ⊕ Cin. Slot G1 = XOR.',
    inputs: ['A', 'B', 'C'],
    gates: [
      { id: 'G0', type: 'XOR', ins: ['A', 'B'] },
      { id: 'G1', type: null, options: ['AND', 'OR', 'XOR'], def: 0, ins: ['G0', 'C'] },
    ],
    out: 'G1', expect: [0, 1, 1, 0, 1, 0, 0, 1],
  },
];
