import Phaser from 'phaser';
import { AC_LEVELS, ACLevel, ACMeas, measureAC } from '../acLevels';
import { getStars, setStar, sfxClick, sfxWin, sfxFail, sfxStar, submitScore, speak, beep, bindKeys } from '../util';
import { mascotBadge } from '../mascot';
import { ensureFxTextures, neonBackdrop, burst, pressable, buttonShadow, hazardStrip } from '../fx';
import { pal } from '../theme';

// Lab AC — Rangkaian Listrik (RLC seri + fasor + osiloskop).
// levelId 0 = pilih level.

const KEY = 'rl';

interface ChainItem {
  kind: 'VS' | 'R' | 'L' | 'C';
  cx: number;
}

export class ACScene extends Phaser.Scene {
  private levelId = 0;
  private lv: ACLevel | null = null;
  private slotIdx: Record<string, number> = {};
  private slotBtns: Phaser.GameObjects.Container[] = [];
  private slotZones: Phaser.GameObjects.Zone[] = [];
  private slotLabels: Record<string, Phaser.GameObjects.Text> = {};
  private attempts = 0;
  private hintOn = false;
  private winOpen = false;
  private gfx!: Phaser.GameObjects.Graphics;
  private scopeGfx!: Phaser.GameObjects.Graphics;
  private rV!: Phaser.GameObjects.Text;
  private rZ!: Phaser.GameObjects.Text;
  private rPhi!: Phaser.GameObjects.Text;
  private rPf!: Phaser.GameObjects.Text;
  private rLine!: Phaser.GameObjects.Text;
  private msg!: Phaser.GameObjects.Text;
  private hintTx!: Phaser.GameObjects.Text;

  constructor() {
    super('AC');
  }

  init(data: { levelId?: number }): void {
    this.levelId = data.levelId ?? 0;
    const found = AC_LEVELS.find((l) => l.id === this.levelId);
    this.lv = found ?? null;
    this.slotIdx = {};
    this.slotBtns = [];
    this.slotZones = [];
    this.slotLabels = {};
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
      .text(24, 20, '‹ MATA KULIAH', { fontSize: '24px', color: P.accentTx, fontStyle: 'bold' })
      .setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => {
      sfxClick();
      this.scene.start('Course');
    });
    this.add
      .text(W / 2, 100, 'RANGKAIAN LISTRIK', {
        fontSize: '42px', color: P.title, fontStyle: 'bold',
        fontFamily: "'Chakra Petch', sans-serif",
        stroke: '#92400e', strokeThickness: 2,
        shadow: { offsetX: 0, offsetY: 0, color: '#f59e0b', blur: 22, fill: true },
      })
      .setOrigin(0.5);
    this.add
      .text(W / 2, 152, 'Lab AC • RLC seri • fasor • osiloskop', { fontSize: '22px', color: P.dim })
      .setOrigin(0.5);

    const how = this.add.rectangle(W / 2, 250, 624, 120, 0x0b1628, 0.9).setOrigin(0.5);
    how.setStrokeStyle(2, 0x1e3a5f, 1);
    this.add
      .text(W / 2, 250,
        'Atur L / C / frekuensi, tekan POWER,\nkejar target arus, tegangan & faktor daya!',
        { fontSize: '22px', color: '#e2e8f0', align: 'center', lineSpacing: 7 })
      .setOrigin(0.5);

    const stars = getStars(KEY);
    let next = 1;
    for (let i = 1; i <= AC_LEVELS.length; i++) {
      if (stars[i]) next = Math.min(AC_LEVELS.length, i + 1);
    }
    const cols = 4;
    const cw = 140;
    const ch = 120;
    const stepX = (624 - cw) / (cols - 1);
    AC_LEVELS.forEach((lv, i) => {
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
      .text(W / 2, 700, 'Resonansi • impedansi • sudut fasa • faktor daya', {
        fontSize: '20px', color: P.dim, align: 'center', wordWrap: { width: 620 },
      })
      .setOrigin(0.5);

    const numNames = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT'];
    const keys: Record<string, () => void> = {
      ESC: () => this.scene.start('Course'),
      ENTER: () => this.scene.restart({ levelId: next }),
    };
    AC_LEVELS.forEach((lv, i) => {
      keys[numNames[i]] = () => this.scene.restart({ levelId: lv.id });
    });
    bindKeys(this, keys);
  }

  // ---------- main ----------

  private curVals(): { f: number; L: number; C: number } {
    const lv = this.lv!;
    let f = lv.f ?? 0;
    let L = lv.L ?? 0;
    let C = lv.C ?? 0;
    for (const s of lv.slots) {
      const v = s.options[this.slotIdx[s.id] ?? s.def].v;
      if (s.kind === 'f') f = v;
      else if (s.kind === 'L') L = v;
      else C = v;
    }
    return { f, L, C };
  }

  private fmtC(c: number): string {
    return `${Math.round(c * 1e6)}µF`;
  }

  private fmtL(l: number): string {
    const mh = l * 1000;
    return mh >= 100 ? `${Math.round(mh)}mH` : `${mh.toFixed(0)}mH`;
  }

  private buildPlay(): void {
    const W = 720;
    const P = pal();
    const lv = this.lv!;
    for (const s of lv.slots) this.slotIdx[s.id] = s.def;

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

    // rantai seri: VS - R - L - C
    const area = this.add.rectangle(W / 2, 330, 672, 170, 0x070d1d, 0.88).setOrigin(0.5);
    area.setStrokeStyle(2, 0x22d3ee, 0.8);
    this.gfx = this.add.graphics();
    const items: ChainItem[] = [
      { kind: 'VS', cx: 132 },
      { kind: 'R', cx: 288 },
      { kind: 'L', cx: 444 },
      { kind: 'C', cx: 588 },
    ];
    this.drawChain(items);

    // readout
    const labels = ['I TOTAL', 'Z', 'φ', 'cos φ'];
    for (let i = 0; i < 4; i++) {
      const x = 60 + i * 162 + 75;
      const bg = this.add.rectangle(x, 470, 150, 84, 0x0b1628, 0.92).setOrigin(0.5);
      bg.setStrokeStyle(2, 0x1e3a5f, 1);
      this.add.text(x, 440, labels[i], { fontSize: '18px', color: '#64748b', fontStyle: 'bold' }).setOrigin(0.5);
    }
    this.rV = this.add.text(135, 478, '—', { fontSize: '24px', color: '#f8fafc', fontStyle: 'bold' }).setOrigin(0.5);
    this.rZ = this.add.text(297, 478, '—', { fontSize: '24px', color: '#f8fafc', fontStyle: 'bold' }).setOrigin(0.5);
    this.rPhi = this.add.text(459, 478, '—', { fontSize: '24px', color: '#f8fafc', fontStyle: 'bold' }).setOrigin(0.5);
    this.rPf = this.add.text(621, 478, '—', { fontSize: '24px', color: '#f8fafc', fontStyle: 'bold' }).setOrigin(0.5);
    this.rLine = this.add
      .text(W / 2, 522, 'VR=—  VL=—  VC=—   •   SIFAT: —', { fontSize: '20px', color: P.accentTx, fontStyle: 'bold' })
      .setOrigin(0.5, 0);

    // osiloskop
    const scr = this.add.rectangle(W / 2, 650, 672, 170, 0x030710, 1).setOrigin(0.5);
    scr.setStrokeStyle(2, 0x164e63, 1);
    this.add.text(60, 578, 'OSILOSKOP (cyan=Vs, kuning=VR)', { fontSize: '19px', color: '#64748b' }).setOrigin(0, 0);
    this.scopeGfx = this.add.graphics();
    this.drawScope(null);

    // POWER
    buttonShadow(this, W / 2, 790, 672, 76);
    const pwBg = this.add.rectangle(0, 0, 672, 76, 0x22d3ee).setOrigin(0.5);
    pwBg.setStrokeStyle(3, 0xa5f3fc, 1);
    const pwTx = this.add.text(0, 0, 'POWER', { fontSize: '30px', color: '#04121a', fontStyle: 'bold', fontFamily: "'Chakra Petch', sans-serif" }).setOrigin(0.5);
    const pw = this.add.container(W / 2, 790, [pwBg, pwTx]);
    hazardStrip(this, W / 2, 744, 672);
    const pwZone = this.add.zone(W / 2, 790, 672, 88).setInteractive({ useHandCursor: true });
    pressable(this, pwZone, pw);
    pwZone.on('pointerdown', () => this.onPower());
    pwZone.on('pointerover', () => pwBg.setFillStyle(0x67e8f9));
    pwZone.on('pointerout', () => pwBg.setFillStyle(0x22d3ee));

    this.msg = this.add
      .text(W / 2, 838, 'Atur komponen, lalu tekan POWER', { fontSize: '21px', color: P.accentTx, align: 'center', wordWrap: { width: 640 } })
      .setOrigin(0.5, 0);

    this.smallBtn(48, 920, 300, 56, 'ⓘ HINT', () => this.toggleHint());
    this.smallBtn(372, 920, 300, 56, '↺ RESET', () => {
      sfxClick();
      for (const s of lv.slots) {
        this.slotIdx[s.id] = s.def;
      }
      this.clearReadout();
      this.drawChain([
        { kind: 'VS', cx: 132 },
        { kind: 'R', cx: 288 },
        { kind: 'L', cx: 444 },
        { kind: 'C', cx: 588 },
      ]);
      this.drawScope(null);
    });
    this.hintTx = this.add
      .text(W / 2, 985, `ⓘ ${lv.hint}`, {
        fontSize: '20px', color: '#fde68a', align: 'center', wordWrap: { width: 640 },
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

  private slotText(slotId: string): string {
    const lv = this.lv!;
    const s = lv.slots.find((d) => d.id === slotId)!;
    return `${s.id}: ${s.options[this.slotIdx[slotId] ?? s.def].label}`;
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

  private drawChain(items: ChainItem[]): void {
    const lv = this.lv!;
    const g = this.gfx;
    g.clear();
    const y = 330;
    // kabel loop
    g.lineStyle(4, 0x334155, 1);
    g.lineBetween(48, y, 672, y);
    g.lineBetween(48, y, 48, y + 55);
    g.lineBetween(672, y, 672, y + 55);
    g.lineBetween(48, y + 55, 672, y + 55);
    for (const s of this.slotBtns) s.destroy(true);
    this.slotBtns = [];
    for (const z of this.slotZones) z.destroy();
    this.slotZones = [];
    this.slotLabels = {};

    for (const it of items) {
      let label = '';
      let slotId: string | null = null;
      if (it.kind === 'VS') {
        const fs = lv.slots.find((s) => s.kind === 'f');
        const { f } = this.curVals();
        label = fs !== undefined ? `~${lv.vs}V\n${this.slotText(fs.id).split(': ')[1]}` : `~${lv.vs}V\n${f} Hz`;
        slotId = fs !== undefined ? fs.id : null;
      } else if (it.kind === 'R') {
        label = `R\n${lv.R}Ω`;
      } else if (it.kind === 'L') {
        const ls = lv.slots.find((s) => s.kind === 'L');
        label = ls !== undefined ? `L\n${this.slotText(ls.id).split(': ')[1]}` : `L\n${this.fmtL(lv.L ?? 0)}`;
        slotId = ls !== undefined ? ls.id : null;
      } else {
        const cs = lv.slots.find((s) => s.kind === 'C');
        label = cs !== undefined ? `C\n${this.slotText(cs.id).split(': ')[1]}` : `C\n${this.fmtC(lv.C ?? 0)}`;
        slotId = cs !== undefined ? cs.id : null;
      }
      if (slotId !== null) {
        const sid: string = slotId;
        const glow = this.add.rectangle(0, 0, 128, 84, 0xf59e0b, 0.22).setDepth(3);
        const bg = this.add.rectangle(0, 0, 116, 72, 0xf59e0b).setOrigin(0.5).setDepth(4);
        bg.setStrokeStyle(3, 0xfde68a, 1);
        const tx = this.add.text(0, 0, label, {
          fontSize: '19px', color: '#451a03', fontStyle: 'bold', align: 'center', lineSpacing: 2,
        }).setOrigin(0.5).setDepth(5);
        const btn = this.add.container(it.cx, y, [glow, bg, tx]);
        const zone = this.add.zone(it.cx, y, 128, 84).setInteractive({ useHandCursor: true });
        this.slotZones.push(zone);
        pressable(this, zone, btn);
        zone.on('pointerdown', () => {
          if (this.winOpen) return;
          const def = lv.slots.find((d) => d.id === sid)!;
          this.slotIdx[sid] = (this.slotIdx[sid] + 1) % def.options.length;
          tx.setText(this.compactLabel(sid));
          sfxClick();
          this.clearReadout();
          this.drawChain(items);
          this.drawScope(null);
        });
        this.slotBtns.push(btn);
        this.slotLabels[sid] = tx;
      } else {
        const bg = this.add.rectangle(it.cx, y, 116, 72, 0x1e293b).setOrigin(0.5).setDepth(4);
        bg.setStrokeStyle(2, 0x475569, 1);
        this.add.text(it.cx, y, label, {
          fontSize: '19px', color: '#e2e8f0', fontStyle: 'bold', align: 'center', lineSpacing: 2,
        }).setOrigin(0.5).setDepth(5);
        this.slotBtns.push(bg as unknown as Phaser.GameObjects.Container);
      }
    }
  }

  private compactLabel(slotId: string): string {
    const lv = this.lv!;
    const s = lv.slots.find((d) => d.id === slotId)!;
    const opt = s.options[this.slotIdx[slotId]].label;
    if (s.kind === 'f') return `~${lv.vs}V\n${opt}`;
    if (s.kind === 'L') return `L\n${opt}`;
    return `C\n${opt}`;
  }

  private clearReadout(): void {
    this.rV.setText('—');
    this.rZ.setText('—');
    this.rPhi.setText('—');
    this.rPf.setText('—');
    this.rLine.setText('VR=—  VL=—  VC=—   •   SIFAT: —').setColor(pal().accentTx);
    this.msg.setText('Atur komponen, lalu tekan POWER').setColor(pal().accentTx);
  }

  private drawScope(m: ACMeas | null): void {
    const g = this.scopeGfx;
    g.clear();
    const x0 = 60;
    const w = 600;
    const mid = 650;
    const amp = 52;
    g.lineStyle(1, 0x1e3a5f, 1);
    g.lineBetween(x0, mid, x0 + w, mid);
    for (let gx = 0; gx <= w; gx += 60) g.lineBetween(x0 + gx, mid - 62, x0 + gx, mid + 62);
    if (m === null) {
      g.lineStyle(2, 0x334155, 0.6);
      g.lineBetween(x0, mid, x0 + w, mid);
      return;
    }
    const lv = this.lv!;
    const phi = (m.xl >= m.xc ? 1 : -1) * Math.acos(Math.max(-1, Math.min(1, m.pf)));
    const steps = 90;
    // Vs referensi
    g.lineStyle(3, 0x22d3ee, 0.9);
    this.trace(g, x0, w, mid, amp, 0, steps);
    // VR sefasa arus → tertinggal φ dari Vs bila induktif
    g.lineStyle(3, 0xfacc15, 1);
    this.trace(g, x0, w, mid, amp * (m.vr / lv.vs), -phi, steps);
  }

  private trace(g: Phaser.GameObjects.Graphics, x0: number, w: number, mid: number, amp: number, shift: number, steps: number): void {
    let px = x0;
    let py = mid - amp * Math.sin(shift);
    for (let i = 1; i <= steps; i++) {
      const x = x0 + (w * i) / steps;
      const y = mid - amp * Math.sin((i / steps) * Math.PI * 4 + shift);
      g.lineBetween(px, py, x, y);
      px = x;
      py = y;
    }
  }

  private onPower(): void {
    if (this.winOpen || this.lv === null) return;
    const lv = this.lv;
    beep(220, 0.12, 'sawtooth', 0.08);
    const { f, L, C } = this.curVals();
    const m = measureAC(lv.vs, f, lv.R, L, C);
    this.rV.setText(`${m.i.toFixed(2)} A`);
    this.rZ.setText(`${m.z.toFixed(1)} Ω`);
    this.rPhi.setText(`${m.phi.toFixed(0)}°`);
    this.rPf.setText(m.pf.toFixed(2));
    const natCol = m.nature === 'RES' ? '#4ade80' : m.nature === 'IND' ? '#67e8f9' : '#f0abfc';
    const natTx = m.nature === 'RES' ? 'RESONANSI!' : m.nature === 'IND' ? 'INDUKTIF' : 'KAPASITIF';
    this.rLine.setText(`VR=${m.vr.toFixed(1)}V  VL=${m.vl.toFixed(1)}V  VC=${m.vc.toFixed(1)}V   •   ${natTx}`).setColor(natCol);
    this.drawScope(m);
    this.attempts += 1;

    if (lv.check(m)) {
      this.onWin(m);
      return;
    }
    sfxFail();
    this.msg.setText(`▼ Belum pas: I=${m.i.toFixed(2)}A, φ=${m.phi.toFixed(0)}° (${natTx}). ${lv.targetLabel}`).setColor(pal().warn);
  }

  private onWin(m: ACMeas): void {
    sfxWin();
    sfxStar();
    speak('Rangkaian benar! ' + this.lv!.prinsip + ' ' + this.lv!.bedah.join(' '));
    this.winOpen = true;
    this.cameras.main.flash(250, 180, 255, 200);
    const lv = this.lv!;
    const earned = this.attempts <= 1 ? 3 : this.attempts <= 3 ? 2 : 1;
    setStar(KEY, lv.id, earned);
    submitScore('rl', lv.id, earned);
    burst(this, 360, 650, { colors: [0x22d3ee, 0xfacc15, 0xe879f9, 0xffffff], count: 36, distMin: 80, distMax: 280 });

    const W = 720;
    const dim = this.add.rectangle(W / 2, 640, 720, 1280, 0x000000, 0.72).setDepth(20);
    const panel = this.add.rectangle(W / 2, 630, 600, 760, 0x0b1628).setDepth(21);
    panel.setStrokeStyle(3, 0x22d3ee, 1);
    mascotBadge(this, 598, 258, 0.8, 'happy').setDepth(24);
    const d = this.add.container(0, 0).setDepth(22);
    const t1 = this.add.text(W / 2, 322, '★ RANGKAIAN BENAR!', { fontSize: '32px', color: '#4ade80', fontStyle: 'bold' }).setOrigin(0.5);
    const t2 = this.add.text(W / 2, 366, '★'.repeat(earned) + '☆'.repeat(3 - earned), { fontSize: '40px', color: '#facc15' }).setOrigin(0.5);
    const t3 = this.add.text(W / 2, 410,
      `I=${m.i.toFixed(2)}A  Z=${m.z.toFixed(1)}Ω\nφ=${m.phi.toFixed(0)}°  cos φ=${m.pf.toFixed(2)} • ${this.attempts}× POWER`,
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
      const tx = this.add.text(W / 2, y, label, { fontSize: '26px', color: bgc === 0x22d3ee ? '#04121a' : '#e2e8f0', fontStyle: 'bold' }).setOrigin(0.5);
      const z = this.add.zone(W / 2, y, 440, 72).setInteractive({ useHandCursor: true }).setDepth(23);
      d.add([bg, tx]);
      z.on('pointerdown', cb);
    };
    const isLast = lv.id >= AC_LEVELS.length;
    mkBtn(796, isLast ? '★ SELESAI — KE MAPEL' : '▶ LEVEL BERIKUTNYA', 0x22d3ee, () => {
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
