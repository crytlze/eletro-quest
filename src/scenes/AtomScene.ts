import Phaser from 'phaser';
import { ATOM_LEVELS, AtomLevel, shellsOf } from '../atomLevels';
import { getStars, setStar, sfxClick, sfxWin, sfxFail, sfxStar, submitScore, speak, beep, bindKeys } from '../util';
import { mascotBadge } from '../mascot';
import { ensureFxTextures, neonBackdrop, burst, pressable, buttonShadow } from '../fx';
import { pal } from '../theme';

// Rakit Atom — Struktur Atom (model Bohr). Atur p/n/e sesuai Z & A.
// levelId 0 = pilih level.

const KEY = 'atom';
const LIM = 22;
const OX = 360;
const OY = 470;
const RADII = [48, 84, 120, 156];

export class AtomScene extends Phaser.Scene {
  private levelId = 0;
  private lv: AtomLevel | null = null;
  private p = 0;
  private n = 0;
  private e = 0;
  private attempts = 0;
  private hintOn = false;
  private winOpen = false;
  private gfx!: Phaser.GameObjects.Graphics;
  private pVal!: Phaser.GameObjects.Text;
  private nVal!: Phaser.GameObjects.Text;
  private eVal!: Phaser.GameObjects.Text;
  private eqTx!: Phaser.GameObjects.Text;
  private nucTx!: Phaser.GameObjects.Text;
  private shellLabs: Phaser.GameObjects.Text[] = [];
  private msg!: Phaser.GameObjects.Text;
  private hintTx!: Phaser.GameObjects.Text;

  constructor() {
    super('Atom');
  }

  init(data: { levelId?: number }): void {
    this.levelId = data.levelId ?? 0;
    const found = ATOM_LEVELS.find((l) => l.id === this.levelId);
    this.lv = found ?? null;
    this.p = 0;
    this.n = 0;
    this.e = 0;
    this.attempts = 0;
    this.hintOn = false;
    this.winOpen = false;
    this.shellLabs = [];
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
      .text(24, 20, '‹ MATA KULIAH', { fontSize: '24px', color: P.accentTx, fontStyle: 'bold' })
      .setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => {
      sfxClick();
      this.scene.start('TdeTopik');
    });
    this.add
      .text(W / 2, 100, 'STRUKTUR ATOM', {
        fontSize: '42px', color: P.title, fontStyle: 'bold',
        fontFamily: "'Chakra Petch', sans-serif",
        stroke: '#92400e', strokeThickness: 2,
        shadow: { offsetX: 0, offsetY: 0, color: '#f59e0b', blur: 22, fill: true },
      })
      .setOrigin(0.5);
    this.add
      .text(W / 2, 152, 'Rakit Atom • model Bohr', { fontSize: '22px', color: P.dim })
      .setOrigin(0.5);

    const how = this.add.rectangle(W / 2, 250, 624, 120, 0x0b1628, 0.9).setOrigin(0.5);
    how.setStrokeStyle(2, 0x1e3a5f, 1);
    this.add
      .text(W / 2, 250,
        'Atur proton, neutron & elektron\nsupaya cocok dengan unsur target!',
        { fontSize: '22px', color: '#e2e8f0', align: 'center', lineSpacing: 7 })
      .setOrigin(0.5);

    const stars = getStars(KEY);
    let next = 1;
    for (let i = 1; i <= ATOM_LEVELS.length; i++) {
      if (stars[i]) next = Math.min(ATOM_LEVELS.length, i + 1);
    }
    const cols = 4;
    const cw = 140;
    const ch = 120;
    const stepX = (624 - cw) / (cols - 1);
    ATOM_LEVELS.forEach((lv, i) => {
      const col = i % cols;
      const gx = 48 + cw / 2 + col * stepX;
      const gy = 400 + Math.floor(i / cols) * (ch + 16) + ch / 2;
      const st = stars[lv.id] || 0;
      const bg = this.add.rectangle(gx, gy, cw, ch, st > 0 ? 0x103049 : 0x0b1628, 0.94).setOrigin(0.5);
      bg.setStrokeStyle(2, st > 0 ? 0x22d3ee : 0x334155, 1);
      this.add.text(gx, gy - 26, lv.symbol, { fontSize: '38px', color: '#f8fafc', fontStyle: 'bold' }).setOrigin(0.5);
      this.add.text(gx, gy + 14, lv.name.split(' ')[0], { fontSize: '20px', color: '#a5f3fc' }).setOrigin(0.5);
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
      .text(W / 2, 700, 'Proton • neutron • elektron • kulit K L M N', {
        fontSize: '20px', color: P.dim, align: 'center', wordWrap: { width: 620 },
      })
      .setOrigin(0.5);

    const numNames = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT'];
    const keys: Record<string, () => void> = {
      ESC: () => this.scene.start('TdeTopik'),
      ENTER: () => this.scene.restart({ levelId: next }),
    };
    ATOM_LEVELS.forEach((lv, i) => {
      if (i < numNames.length) keys[numNames[i]] = () => this.scene.restart({ levelId: lv.id });
    });
    bindKeys(this, keys);
  }

  // ---------- main ----------

  private needN(): number {
    return this.lv!.a - this.lv!.z;
  }

  private buildPlay(): void {
    const W = 720;
    const P = pal();
    const lv = this.lv!;

    const back = this.add
      .text(24, 20, '‹ TOPIK', { fontSize: '24px', color: P.accentTx, fontStyle: 'bold' })
      .setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => {
      sfxClick();
      this.scene.restart({ levelId: 0 });
    });
    this.add
      .text(W / 2, 24, `LEVEL ${lv.id} • ${lv.name.toUpperCase()} (${lv.symbol})`, { fontSize: '23px', color: P.ink, fontStyle: 'bold' })
      .setOrigin(0.5, 0);
    this.add.text(W / 2, 54, `Nomor atom Z=${lv.z} • Nomor massa A=${lv.a}`, { fontSize: '19px', color: P.dim }).setOrigin(0.5, 0);

    const card = this.add.rectangle(W / 2, 160, 672, 130, 0x0b1628, 0.92).setOrigin(0.5);
    card.setStrokeStyle(2, 0x1e3a5f, 1);
    this.add.text(60, 110, lv.briefing, {
      fontSize: '20px', color: '#e2e8f0', lineSpacing: 5, wordWrap: { width: 600 },
    });
    this.add.text(60, 178, 'p = proton • n = neutron • e = elektron', {
      fontSize: '19px', color: '#a5f3fc', fontStyle: 'bold',
    });

    const area = this.add.rectangle(W / 2, OY, 672, 380, 0x070d1d, 0.88).setOrigin(0.5);
    area.setStrokeStyle(2, 0x22d3ee, 0.8);
    this.gfx = this.add.graphics();
    this.nucTx = this.add.text(OX, OY, '', {
      fontSize: '20px', color: '#ffffff', fontStyle: 'bold', align: 'center', lineSpacing: 4,
    }).setOrigin(0.5).setDepth(5);
    const shellNames = ['K', 'L', 'M', 'N'];
    for (let i = 0; i < 4; i++) {
      const t = this.add.text(0, 0, shellNames[i], { fontSize: '18px', color: '#94a3b8', fontStyle: 'bold' })
        .setOrigin(0.5).setDepth(5).setVisible(false);
      this.shellLabs.push(t);
    }

    this.pVal = this.stepperRow(705, 'p', pal().bad, () => this.p, (v) => { this.p = v; });
    this.nVal = this.stepperRow(775, 'n', pal().dim, () => this.n, (v) => { this.n = v; });
    this.eVal = this.stepperRow(845, 'e', pal().accentTx, () => this.e, (v) => { this.e = v; });

    this.eqTx = this.add
      .text(W / 2, 890, '', { fontSize: '21px', color: P.ink, align: 'center' })
      .setOrigin(0.5, 0);

    buttonShadow(this, W / 2, 965, 672, 72);
    const kBg = this.add.rectangle(0, 0, 672, 72, 0x4ade80).setOrigin(0.5);
    kBg.setStrokeStyle(3, 0xbbf7d0, 1);
    const kTx = this.add.text(0, 0, 'KUNCI ATOM', { fontSize: '28px', color: '#052e16', fontStyle: 'bold', fontFamily: "'Chakra Petch', sans-serif" }).setOrigin(0.5);
    const kBtn = this.add.container(W / 2, 965, [kBg, kTx]);
    const kZone = this.add.zone(W / 2, 965, 672, 88).setInteractive({ useHandCursor: true });
    pressable(this, kZone, kBtn);
    kZone.on('pointerdown', () => this.onLock());
    kZone.on('pointerover', () => kBg.setFillStyle(0x86efac));
    kZone.on('pointerout', () => kBg.setFillStyle(0x4ade80));

    this.msg = this.add
      .text(W / 2, 1010, 'Atur p, n & e, lalu KUNCI', { fontSize: '21px', color: P.accentTx, align: 'center', wordWrap: { width: 640 } })
      .setOrigin(0.5, 0);

    this.smallBtn(48, 1085, 300, 52, 'ⓘ HINT', () => this.toggleHint());
    this.smallBtn(372, 1085, 300, 52, '↺ RESET', () => {
      sfxClick();
      this.p = 0;
      this.n = 0;
      this.e = 0;
      this.refresh();
    });
    this.hintTx = this.add
      .text(W / 2, 1145, `ⓘ ${lv.hint}`, {
        fontSize: '19px', color: '#fde68a', align: 'center', wordWrap: { width: 640 },
        backgroundColor: '#1c1408', padding: { x: 10, y: 8 },
      })
      .setOrigin(0.5, 0)
      .setVisible(false);

    bindKeys(this, {
      ONE: () => this.nudge('p', -1),
      TWO: () => this.nudge('p', 1),
      THREE: () => this.nudge('n', -1),
      FOUR: () => this.nudge('n', 1),
      FIVE: () => this.nudge('e', -1),
      SIX: () => this.nudge('e', 1),
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
    this.add.text(cx, cy, label, { fontSize: '20px', color: '#e2e8f0', fontStyle: 'bold' }).setOrigin(0.5);
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
    this.add.text(70, y, name, { fontSize: '40px', color, fontStyle: 'bold' }).setOrigin(0, 0.5);
    const mk = (x: number, label: string, d: number): void => {
      const bg = this.add.rectangle(0, 0, 92, 62, 0x0f2a3d).setOrigin(0.5);
      bg.setStrokeStyle(2, 0x334155, 1);
      const tx = this.add.text(0, 0, label, { fontSize: '34px', color: '#f8fafc', fontStyle: 'bold' }).setOrigin(0.5);
      const vis = this.add.container(x, y, [bg, tx]);
      const z = this.add.zone(x, y, 96, 68).setInteractive({ useHandCursor: true });
      pressable(this, z, vis);
      z.on('pointerdown', () => {
        set(Phaser.Math.Clamp(get() + d, 0, LIM));
        beep(get() > 11 ? 600 : 500, 0.06, 'square', 0.06);
        this.refresh();
      });
      z.on('pointerover', () => bg.setFillStyle(0x164e63));
      z.on('pointerout', () => bg.setFillStyle(0x0f2a3d));
    };
    mk(225, '−', -1);
    mk(535, '+', 1);
    return this.add
      .text(380, y, `${get()}`, { fontSize: '42px', color: pal().ink, fontStyle: 'bold' })
      .setOrigin(0.5);
  }

  private nudge(which: 'p' | 'n' | 'e', d: number): void {
    if (this.winOpen || this.lv === null) return;
    if (which === 'p') this.p = Phaser.Math.Clamp(this.p + d, 0, LIM);
    else if (which === 'n') this.n = Phaser.Math.Clamp(this.n + d, 0, LIM);
    else this.e = Phaser.Math.Clamp(this.e + d, 0, LIM);
    sfxClick();
    this.refresh();
  }

  private refresh(): void {
    const lv = this.lv!;
    this.pVal.setText(`${this.p}`);
    this.nVal.setText(`${this.n}`);
    this.eVal.setText(`${this.e}`);
    this.eqTx.setText(`p=${this.p}   n=${this.n}   e=${this.e}      ${lv.symbol}: Z=${lv.z} A=${lv.a}`);
    this.redraw();
  }

  private redraw(): void {
    const g = this.gfx;
    g.clear();
    // kulit
    const shells = shellsOf(Math.max(this.e, 1));
    this.shellLabs.forEach((t, i) => {
      if (i < shells.length) {
        const r = RADII[i] ?? 170;
        t.setVisible(true).setPosition(OX - r - 6, OY - r - 6);
      } else {
        t.setVisible(false);
      }
    });
    shells.forEach((count, i) => {
      const r = RADII[i] ?? 170;
      g.lineStyle(2, 0x334155, 1);
      g.strokeCircle(OX, OY, r);
      for (let k = 0; k < count; k++) {
        const ang = (k / count) * Math.PI * 2 - Math.PI / 2;
        const ex = OX + Math.cos(ang) * r;
        const ey = OY + Math.sin(ang) * r;
        g.fillStyle(0x22d3ee, 0.3);
        g.fillCircle(ex, ey, 11);
        g.fillStyle(0x67e8f9, 1);
        g.fillCircle(ex, ey, 7);
      }
    });
    if (this.e === 0) {
      g.lineStyle(2, 0x334155, 1);
      g.strokeCircle(OX, OY, RADII[0]);
    }
    // inti
    g.fillStyle(0x7f1d1d, 1);
    g.fillCircle(OX, OY, 38);
    g.lineStyle(4, 0xef4444, 1);
    g.strokeCircle(OX, OY, 38);
    this.nucTx.setText(`${this.p}p\n${this.n}n`);
    this.nucTx.setPosition(OX, OY);
  }

  private onLock(): void {
    if (this.winOpen || this.lv === null) return;
    const lv = this.lv;
    this.attempts += 1;
    const needN = this.needN();
    if (this.p === lv.z && this.n === needN && this.e === lv.z) {
      this.onWin();
      return;
    }
    sfxFail();
    let why = '';
    if (this.p !== lv.z) why = `Proton harus = nomor atom (${lv.z}).`;
    else if (this.n !== needN) why = `Neutron = A−Z = ${lv.a}−${lv.z} = ${needN}.`;
    else why = `Atom netral: elektron = proton (${lv.z}).`;
    this.msg.setText(`▼ Belum pas! ${why} (percobaan ${this.attempts}×)`).setColor(pal().warn);
  }

  private onWin(): void {
    sfxWin();
    sfxStar();
    speak('Atom ' + this.lv!.name + ' jadi! ' + this.lv!.fakta);
    this.winOpen = true;
    this.cameras.main.flash(250, 190, 255, 210);
    const lv = this.lv!;
    const earned = this.attempts <= 1 ? 3 : this.attempts <= 3 ? 2 : 1;
    setStar(KEY, lv.id, earned);
    submitScore('atom', lv.id, earned);
    burst(this, OX, OY, { colors: [0xef4444, 0x94a3b8, 0x67e8f9, 0xffffff], count: 36, distMin: 80, distMax: 280 });

    const W = 720;
    const dim = this.add.rectangle(W / 2, 640, 720, 1280, 0x000000, 0.72).setDepth(20);
    const panel = this.add.rectangle(W / 2, 620, 600, 560, 0x0b1628).setDepth(21);
    panel.setStrokeStyle(3, 0xe879f9, 1);
    mascotBadge(this, 598, 338, 0.8, 'happy').setDepth(24);
    const d = this.add.container(0, 0).setDepth(22);
    const t1 = this.add.text(W / 2, 400, '★ ATOM JADI!', { fontSize: '34px', color: '#4ade80', fontStyle: 'bold' }).setOrigin(0.5);
    const t2 = this.add.text(W / 2, 448, '★'.repeat(earned) + '☆'.repeat(3 - earned), { fontSize: '44px', color: '#facc15' }).setOrigin(0.5);
    const t3 = this.add.text(W / 2, 512,
      `${lv.name} (${lv.symbol}): p=${lv.z} n=${this.needN()} e=${lv.z}\n${this.attempts}× tekan KUNCI`,
      { fontSize: '22px', color: '#e2e8f0', align: 'center', lineSpacing: 6 }).setOrigin(0.5);
    const t4 = this.add.text(W / 2, 600, `ⓘ ${lv.fakta}`, {
      fontSize: '21px', color: '#fde68a', align: 'center', wordWrap: { width: 520 }, lineSpacing: 5,
    }).setOrigin(0.5);
    d.add([t1, t2, t3, t4]);

    const mkBtn = (y: number, label: string, bgc: number, cb: () => void): void => {
      const bg = this.add.rectangle(W / 2, y, 440, 72, bgc).setOrigin(0.5);
      bg.setStrokeStyle(2, 0xa5f3fc, 1);
      const tx = this.add.text(W / 2, y, label, { fontSize: '26px', color: bgc === 0xe879f9 ? '#04121a' : '#e2e8f0', fontStyle: 'bold' }).setOrigin(0.5);
      const z = this.add.zone(W / 2, y, 440, 72).setInteractive({ useHandCursor: true }).setDepth(23);
      d.add([bg, tx]);
      z.on('pointerdown', cb);
    };
    const isLast = lv.id >= ATOM_LEVELS.length;
    mkBtn(676, isLast ? '★ SELESAI — KE TOPIK' : '▶ UNSUR BERIKUTNYA', 0xe879f9, () => {
      sfxClick();
      if (isLast) this.scene.start('TdeTopik');
      else this.scene.restart({ levelId: lv.id + 1 });
    });
    mkBtn(764, '↺ ULANGI LEVEL', 0x0f2a3d, () => {
      sfxClick();
      this.scene.restart({ levelId: lv.id });
    });
    mkBtn(852, '≡ DAFTAR UNSUR', 0x0f2a3d, () => {
      sfxClick();
      this.scene.restart({ levelId: 0 });
    });
    void dim;
  }
}
