import Phaser from 'phaser';
import { BIAS_LEVELS, BiasLevel, BiasMeas, measureBias } from '../elkaLevels';
import { getStars, setStar, getSettings, sfxClick, sfxWin, sfxFail, sfxStar, sfxBoom, submitScore, speak, bindKeys } from '../util';
import { mascotBadge } from '../mascot';
import { ensureFxTextures, neonBackdrop, burst, pressable, buttonShadow, hazardStrip } from '../fx';
import { pal } from '../theme';

// Bias Lab — Dasar Elektronika (titik kerja transistor NPN).
// levelId 0 = pilih level.

const KEY = 'elka';

export class BiasScene extends Phaser.Scene {
  private levelId = 0;
  private lv: BiasLevel | null = null;
  private r1Idx = 0;
  private r2Idx = 0;
  private attempts = 0;
  private hintOn = false;
  private winOpen = false;
  private gfx!: Phaser.GameObjects.Graphics;
  private schem: Phaser.GameObjects.Container | null = null;
  private schemZones: Phaser.GameObjects.Zone[] = [];
  private mVb!: Phaser.GameObjects.Text;
  private mVce!: Phaser.GameObjects.Text;
  private mIc!: Phaser.GameObjects.Text;
  private mSt!: Phaser.GameObjects.Text;
  private msg!: Phaser.GameObjects.Text;
  private hintTx!: Phaser.GameObjects.Text;

  constructor() {
    super('Bias');
  }

  init(data: { levelId?: number }): void {
    this.levelId = data.levelId ?? 0;
    const found = BIAS_LEVELS.find((l) => l.id === this.levelId);
    this.lv = found ?? null;
    this.r1Idx = this.lv?.r1slot?.def ?? 0;
    this.r2Idx = this.lv?.r2slot?.def ?? 0;
    this.attempts = 0;
    this.hintOn = false;
    this.winOpen = false;
    this.schem = null;
    this.schemZones = [];
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
      this.scene.start('Course');
    });
    this.add
      .text(W / 2, 100, 'DASAR ELEKTRONIKA', {
        fontSize: '40px', color: P.title, fontStyle: 'bold',
        fontFamily: "'Chakra Petch', sans-serif",
        stroke: '#92400e', strokeThickness: 2,
        shadow: { offsetX: 0, offsetY: 0, color: '#f59e0b', blur: 22, fill: true },
      })
      .setOrigin(0.5);
    this.add
      .text(W / 2, 152, 'Bias Lab • titik kerja transistor NPN', { fontSize: '22px', color: P.dim })
      .setOrigin(0.5);

    const how = this.add.rectangle(W / 2, 250, 624, 120, 0x0b1628, 0.9).setOrigin(0.5);
    how.setStrokeStyle(2, 0x1e3a5f, 1);
    this.add
      .text(W / 2, 250,
        'Atur R1 & R2, tekan POWER,\nkejar Vce target — jangan sampai JENUH!',
        { fontSize: '22px', color: '#e2e8f0', align: 'center', lineSpacing: 7 })
      .setOrigin(0.5);

    const stars = getStars(KEY);
    let next = 1;
    for (let i = 1; i <= BIAS_LEVELS.length; i++) {
      if (stars[i]) next = Math.min(BIAS_LEVELS.length, i + 1);
    }
    const cols = 4;
    const cw = 140;
    const ch = 120;
    const stepX = (624 - cw) / (cols - 1);
    BIAS_LEVELS.forEach((lv, i) => {
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
      .text(W / 2, 700, 'Vb • Ve • Vc • Vce • Ic • jenuh • cutoff', {
        fontSize: '20px', color: P.dim, align: 'center', wordWrap: { width: 620 },
      })
      .setOrigin(0.5);

    const numNames = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT'];
    const keys: Record<string, () => void> = {
      ESC: () => this.scene.start('Course'),
      ENTER: () => this.scene.restart({ levelId: next }),
    };
    BIAS_LEVELS.forEach((lv, i) => {
      keys[numNames[i]] = () => this.scene.restart({ levelId: lv.id });
    });
    bindKeys(this, keys);
  }

  // ---------- main ----------

  private curR(): { r1: number; r2: number } {
    const lv = this.lv!;
    const r1 = lv.r1slot !== null ? lv.r1slot.options[this.r1Idx].r : (lv.r1fixed ?? 10000);
    const r2 = lv.r2slot !== null ? lv.r2slot.options[this.r2Idx].r : (lv.r2fixed ?? 10000);
    return { r1, r2 };
  }

  private fmtK(r: number): string {
    return r >= 1000 ? `${parseFloat((r / 1000).toFixed(1))}k` : `${r}`;
  }

  private buildPlay(): void {
    const W = 720;
    const P = pal();
    const lv = this.lv!;

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

    const card = this.add.rectangle(W / 2, 160, 672, 140, 0x0b1628, 0.92).setOrigin(0.5);
    card.setStrokeStyle(2, 0x1e3a5f, 1);
    this.add.text(60, 105, lv.briefing, {
      fontSize: '20px', color: '#e2e8f0', lineSpacing: 5, wordWrap: { width: 600 },
    });
    this.add.text(60, 188, `${lv.targetLabel}`, {
      fontSize: '20px', color: '#facc15', fontStyle: 'bold', wordWrap: { width: 600 },
    });

    const area = this.add.rectangle(W / 2, 470, 672, 430, 0x070d1d, 0.88).setOrigin(0.5);
    area.setStrokeStyle(2, 0x22d3ee, 0.8);
    this.gfx = this.add.graphics();
    this.drawSchematic();

    // readout
    const labels = ['Vb', 'Vce', 'Ic', 'STATUS'];
    for (let i = 0; i < 4; i++) {
      const x = 60 + i * 162 + 75;
      const bg = this.add.rectangle(x, 730, 150, 84, 0x0b1628, 0.92).setOrigin(0.5);
      bg.setStrokeStyle(2, 0x1e3a5f, 1);
      this.add.text(x, 700, labels[i], { fontSize: '18px', color: '#64748b', fontStyle: 'bold' }).setOrigin(0.5);
    }
    this.mVb = this.add.text(135, 738, '—', { fontSize: '24px', color: '#f8fafc', fontStyle: 'bold' }).setOrigin(0.5);
    this.mVce = this.add.text(297, 738, '—', { fontSize: '24px', color: '#f8fafc', fontStyle: 'bold' }).setOrigin(0.5);
    this.mIc = this.add.text(459, 738, '—', { fontSize: '22px', color: '#f8fafc', fontStyle: 'bold' }).setOrigin(0.5);
    this.mSt = this.add.text(621, 738, '—', { fontSize: '20px', color: '#f8fafc', fontStyle: 'bold' }).setOrigin(0.5);

    // POWER
    buttonShadow(this, W / 2, 830, 672, 76);
    const pwBg = this.add.rectangle(0, 0, 672, 76, 0x22d3ee).setOrigin(0.5);
    pwBg.setStrokeStyle(3, 0xa5f3fc, 1);
    const pwTx = this.add.text(0, 0, 'POWER', { fontSize: '30px', color: '#04121a', fontStyle: 'bold', fontFamily: "'Chakra Petch', sans-serif" }).setOrigin(0.5);
    const pw = this.add.container(W / 2, 830, [pwBg, pwTx]);
    hazardStrip(this, W / 2, 784, 672);
    const pwZone = this.add.zone(W / 2, 830, 672, 88).setInteractive({ useHandCursor: true });
    pressable(this, pwZone, pw);
    pwZone.on('pointerdown', () => this.onPower());
    pwZone.on('pointerover', () => pwBg.setFillStyle(0x67e8f9));
    pwZone.on('pointerout', () => pwBg.setFillStyle(0x22d3ee));

    this.msg = this.add
      .text(W / 2, 878, 'Atur R1/R2, lalu tekan POWER', { fontSize: '21px', color: P.accentTx, align: 'center', wordWrap: { width: 640 } })
      .setOrigin(0.5, 0);

    this.smallBtn(48, 960, 300, 56, 'ⓘ HINT', () => this.toggleHint());
    this.smallBtn(372, 960, 300, 56, '↺ RESET', () => {
      sfxClick();
      this.r1Idx = lv.r1slot?.def ?? 0;
      this.r2Idx = lv.r2slot?.def ?? 0;
      this.drawSchematic();
      this.clearReadout();
    });
    this.hintTx = this.add
      .text(W / 2, 1025, `ⓘ ${lv.hint}\nVb=Vcc·R2/(R1+R2) • Vce=Vc−Ve`, {
        fontSize: '20px', color: '#fde68a', align: 'center', lineSpacing: 5, wordWrap: { width: 640 },
        backgroundColor: '#1c1408', padding: { x: 10, y: 8 },
      })
      .setOrigin(0.5, 0)
      .setVisible(false);

    bindKeys(this, {
      ENTER: () => this.onPower(),
      H: () => this.toggleHint(),
      ESC: () => {
        sfxClick();
        this.scene.restart({ levelId: 0 });
      },
    });
    this.clearReadout();
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

  private rBox(x: number, y: number, w: number, h: number, label: string, slot: 'r1' | 'r2' | null): void {
    const layer = this.schem!;
    if (slot === null) {
      const bg = this.add.rectangle(x, y, w, h, 0x1e293b).setOrigin(0.5).setDepth(4);
      bg.setStrokeStyle(2, 0x475569, 1);
      const tx = this.add.text(x, y, label, { fontSize: '20px', color: '#e2e8f0', fontStyle: 'bold' }).setOrigin(0.5).setDepth(5);
      layer.add([bg, tx]);
      return;
    }
    const glow = this.add.rectangle(x, y, w + 12, h + 12, 0xf59e0b, 0.22).setDepth(3);
    const bg = this.add.rectangle(x, y, w, h, 0xf59e0b).setOrigin(0.5).setDepth(4);
    bg.setStrokeStyle(3, 0xfde68a, 1);
    const tx = this.add.text(x, y, label, { fontSize: '20px', color: '#451a03', fontStyle: 'bold' }).setOrigin(0.5).setDepth(5);
    layer.add([glow, bg, tx]);
    const zone = this.add.zone(x, y, w + 12, h + 12).setInteractive({ useHandCursor: true });
    this.schemZones.push(zone);
    zone.on('pointerdown', () => {
      if (this.winOpen || this.lv === null) return;
      const lv = this.lv;
      if (slot === 'r1' && lv.r1slot !== null) {
        this.r1Idx = (this.r1Idx + 1) % lv.r1slot.options.length;
      } else if (slot === 'r2' && lv.r2slot !== null) {
        this.r2Idx = (this.r2Idx + 1) % lv.r2slot.options.length;
      }
      sfxClick();
      this.clearReadout();
      this.drawSchematic();
    });
    zone.on('pointerover', () => bg.setFillStyle(0xfbbf24));
    zone.on('pointerout', () => bg.setFillStyle(0xf59e0b));
  }

  private drawSchematic(): void {
    const lv = this.lv!;
    const g = this.gfx;
    g.clear();
    // semua objek dinamis masuk 1 container → gampang dibersihkan tiap redraw
    if (this.schem !== null) this.schem.destroy(true);
    for (const z of this.schemZones) z.destroy();
    this.schemZones = [];
    this.schem = this.add.container(0, 0).setDepth(3);
    const { r1, r2 } = this.curR();

    const vccY = 300;
    const gndY = 640;
    const divX = 170;
    const baseY = 470;
    const tX = 470;
    const tY = 470;

    // rel Vcc & kabel
    g.lineStyle(4, 0xef4444, 1);
    g.lineBetween(90, vccY, 630, vccY);
    this.tag(90, vccY - 22, `+Vcc ${lv.vcc}V`, '#fca5a5');
    // Rc vertikal
    g.lineStyle(4, 0x94a3b8, 1);
    g.lineBetween(tX, vccY, tX, 360);
    // R1: Vcc -> basis
    g.lineBetween(divX, vccY, divX, 370);
    g.lineBetween(divX, 470, divX, baseY);
    // R2: basis -> GND
    g.lineBetween(divX, 530, divX, gndY);
    // basis -> kaki B
    g.lineBetween(divX, baseY, tX - 46, baseY);
    // kaki C: Rc -> kolektor
    g.lineBetween(tX, 430, tX, tY - 46);
    // kaki E: emitor -> Re -> GND
    g.lineBetween(tX, tY + 46, tX, 560);
    g.lineBetween(tX, 620, tX, gndY);

    // transistor
    g.fillStyle(0x111827, 1);
    g.fillCircle(tX, tY, 46);
    g.lineStyle(4, 0x4ade80, 1);
    g.strokeCircle(tX, tY, 46);
    // simbol NPN: garis + panah keluar di emitor
    g.lineStyle(5, 0x4ade80, 1);
    g.lineBetween(tX - 22, tY - 26, tX - 22, tY + 26);
    g.lineBetween(tX - 22, tY, tX - 46, tY - 22);
    g.lineBetween(tX - 22, tY, tX - 46, tY + 22);
    this.tag(tX, tY + 62, 'NPN', '#4ade80');
    this.tag(tX - 58, baseY - 20, 'B', '#e2e8f0');
    this.tag(tX + 16, 400, 'C', '#e2e8f0');
    this.tag(tX + 16, 600, 'E', '#e2e8f0');

    // ground
    this.ground(divX, gndY);
    this.ground(tX, gndY);

    // kotak komponen (Ambil alih posisi tombol)
    this.rBox(divX, 420, 110, 60, lv.r1slot !== null ? `R1\n${this.fmtK(r1)}` : `R1\n${this.fmtK(r1)}`, lv.r1slot !== null ? 'r1' : null);
    this.rBox(divX, 585, 110, 60, lv.r2slot !== null ? `R2\n${this.fmtK(r2)}` : `R2\n${this.fmtK(r2)}`, lv.r2slot !== null ? 'r2' : null);
    this.rBox(tX, 395, 110, 56, `Rc\n${this.fmtK(lv.rc)}`, null);
    this.rBox(tX, 590, 110, 56, `Re\n${this.fmtK(lv.re)}`, null);
    this.tag(divX, baseY - 24, `Vb?`, '#fde68a');
  }

  private tag(x: number, y: number, s: string, color: string): void {
    const t = this.add.text(x, y, s, { fontSize: '18px', color, fontStyle: 'bold' }).setOrigin(0.5).setDepth(6);
    t.setAlpha(0.95);
    this.schem?.add(t);
  }

  private ground(x: number, y: number): void {
    const g = this.gfx;
    g.lineStyle(4, 0x94a3b8, 1);
    g.lineBetween(x - 18, y, x + 18, y);
    g.lineBetween(x - 12, y + 8, x + 12, y + 8);
    g.lineBetween(x - 5, y + 16, x + 5, y + 16);
  }

  private clearReadout(): void {
    this.mVb.setText('—');
    this.mVce.setText('—');
    this.mIc.setText('—');
    this.mSt.setText('—').setColor('#f8fafc');
    this.msg.setText('Atur R1/R2, lalu tekan POWER').setColor(pal().accentTx);
  }

  private onPower(): void {
    if (this.winOpen || this.lv === null) return;
    const lv = this.lv;
    const { r1, r2 } = this.curR();
    const m = measureBias(lv.vcc, lv.rc, lv.re, r1, r2);
    this.mVb.setText(`${m.vb.toFixed(2)}V`);
    this.mVce.setText(`${m.vce.toFixed(2)}V`);
    this.mIc.setText(`${m.ic.toFixed(2)}mA`);
    const stCol = m.status === 'AKTIF' ? '#4ade80' : m.status === 'HAMPIR-JENUH' ? '#fbbf24' : '#f87171';
    this.mSt.setText(m.status).setColor(stCol);
    this.attempts += 1;

    if (m.status === 'JENUH') {
      sfxFail();
      sfxBoom();
      if (getSettings().shake) this.cameras.main.shake(240, 0.013);
      burst(this, 470, 470, { colors: [0xef4444, 0xf59e0b, 0xffffff], count: 26 });
      this.msg.setText(`× JENUH! Vc (${m.vc.toFixed(1)}V) < Ve (${m.ve.toFixed(1)}V). Besarkan R1 / kecilkan R2!`).setColor(pal().bad);
      return;
    }
    if (m.status === 'CUTOFF') {
      sfxFail();
      this.msg.setText(`○ CUTOFF! Vb (${m.vb.toFixed(1)}V) < 0,7V — transistor mati. Kecilkan R1 / besarkan R2!`).setColor(pal().warn);
      return;
    }
    const vOk = m.vce >= lv.tVmin && m.vce <= lv.tVmax;
    const iMinOk = lv.tImin == null || m.ic >= lv.tImin;
    const iMaxOk = lv.tImax == null || m.ic <= lv.tImax;
    if (vOk && iMinOk && iMaxOk) {
      this.onWin(m);
      return;
    }
    sfxFail();
    this.msg.setText(`▼ Belum pas: Vce=${m.vce.toFixed(2)}V, Ic=${m.ic.toFixed(2)}mA. ${lv.targetLabel}`).setColor(pal().warn);
  }

  private onWin(m: BiasMeas): void {
    sfxWin();
    sfxStar();
    speak('Titik kerja pas! ' + this.lv!.prinsip + ' ' + this.lv!.bedah.join(' '));
    this.winOpen = true;
    this.cameras.main.flash(250, 190, 255, 210);
    const lv = this.lv!;
    const earned = this.attempts <= 1 ? 3 : this.attempts <= 3 ? 2 : 1;
    setStar(KEY, lv.id, earned);
    submitScore('elka', lv.id, earned);
    burst(this, 360, 470, { colors: [0x4ade80, 0x22d3ee, 0xfacc15, 0xffffff], count: 36, distMin: 80, distMax: 280 });

    const W = 720;
    const dim = this.add.rectangle(W / 2, 640, 720, 1280, 0x000000, 0.72).setDepth(20);
    const panel = this.add.rectangle(W / 2, 630, 600, 760, 0x0b1628).setDepth(21);
    panel.setStrokeStyle(3, 0x4ade80, 1);
    mascotBadge(this, 598, 258, 0.8, 'happy').setDepth(24);
    const d = this.add.container(0, 0).setDepth(22);
    const t1 = this.add.text(W / 2, 322, '★ TITIK KERJA PAS!', { fontSize: '32px', color: '#4ade80', fontStyle: 'bold' }).setOrigin(0.5);
    const t2 = this.add.text(W / 2, 366, '★'.repeat(earned) + '☆'.repeat(3 - earned), { fontSize: '40px', color: '#facc15' }).setOrigin(0.5);
    const t3 = this.add.text(W / 2, 410,
      `Vb=${m.vb.toFixed(2)}V  Vce=${m.vce.toFixed(2)}V\nIc=${m.ic.toFixed(2)}mA • ${this.attempts}× POWER`,
      { fontSize: '20px', color: '#e2e8f0', align: 'center', lineSpacing: 5 }).setOrigin(0.5);
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
      const bg = this.add.rectangle(W / 2, y, 440, 72, bgc).setOrigin(0.5);
      bg.setStrokeStyle(2, 0xa5f3fc, 1);
      const tx = this.add.text(W / 2, y, label, { fontSize: '26px', color: bgc === 0x4ade80 ? '#052e16' : '#e2e8f0', fontStyle: 'bold' }).setOrigin(0.5);
      const z = this.add.zone(W / 2, y, 440, 72).setInteractive({ useHandCursor: true }).setDepth(23);
      d.add([bg, tx]);
      z.on('pointerdown', cb);
    };
    const isLast = lv.id >= BIAS_LEVELS.length;
    mkBtn(796, isLast ? '★ SELESAI — KE MAPEL' : '▶ LEVEL BERIKUTNYA', 0x4ade80, () => {
      sfxClick();
      if (isLast) this.scene.start('Course');
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
