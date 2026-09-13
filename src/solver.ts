// Solver DC sederhana (Modified Nodal Analysis versi minimal)
// Asumsi: 1 sumber tegangan ideal antara node 1 (+) dan node 0 (GND)
// Sisanya resistor / kabel / open. Cukup untuk puzzle seri-paralel DC.

export interface BranchInput {
  a: number;
  b: number;
  r: number; // ohm, Infinity = open
  label: string;
  isLamp?: boolean;
}

export interface SolveResult {
  nodeV: number[]; // index = node id
  branchI: number[]; // searah a -> b
  branchV: number[];
  totalI: number; // arus keluar dari sumber (+) , A
  lampV: number;
  lampI: number;
  lampP: number;
  blown: boolean;
  open: boolean;
  connected: boolean;
}

const WIRE_R = 0.2;
const OPEN_R = 1e9;

export function normR(r: number): number {
  if (!isFinite(r) || r >= 1e8) return OPEN_R;
  return Math.max(WIRE_R * 0 + 0.2, r); // kabel = 0.2 ohm
}

export function solveCircuit(
  vs: number,
  numNodes: number,
  branches: BranchInput[],
  fuseLimit: number
): SolveResult {
  const nodeV = new Array<number>(numNodes).fill(0);
  nodeV[0] = 0;
  if (numNodes > 1) nodeV[1] = vs;

  // nodes yang unknown: selain 0 dan 1
  const unknowns: number[] = [];
  for (let n = 0; n < numNodes; n++) {
    if (n !== 0 && n !== 1) unknowns.push(n);
  }
  const idx = new Map<number, number>();
  unknowns.forEach((n, i) => idx.set(n, i));
  const k = unknowns.length;

  let connected = true;

  if (k > 0) {
    const A: number[][] = Array.from({ length: k }, () => new Array<number>(k).fill(0));
    const b: number[] = new Array<number>(k).fill(0);

    for (const br of branches) {
      const r = normR(br.r);
      if (r >= 1e8) continue;
      const G = 1 / r;
      for (const [node, other] of [[br.a, br.b], [br.b, br.a]] as const) {
        if (!idx.has(node)) continue;
        const i = idx.get(node)!;
        A[i][i] += G;
        if (idx.has(other)) {
          const j = idx.get(other)!;
          A[i][j] -= G;
        } else {
          const vFixed = other === 0 ? 0 : other === 1 ? vs : 0;
          b[i] += G * vFixed;
        }
      }
    }

    const x = gaussSolve(A, b);
    if (!x) {
      connected = false;
    } else {
      unknowns.forEach((n, i) => {
        nodeV[n] = x[i];
      });
    }
  }

  const branchI: number[] = [];
  const branchV: number[] = [];
  for (const br of branches) {
    const r = normR(br.r);
    if (r >= 1e8) {
      branchI.push(0);
      branchV.push(Math.abs(nodeV[br.a] - nodeV[br.b]));
      continue;
    }
    const v = nodeV[br.a] - nodeV[br.b];
    branchV.push(Math.abs(v));
    branchI.push(v / r);
  }

  // total arus keluar dari node 1
  let totalI = 0;
  branches.forEach((br, i) => {
    const r = normR(br.r);
    if (r >= 1e8) return;
    if (br.a === 1) totalI += branchI[i];
    else if (br.b === 1) totalI -= branchI[i];
  });
  totalI = Math.max(0, totalI);

  let lampV = 0;
  let lampI = 0;
  branches.forEach((br, i) => {
    if (br.isLamp) {
      lampV = branchV[i];
      lampI = Math.abs(branchI[i]);
    }
  });
  const lampP = lampV * lampI;
  const blown = totalI > fuseLimit + 1e-9;
  const open = lampI < 0.005;

  return { nodeV, branchI, branchV, totalI, lampV, lampI, lampP, blown, open, connected };
}

function gaussSolve(A: number[][], b: number[]): number[] | null {
  const n = b.length;
  if (n === 0) return [];
  const M = A.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < n; col++) {
    let piv = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(M[r][col]) > Math.abs(M[piv][col])) piv = r;
    }
    if (Math.abs(M[piv][col]) < 1e-12) {
      // singular -> node mengambang, anggap 0
      return null;
    }
    [M[col], M[piv]] = [M[piv], M[col]];
    const d = M[col][col];
    for (let j = col; j <= n; j++) M[col][j] /= d;
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const f = M[r][col];
      for (let j = col; j <= n; j++) M[r][j] -= f * M[col][j];
    }
  }
  return M.map((row) => row[n]);
}

export function fmt(n: number, digits = 2): string {
  if (!isFinite(n)) return '-';
  if (Math.abs(n) >= 100) return n.toFixed(0);
  return n.toFixed(digits);
}
