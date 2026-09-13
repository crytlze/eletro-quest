import Phaser from 'phaser';
import { ALJ_LEVELS, AljLevel } from '../aljLevels';
import { getStars, setStar, getSettings, sfxClick, sfxWin, sfxFail, sfxStar, submitScore, speak, bindKeys } from '../util';
import { mascotBadge } from '../mascot';
import { ensureFxTextures, neonBackdrop, burst, pressable, buttonShadow, hazardStrip } from '../fx';
import { pal } from '../theme';

// Misi Vektor — Aljabar Linier. Cari a,b bulat supaya a*u + b*v = target.
// levelId 0 = pilih level.

const KEY = 'alj';
const S = 18; // px per satuan
const OX = 360;
const OY = 500;
const LIM = 6;

export class AljabarScene extends Phaser.Scene {
  private levelId = 0;
  private lv: AljLevel | null = null;
  private a = 0;
  private b = 0;
  private attempts = 0;
  private hintOn = false;
  private winOpen = false;
  private gfx!: Phaser.GameObjects.Graphics;
  private aVal!: Phaser.GameObjects.Text;
  private bVal!: Phaser.GameObjects.Text;
  private eqTx!: Phaser.GameObjects.Text;
  private msg!: Phaser.GameObjects.Text;
  private hintTx!: Phaser.GameObjects.Text;
  private uLab!: Phaser.GameObjects.Text;
  private vLab!: Phaser.GameObjects.Text;
  private tgtGlow!: Phaser.GameObjects.Image;

  constructor() {
    super('Aljabar');
  }

  init(data: { levelId?: number }): void {
    this.levelId = data.levelId ?? 0;
    const found = ALJ_LEVELS.find((l) => l.id === this.levelId);
    this.lv = found ?? null;
    this.a = 0;
    this.b = 0;
    this.attempts = 0;
    this.hintOn = false;
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
      .text(W / 2, 100, 'ALJABAR LINIER', {
        fontSize: '44px', color: P.title, fontStyle: 'bold',
        fontFamily: "'Chakra Petch', sans-serif",
        stroke: '#92400e', strokeThickness: 2,
        shadow: { offsetX: 0, offsetY: 0, color: '#f59e0b', blur: 22, fill: true },
      })
      .setOrigin(0.5);
    this.add
      .text(W / 2, 152, 'Misi Vektor • kombinasi linear = SPL 2×2', { fontSize: '22px', color: P.dim })
      .setOrigin(0.5);

    const how = this.add.rectangle(W / 2, 250, 624, 120, 0x0b1628, 0.9).setOrigin(0.5);
    how.setStrokeStyle(2, 0x1e3a5f, 1);
    this.add
      .text(W / 2, 250,
        'Atur skalar a dan b (boleh negatif!)\nsupaya a·u + b·v tepat kena target',
        { fontSize: '22px', color: '#e2e8f0', align: 'center', lineSpacing: 7 })
      .setOrigin(0.5);

    const stars = getStars(KEY);
    let next = 1;
    for (let i = 1; i <= ALJ_LEVELS.length; i++) {
      if (stars[i]) next = Math.min(ALJ_LEVELS.length, i + 1);
    }
    const cols = 5;
    const cw = 114;
    const ch = 92;
    const stepX = (624 - cw) / (cols - 1);
    ALJ_LEVELS.forEach((lv, i) => {
      const col = i % cols;
      const gx = 48 + cw / 2 + col * stepX;
      const gy = 384 + Math.floor(i / cols) * (ch + 16) + ch / 2;
      const st = stars[lv.id] || 0;
      const bg = this.add.rectangle(gx, gy, cw, ch, st > 0 ? 0x103049 : 0x0b1628, 0.94).setOrigin(0.5);
      bg.setStrokeStyle(2, st > 0 ? 0x22d3ee : 0x334155, 1);
      this.add.text(gx, gy - 20, `${lv.id}`, { fontSize: '32px', color: '#f8fafc', fontStyle: 'bold' }).setOrigin(0.5);
      this.add.text(gx, gy + 12, lv.title.split(' ')[0], { fontSize: '20px', color: '#a5f3fc' }).setOrigin(0.5);
      this.add
        .text(gx, gy + 32, st > 0 ? '★'.repeat(st) + '☆'.repeat(3 - st) : '☆☆☆', { fontSize: '20px', color: '#facc15' })
        .setOrigin(0.5);
      const z = this.add.zone(gx, gy, cw, ch).setInteractive({ useHandCursor: true });
      z.on('pointerdown', () => {
        sfxClick();
        this.scene.restart({ levelId: lv.id });
      });
    });

    this.add
      .text(W / 2, 830, 'Basis u (cyan) dan v (pink) • resultan kuning • target hijau', {
        fontSize: '20px', color: P.dim, align: 'center', wordWrap: { width: 620 },
      })
      .setOrigin(0.5);

    const numNames = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'ZERO'];
    const keys: Record<string, () => void> = {
      ESC: () => this.scene.start('AljTopik'),
      ENTER: () => this.scene.restart({ levelId: next }),
    };
    ALJ_LEVELS.forEach((lv, i) => {
      if (i < numNames.length) keys[numNames[i]] = () => this.scene.restart({ levelId: lv.id });
    });
    bindKeys(this, keys);
  }

  // ---------- main ----------

  private P(p: [number, number]): { x: number; y: number } {
    return { x: OX + p[0] * S, y: OY - p[1] * S };
  }

  private target(): [number, number] {
    const lv = this.lv!;
    return [this.a * lv.u[0] + this.b * lv.v[0], this.a * lv.u[1] + this.b * lv.v[1]];
  }

  private solTarget(): [number, number] {
    const lv = this.lv!;
    return [lv.a * lv.u[0] + lv.b * lv.v[0], lv.a * lv.u[1] + lv.b * lv.v[1]];
  }

  private buildPlay(): void {
    const W = 720;
    const P = pal();
    const lv = this.lv!;
    const T = this.solTarget();

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

    const card = this.add.rectangle(W / 2, 165, 672, 150, 0x0b1628, 0.92).setOrigin(0.5);
    card.setStrokeStyle(2, 0x1e3a5f, 1);
    this.add.text(60, 105, lv.briefing, {
      fontSize: '20px', color: '#e2e8f0', lineSpacing: 5, wordWrap: { width: 600 },
    });
    this.add.text(60, 185, `Target = (${T[0]}, ${T[1]})`, {
      fontSize: '21px', color: '#4ade80', fontStyle: 'bold',
    });

    const area = this.add.rectangle(W / 2, OY, 672, 440, 0x070d1d, 0.88).setOrigin(0.5);
    area.setStrokeStyle(2, 0x22d3ee, 0.8);
    this.gfx = this.add.graphics();
    this.tgtGlow = this.add.image(0, 0, 'fx-glow').setTint(0x4ade80).setAlpha(0.5).setDepth(1).setScale(0.9);
    this.uLab = this.add.text(0, 0, 'u', { fontSize: '22px', color: '#67e8f9', fontStyle: 'bold' }).setOrigin(0.5).setDepth(5);
    this.vLab = this.add.text(0, 0, 'v', { fontSize: '22px', color: '#f0abfc', fontStyle: 'bold' }).setOrigin(0.5).setDepth(5);

    this.aVal = this.stepperRow(770, 'a', '#67e8f9', () => this.a, (v) => { this.a = v; });
    this.bVal = this.stepperRow(850, 'b', '#f0abfc', () => this.b, (v) => { this.b = v; });

    this.eqTx = this.add
      .text(W / 2, 905, '', { fontSize: '21px', color: P.ink, align: 'center', wordWrap: { width: 640 } })
      .setOrigin(0.5, 0);

    buttonShadow(this, W / 2, 985, 672, 80);
    const kBg = this.add.rectangle(0, 0, 672, 80, 0x4ade80).setOrigin(0.5);
    kBg.setStrokeStyle(3, 0xbbf7d0, 1);
    const kTx = this.add.text(0, 0, 'KUNCI JAWABAN', { fontSize: '30px', color: '#052e16', fontStyle: 'bold', fontFamily: "'Chakra Petch', sans-serif" }).setOrigin(0.5);
    const kBtn = this.add.container(W / 2, 985, [kBg, kTx]);
    hazardStrip(this, W / 2, 937, 672);
    const kZone = this.add.zone(W / 2, 985, 672, 88).setInteractive({ useHandCursor: true });
    pressable(this, kZone, kBtn);
    kZone.on('pointerdown', () => this.onLock());
    kZone.on('pointerover', () => kBg.setFillStyle(0x86efac));
    kZone.on('pointerout', () => kBg.setFillStyle(0x4ade80));

    this.msg = this.add
      .text(W / 2, 1035, 'Atur a & b, lalu KUNCI', { fontSize: '21px', color: P.accentTx, align: 'center', wordWrap: { width: 640 } })
      .setOrigin(0.5, 0);

    this.smallBtn(48, 1100, 300, 56, 'ⓘ HINT', () => this.toggleHint());
    this.smallBtn(372, 1100, 300, 56, '↺ RESET', () => {
      sfxClick();
      this.a = 0;
      this.b = 0;
      this.refresh();
    });
    this.hintTx = this.add
      .text(W / 2, 1165, `ⓘ ${lv.hint}`, {
        fontSize: '19px', color: '#fde68a', align: 'center', wordWrap: { width: 640 },
        backgroundColor: '#1c1408', padding: { x: 10, y: 8 },
      })
      .setOrigin(0.5, 0)
      .setVisible(false);

    bindKeys(this, {
      LEFT: () => this.nudge('a', -1),
      A: () => this.nudge('a', -1),
      RIGHT: () => this.nudge('a', 1),
      D: () => this.nudge('a', 1),
      UP: () => this.nudge('b', 1),
      W: () => this.nudge('b', 1),
      DOWN: () => this.nudge('b', -1),
      S: () => this.nudge('b', -1),
      ENTER: () => this.onLock(),
      ESC: () => {
        sfxClick();
        this.scene.restart({ levelId: 0 });
      },
    });

    this.refresh();
  }

  private smallBtn(x: number, y: number, w: number, h: number, label: string, cb: () => void): void {
    const cx = x + w / 2;
    const cy = y + h / 2;
    const bg = this.add.rectangle(cx, cy, w, h, 0x0f2a3d).setOrigin(0.5);
    bg.setStrokeStyle(2, 0x334155, 1);
    this.add.text(cx, cy, label, { fontSize: '21px', color: '#e2e8f0', fontStyle: 'bold' }).setOrigin(0.5);
    const z = this.add.zone(cx, cy, w, 88).setInteractive({ useHandCursor: true });
    z.on('pointerdown', cb);
    z.on('pointerover', () => bg.setFillStyle(0x164e63));
    z.on('pointerout', () => bg.setFillStyle(0x0f2a3d));
  }

  private toggleHint(): void {
    sfxClick();
    this.hintOn = !this.hintOn;
    this.hintTx.setVisible(this.hintOn);
  }

  private stepperRow(y: number, name: string, color: string, get: () => number, set: (v: number) => void): Phaser.GameObjects.Text {
    this.add.text(70, y, name, { fontSize: '46px', color, fontStyle: 'bold' }).setOrigin(0, 0.5);
    this.add.text(120, y, name === 'a' ? '·u' : '·v', { fontSize: '24px', color: pal().dim }).setOrigin(0, 0.5);
    const mk = (x: number, label: string, d: number): void => {
      const bg = this.add.rectangle(0, 0, 100, 74, 0x0f2a3d).setOrigin(0.5);
      bg.setStrokeStyle(2, 0x334155, 1);
      const tx = this.add.text(0, 0, label, { fontSize: '38px', color: '#f8fafc', fontStyle: 'bold' }).setOrigin(0.5);
      const vis = this.add.container(x, y, [bg, tx]);
      const z = this.add.zone(x, y, 104, 78).setInteractive({ useHandCursor: true });
      pressable(this, z, vis);
      z.on('pointerdown', () => {
        const v = Phaser.Math.Clamp(get() + d, -LIM, LIM);
        set(v);
        sfxClick();
        this.refresh();
      });
      z.on('pointerover', () => bg.setFillStyle(0x164e63));
      z.on('pointerout', () => bg.setFillStyle(0x0f2a3d));
    };
    mk(230, '−', -1);
    mk(530, '+', 1);
    const val = this.add
      .text(380, y, `${get()}`, { fontSize: '46px', color: pal().ink, fontStyle: 'bold' })
      .setOrigin(0.5);
    return val;
  }

  private nudge(which: 'a' | 'b', d: number): void {
    if (this.winOpen || this.lv === null) return;
    if (which === 'a') this.a = Phaser.Math.Clamp(this.a + d, -LIM, LIM);
    else this.b = Phaser.Math.Clamp(this.b + d, -LIM, LIM);
    sfxClick();
    this.refresh();
  }

  private arrow(ax: number, ay: number, bx: number, by: number, color: number, width: number): void {
    const g = this.gfx;
    if (Math.hypot(bx - ax, by - ay) < 2) return;
    g.lineStyle(width + 5, color, 0.22);
    g.lineBetween(ax, ay, bx, by);
    g.lineStyle(width, color, 1);
    g.lineBetween(ax, ay, bx, by);
    const ang = Math.atan2(by - ay, bx - ax);
    const hl = 13;
    g.fillStyle(color, 1);
    g.fillTriangle(
      bx, by,
      bx - Math.cos(ang - 0.42) * hl, by - Math.sin(ang - 0.42) * hl,
      bx - Math.cos(ang + 0.42) * hl, by - Math.sin(ang + 0.42) * hl
    );
  }

  private refresh(): void {
    const lv = this.lv!;
    this.aVal.setText(`${this.a}`);
    this.bVal.setText(`${this.b}`);
    const R = this.target();
    const T = this.solTarget();
    this.eqTx.setText(
      `${this.a}·(${lv.u[0]},${lv.u[1]}) + ${this.b}·(${lv.v[0]},${lv.v[1]}) = (${R[0]},${R[1]})   = (${T[0]},${T[1]})`
    );
    this.redraw();
  }

  private redraw(): void {
    const lv = this.lv!;
    const g = this.gfx;
    g.clear();
    // grid
    for (let gx = -16; gx <= 16; gx += 2) {
      const x = OX + gx * S;
      const major = gx === 0;
      g.lineStyle(major ? 2 : 1, 0x22d3ee, major ? 0.4 : 0.12);
      g.lineBetween(x, OY - 220, x, OY + 220);
    }
    for (let gy = -12; gy <= 12; gy += 2) {
      const y = OY - gy * S;
      const major = gy === 0;
      g.lineStyle(major ? 2 : 1, 0x22d3ee, major ? 0.4 : 0.12);
      g.lineBetween(OX - 324, y, OX + 312, y);
    }
    const O = { x: OX, y: OY };
    const au: [number, number] = [this.a * lv.u[0], this.a * lv.u[1]];
    const bv: [number, number] = [this.b * lv.v[0], this.b * lv.v[1]];
    const R = this.target();
    const T = this.solTarget();
    const pU = this.P(lv.u);
    const pV = this.P(lv.v);
    const pR = this.P(R);
    const pT = this.P(T);
    // komponen a·u dan b·v (tipis)
    if (this.a !== 0) {
      const p = this.P(au);
      g.lineStyle(3, 0x67e8f9, 0.5);
      g.lineBetween(O.x, O.y, p.x, p.y);
    }
    if (this.b !== 0) {
      const p = this.P(bv);
      g.lineStyle(3, 0xf0abfc, 0.5);
      g.lineBetween(O.x, O.y, p.x, p.y);
    }
    // basis
    this.arrow(O.x, O.y, pU.x, pU.y, 0x22d3ee, 5);
    this.arrow(O.x, O.y, pV.x, pV.y, 0xe879f9, 5);
    this.uLab.setPosition(pU.x + 16, pU.y - 14);
    this.vLab.setPosition(pV.x + 16, pV.y - 14);
    // resultan
    this.arrow(O.x, O.y, pR.x, pR.y, 0xfacc15, 7);
    g.fillStyle(0xfacc15, 1);
    g.fillCircle(pR.x, pR.y, 6);
    // target
    this.tgtGlow.setPosition(pT.x, pT.y);
    g.lineStyle(4, 0x4ade80, 1);
    g.strokeCircle(pT.x, pT.y, 16);
    g.fillStyle(0x4ade80, 1);
    g.fillCircle(pT.x, pT.y, 4);
  }

  private onLock(): void {
    if (this.winOpen || this.lv === null) return;
    this.attempts += 1;
    const R = this.target();
    const T = this.solTarget();
    if (R[0] === T[0] && R[1] === T[1]) {
      this.onWin();
      return;
    }
    sfxFail();
    if (getSettings().shake) this.cameras.main.shake(140, 0.007);
    const dist = Math.hypot(R[0] - T[0], R[1] - T[1]);
    this.msg
      .setText(`× Meleset ${dist.toFixed(1)} satuan (percobaan ${this.attempts}×). Geser a/b lalu KUNCI lagi!`)
      .setColor(pal().warn);
  }

  private onWin(): void {
    sfxWin();
    sfxStar();
    speak('Target kena! ' + this.lv!.prinsip + ' ' + this.lv!.bedah.join(' '));
    this.winOpen = true;
    this.cameras.main.flash(250, 190, 255, 210);
    const lv = this.lv!;
    const earned = this.attempts <= 1 ? 3 : this.attempts <= 3 ? 2 : 1;
    setStar(KEY, lv.id, earned);
    submitScore('alj', lv.id, earned);
    burst(this, OX, OY, { colors: [0x22d3ee, 0xfacc15, 0xe879f9, 0xffffff], count: 40, distMin: 80, distMax: 300 });

    const W = 720;
    const dim = this.add.rectangle(W / 2, 640, 720, 1280, 0x000000, 0.72).setDepth(20);
    const panel = this.add.rectangle(W / 2, 630, 600, 760, 0x0b1628).setDepth(21);
    panel.setStrokeStyle(3, 0x4ade80, 1);
    mascotBadge(this, 598, 258, 0.8, 'happy').setDepth(24);
    const d = this.add.container(0, 0).setDepth(22);
    const t1 = this.add.text(W / 2, 322, '★ TARGET KENA!', { fontSize: '32px', color: '#4ade80', fontStyle: 'bold' }).setOrigin(0.5);
    const t2 = this.add.text(W / 2, 366, '★'.repeat(earned) + '☆'.repeat(3 - earned), { fontSize: '40px', color: '#facc15' }).setOrigin(0.5);
    const t3 = this.add.text(W / 2, 410,
      `(${this.a})·u + (${this.b})·v = target ✓ • ${this.attempts}× KUNCI`,
      { fontSize: '20px', color: '#e2e8f0', align: 'center' }).setOrigin(0.5);
    const ph = this.add.text(W / 2, 452, 'PRINSIP', { fontSize: '21px', color: '#facc15', fontStyle: 'bold' }).setOrigin(0.5);
    const pb = this.add.text(W / 2, 474, lv.prinsip, {
      fontSize: '19px', color: '#e2e8f0', align: 'center', wordWrap: { width: 520 }, lineSpacing: 4,
    }).setOrigin(0.5, 0);
    const bh = this.add.text(W / 2, 548, 'BEDAH SOAL', { fontSize: '21px', color: '#67e8f9', fontStyle: 'bold' }).setOrigin(0.5);
    d.add([t1, t2, t3, ph, pb, bh]);
    lv.bedah.slice(0, 4).forEach((step, i) => {
      const st = this.add.text(110, 578 + i * 32, `${i + 1}. ${step}`, {
        fontSize: '19px', color: '#cbd5e1', wordWrap: { width: 500 },
      }).setOrigin(0, 0).setAlpha(0);
      d.add(st);
      this.tweens.add({
        targets: st,
        alpha: 1,
        x: 118,
        duration: 260,
        delay: 250 + i * 230,
        ease: 'Cubic.easeOut',
      });
    });

    const mkBtn = (y: number, label: string, bgc: number, cb: () => void): void => {
      const bg = this.add.rectangle(W / 2, y, 440, 68, bgc).setOrigin(0.5);
      bg.setStrokeStyle(2, 0xa5f3fc, 1);
      const tx = this.add.text(W / 2, y, label, { fontSize: '25px', color: bgc === 0x4ade80 ? '#052e16' : '#e2e8f0', fontStyle: 'bold' }).setOrigin(0.5);
      const z = this.add.zone(W / 2, y, 440, 68).setInteractive({ useHandCursor: true }).setDepth(23);
      d.add([bg, tx]);
      z.on('pointerdown', cb);
    };
    const isLast = lv.id >= ALJ_LEVELS.length;
    mkBtn(796, isLast ? '★ SELESAI — KE TOPIK' : '▶ LEVEL BERIKUTNYA', 0x4ade80, () => {
      sfxClick();
      if (isLast) this.scene.start('AljTopik');
      else this.scene.restart({ levelId: lv.id + 1 });
    });
    mkBtn(884, '↺ ULANGI LEVEL', 0x0f2a3d, () => {
      sfxClick();
      this.scene.restart({ levelId: lv.id });
    });
    mkBtn(972, '≡ DAFTAR LEVEL', 0x0f2a3d, () => {
      sfxClick();
      this.scene.restart({ levelId: 0 });
    });
    void dim;
  }
}
