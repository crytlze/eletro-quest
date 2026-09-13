import Phaser from 'phaser';
import { getStars, setStar, sfxClick, sfxWin, sfxFail, sfxStar, beep, bindKeys, submitScore, speak } from '../util';
import { ensureFxTextures, neonBackdrop, burst } from '../fx';
import { mascotBadge } from '../mascot';
import { pal } from '../theme';

// Memory Match Invers — balik kartu, cocokkan matriks dengan inversnya.
// Topik Invers (aljP5). Tanpa timer, dinilai dari kesalahan.

// Pasangan [A, A⁻¹], semua det = ±1 (jawaban bulat). Terverifikasi A·A⁻¹ = I.
const PAIRS: { a: [number, number, number, number]; b: [number, number, number, number] }[] = [
  { a: [2, 1, 1, 1], b: [1, -1, -1, 2] },
  { a: [1, 2, 0, 1], b: [1, -2, 0, 1] },
  { a: [3, 1, 2, 1], b: [1, -1, -2, 3] },
  { a: [1, 1, 1, 2], b: [2, -1, -1, 1] },
  { a: [2, 3, 1, 2], b: [2, -3, -1, 2] },
  { a: [4, 1, 3, 1], b: [1, -1, -3, 4] },
  { a: [1, 0, 2, 1], b: [1, 0, -2, 1] },
  { a: [3, 2, 1, 1], b: [1, -2, -1, 3] },
];

const LEVELS: { id: number; title: string; sub: string; pairs: number[] }[] = [
  { id: 1, title: 'Kenalan', sub: '3 pasang', pairs: [0, 1, 2] },
  { id: 2, title: 'Trio Baru', sub: '3 pasang', pairs: [3, 4, 5] },
  { id: 3, title: 'Kuartet', sub: '4 pasang', pairs: [0, 3, 6, 7] },
  { id: 4, title: 'Acak Campur', sub: '4 pasang', pairs: [1, 2, 4, 5] },
  { id: 5, title: 'Lima Serangkai', sub: '5 pasang', pairs: [0, 1, 3, 5, 7] },
  { id: 6, title: 'Grand Match', sub: '6 pasang', pairs: [2, 3, 4, 5, 6, 7] },
];

const KEY = 'aljP5';

interface Card {
  pair: number;
  side: number; // 0 = A, 1 = A⁻¹
  open: boolean;
  done: boolean;
  vis: Phaser.GameObjects.Container;
  front: Phaser.GameObjects.Container;
  backC: Phaser.GameObjects.Container;
}

function matText(m: [number, number, number, number]): string {
  return `${m[0]}  ${m[1]}\n${m[2]}  ${m[3]}`;
}

export class MatchScene extends Phaser.Scene {
  private levelId = 0;
  private lv: { id: number; title: string; sub: string; pairs: number[] } | null = null;
  private first: Card | null = null;
  private lock = false;
  private mistakes = 0;
  private moves = 0;
  private matched = 0;
  private winOpen = false;
  private infoTx!: Phaser.GameObjects.Text;

  constructor() {
    super('Match');
  }

  init(data: { levelId?: number }): void {
    this.levelId = data.levelId ?? 0;
    const found = LEVELS.find((l) => l.id === this.levelId);
    this.lv = found ?? null;
    this.first = null;
    this.lock = false;
    this.mistakes = 0;
    this.moves = 0;
    this.matched = 0;
    this.winOpen = false;
  }

  create(): void {
    ensureFxTextures(this);
    neonBackdrop(this);
    if (this.lv === null) this.buildSelect();
    else this.buildPlay();
  }

  // ---------- pilih level ----------

  private buildSelect(): void {
    const W = 720;
    const P = pal();
    const back = this.add
      .text(24, 20, '‹ TOPIK', { fontSize: '24px', color: P.accentTx, fontStyle: 'bold' })
      .setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => {
      sfxClick();
      this.scene.start('AljTopik');
    });
    this.add
      .text(W / 2, 100, 'PASANGAN INVERS', {
        fontSize: '40px', color: P.title, fontStyle: 'bold',
        fontFamily: "'Chakra Petch', sans-serif",
        stroke: '#92400e', strokeThickness: 2,
        shadow: { offsetX: 0, offsetY: 0, color: '#f59e0b', blur: 22, fill: true },
      })
      .setOrigin(0.5);
    this.add
      .text(W / 2, 152, 'Memory match • A ↔ A⁻¹', { fontSize: '22px', color: P.dim })
      .setOrigin(0.5);

    const how = this.add.rectangle(W / 2, 250, 624, 120, 0x0b1628, 0.9).setOrigin(0.5);
    how.setStrokeStyle(2, 0x1e3a5f, 1);
    this.add
      .text(W / 2, 250,
        'Balik 2 kartu. Cocok kalau B·A = I!\nTanpa timer — yang dinilai ketelitian.',
        { fontSize: '22px', color: '#e2e8f0', align: 'center', lineSpacing: 7 })
      .setOrigin(0.5);

    const stars = getStars(KEY);
    let next = 1;
    for (let i = 1; i <= LEVELS.length; i++) {
      if (stars[i]) next = Math.min(LEVELS.length, i + 1);
    }
    const cols = 3;
    const cw = 190;
    const ch = 120;
    const stepX = (624 - cw) / (cols - 1);
    LEVELS.forEach((lv, i) => {
      const col = i % cols;
      const gx = 48 + cw / 2 + col * stepX;
      const gy = 400 + Math.floor(i / cols) * (ch + 16) + ch / 2;
      const st = stars[lv.id] || 0;
      const bg = this.add.rectangle(gx, gy, cw, ch, st > 0 ? 0x103049 : 0x0b1628, 0.94).setOrigin(0.5);
      bg.setStrokeStyle(2, st > 0 ? 0x22d3ee : 0x334155, 1);
      this.add.text(gx, gy - 24, `${lv.id}`, { fontSize: '40px', color: '#f8fafc', fontStyle: 'bold' }).setOrigin(0.5);
      this.add.text(gx, gy + 14, lv.title.split(' ')[0], { fontSize: '20px', color: '#a5f3fc' }).setOrigin(0.5);
      this.add
        .text(gx, gy + 38, st > 0 ? '★'.repeat(st) + '☆'.repeat(3 - st) : '☆☆☆', { fontSize: '20px', color: '#facc15' })
        .setOrigin(0.5);
      const z = this.add.zone(gx, gy, cw, ch).setInteractive({ useHandCursor: true });
      z.on('pointerdown', () => {
        sfxClick();
        this.scene.restart({ levelId: lv.id });
      });
    });

    this.add
      .text(W / 2, 700, 'Syarat invers: det ≠ 0 • A·A⁻¹ = I', {
        fontSize: '20px', color: P.dim, align: 'center', wordWrap: { width: 620 },
      })
      .setOrigin(0.5);

    const numNames = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX'];
    const keys: Record<string, () => void> = {
      ESC: () => this.scene.start('AljTopik'),
      ENTER: () => this.scene.restart({ levelId: next }),
    };
    LEVELS.forEach((lv, i) => {
      if (i < numNames.length) keys[numNames[i]] = () => this.scene.restart({ levelId: lv.id });
    });
    bindKeys(this, keys);
  }

  // ---------- main ----------

  private buildPlay(): void {
    const W = 720;
    const P = pal();
    const lv = this.lv!;
    const nP = lv.pairs.length;
    const cols = nP <= 3 ? 3 : nP <= 5 ? (nP === 4 ? 4 : 5) : 4;
    const rows = Math.ceil((nP * 2) / cols);
    const cw = Math.min(190, (624 - (cols - 1) * 16) / cols);
    const ch = Math.min(170, 560 / rows);

    const back = this.add
      .text(24, 20, '‹ LEVEL', { fontSize: '24px', color: P.accentTx, fontStyle: 'bold' })
      .setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => {
      sfxClick();
      this.scene.restart({ levelId: 0 });
    });
    this.add
      .text(W / 2, 24, `LEVEL ${lv.id} • ${lv.title.toUpperCase()}`, { fontSize: '23px', color: P.ink, fontStyle: 'bold' })
      .setOrigin(0.5, 0);
    this.add.text(W / 2, 54, lv.sub, { fontSize: '19px', color: P.dim }).setOrigin(0.5, 0);

    this.infoTx = this.add.text(W / 2, 108, '', { fontSize: '22px', color: P.accentTx, fontStyle: 'bold' }).setOrigin(0.5, 0);
    this.paintInfo();

    // susun + acak kartu
    const deck: { pair: number; side: number }[] = [];
    for (const p of lv.pairs) {
      deck.push({ pair: p, side: 0 });
      deck.push({ pair: p, side: 1 });
    }
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[i], deck[j]];
    }

    const gridW = cols * cw + (cols - 1) * 16;
    const x0 = (W - gridW) / 2 + cw / 2;
    const y0 = 210;
    const fs = cw < 140 ? 22 : 28;
    deck.forEach((d, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = x0 + col * (cw + 16);
      const y = y0 + row * (ch + 16) + ch / 2;
      const m = d.side === 0 ? PAIRS[d.pair].a : PAIRS[d.pair].b;
      const backBg = this.add.rectangle(0, 0, cw, ch, 0xf59e0b).setOrigin(0.5);
      backBg.setStrokeStyle(3, 0xfde68a, 1);
      const backTx = this.add.text(0, 0, '?', { fontSize: `${Math.floor(ch * 0.4)}px`, color: '#451a03', fontStyle: 'bold' }).setOrigin(0.5);
      const backC = this.add.container(x, y, [backBg, backTx]);
      const frontBg = this.add.rectangle(0, 0, cw, ch, 0x0f2a3d).setOrigin(0.5);
      frontBg.setStrokeStyle(3, 0x475569, 1);
      const frontTx = this.add.text(0, -8, matText(m), {
        fontSize: `${fs}px`, color: '#f8fafc', fontStyle: 'bold', align: 'center', lineSpacing: 6,
      }).setOrigin(0.5);
      const tagTx = this.add.text(0, ch / 2 - 16, d.side === 0 ? 'A' : 'A⁻¹', {
        fontSize: '18px', color: d.side === 0 ? '#67e8f9' : '#f0abfc', fontStyle: 'bold',
      }).setOrigin(0.5);
      const front = this.add.container(x, y, [frontBg, frontTx, tagTx]);
      front.setVisible(false);
      const card: Card = { pair: d.pair, side: d.side, open: false, done: false, vis: backC, front, backC };
      const z = this.add.zone(x, y, cw, ch).setInteractive({ useHandCursor: true });
      z.on('pointerdown', () => this.tap(card, z));
      card.vis = backC;
    });

    bindKeys(this, {
      ESC: () => {
        sfxClick();
        this.scene.restart({ levelId: 0 });
      },
    });
  }

  private paintInfo(): void {
    this.infoTx.setText(`Langkah ${this.moves} • Salah ${this.mistakes} • Pasangan ${this.matched}/${this.lv!.pairs.length}`);
  }

  private flip(card: Card, show: boolean, done: () => void): void {
    const from = show ? card.backC : card.front;
    const to = show ? card.front : card.backC;
    this.tweens.add({
      targets: from,
      scaleX: 0,
      duration: 110,
      onComplete: () => {
        from.setVisible(false);
        to.setVisible(true);
        to.setScale(0, 1);
        this.tweens.add({ targets: to, scaleX: 1, duration: 110, onComplete: () => done() });
      },
    });
  }

  private tap(card: Card, _z: Phaser.GameObjects.Zone): void {
    if (this.lock || this.winOpen || card.open || card.done) return;
    this.lock = true;
    card.open = true;
    beep(600, 0.07, 'square', 0.06);
    this.flip(card, true, () => {
      if (this.first === null) {
        this.first = card;
        this.lock = false;
        return;
      }
      this.moves += 1;
      const a = this.first;
      this.first = null;
      if (a.pair === card.pair && a !== card) {
        // cocok!
        a.done = true;
        card.done = true;
        this.matched += 1;
        beep(880, 0.12, 'sine', 0.1);
        burst(this, (a.vis.x + card.vis.x) / 2, (a.vis.y + card.vis.y) / 2, {
          colors: [0x4ade80, 0xfacc15, 0xffffff], count: 14, distMin: 40, distMax: 130,
        });
        this.paintInfo();
        this.lock = false;
        if (this.matched >= this.lv!.pairs.length) {
          this.time.delayedCall(500, () => this.onWin());
        }
      } else {
        // salah
        this.mistakes += 1;
        sfxFail();
        this.paintInfo();
        this.time.delayedCall(750, () => {
          this.flip(a, false, () => undefined);
          this.flip(card, false, () => {
            this.lock = false;
          });
        });
      }
    });
  }

  private onWin(): void {
    sfxWin();
    sfxStar();
    speak('Semua cocok! ' + (this.mistakes === 0 ? 'Tanpa salah!' : 'Ada ' + this.mistakes + ' kesalahan.'));
    this.winOpen = true;
    this.cameras.main.flash(250, 190, 255, 210);
    const lv = this.lv!;
    const earned = this.mistakes === 0 ? 3 : this.mistakes <= 2 ? 2 : 1;
    setStar(KEY, lv.id, earned);
    submitScore('aljP5', lv.id, earned);
    burst(this, 360, 500, { colors: [0x4ade80, 0xfacc15, 0xe879f9, 0xffffff], count: 36, distMin: 80, distMax: 300 });

    const W = 720;
    const dim = this.add.rectangle(W / 2, 640, 720, 1280, 0x000000, 0.72).setDepth(20);
    const panel = this.add.rectangle(W / 2, 620, 600, 540, 0x0b1628).setDepth(21);
    panel.setStrokeStyle(3, 0x4ade80, 1);
    mascotBadge(this, 598, 348, 0.8, 'happy').setDepth(24);
    const d = this.add.container(0, 0).setDepth(22);
    const t1 = this.add.text(W / 2, 410, '★ SEMUA COCOK!', { fontSize: '34px', color: '#4ade80', fontStyle: 'bold' }).setOrigin(0.5);
    const t2 = this.add.text(W / 2, 458, '★'.repeat(earned) + '☆'.repeat(3 - earned), { fontSize: '44px', color: '#facc15' }).setOrigin(0.5);
    const t3 = this.add.text(W / 2, 522,
      `${this.moves} langkah • ${this.mistakes}× salah\nA·A⁻¹ = I selalu!`,
      { fontSize: '22px', color: '#e2e8f0', align: 'center', lineSpacing: 6 }).setOrigin(0.5);
    d.add([t1, t2, t3]);

    const mkBtn = (y: number, label: string, bgc: number, cb: () => void): void => {
      const bg = this.add.rectangle(W / 2, y, 440, 72, bgc).setOrigin(0.5);
      bg.setStrokeStyle(2, 0xa5f3fc, 1);
      const tx = this.add.text(W / 2, y, label, { fontSize: '26px', color: bgc === 0x4ade80 ? '#052e16' : '#e2e8f0', fontStyle: 'bold' }).setOrigin(0.5);
      const z = this.add.zone(W / 2, y, 440, 72).setInteractive({ useHandCursor: true }).setDepth(23);
      d.add([bg, tx]);
      z.on('pointerdown', cb);
    };
    const isLast = lv.id >= LEVELS.length;
    mkBtn(656, isLast ? '★ SELESAI — KE TOPIK' : '▶ LEVEL BERIKUTNYA', 0x4ade80, () => {
      sfxClick();
      if (isLast) this.scene.start('AljTopik');
      else this.scene.restart({ levelId: lv.id + 1 });
    });
    mkBtn(744, '↺ ULANGI LEVEL', 0x0f2a3d, () => {
      sfxClick();
      this.scene.restart({ levelId: lv.id });
    });
    mkBtn(832, '≡ DAFTAR LEVEL', 0x0f2a3d, () => {
      sfxClick();
      this.scene.restart({ levelId: 0 });
    });
    void dim;
  }
}
