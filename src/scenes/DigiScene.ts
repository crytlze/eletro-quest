import Phaser from 'phaser';
import { DIGI_LEVELS, DigiLevel, GateType, evalGate, evalCircuit, checkCircuit, rowLabel } from '../digiLevels';
import { getStars, setStar, sfxClick, sfxWin, sfxFail, sfxStar, submitScore, speak, beep, bindKeys } from '../util';
import { mascotBadge } from '../mascot';
import { ensureFxTextures, neonBackdrop, burst, pressable, buttonShadow, hazardStrip } from '../fx';
import { pal } from '../theme';

// Gerbang Quest — Elektronika Digital. Atur input & jenis gerbang,
// LED update live, CEK untuk nilai semua baris tabel kebenaran.
// levelId 0 = pilih level.

const KEY = 'digi';

export class DigiScene extends Phaser.Scene {
  private levelId = 0;
  private lv: DigiLevel | null = null;
  private inVals: number[] = [];
  private slotIdx: Record<string, number> = {};
  private gateLeds: Phaser.GameObjects.Arc[] = [];
  private outLed!: Phaser.GameObjects.Arc;
  private outTx!: Phaser.GameObjects.Text;
  private inTxs: Phaser.GameObjects.Text[] = [];
  private inBgs: Phaser.GameObjects.Rectangle[] = [];
  private slotTxs: Record<string, Phaser.GameObjects.Text> = {};
  private msg!: Phaser.GameObjects.Text;
  private hintTx!: Phaser.GameObjects.Text;
  private hintOn = false;
  private attempts = 0;
  private winOpen = false;

  constructor() {
    super('Digital');
  }

  init(data: { levelId?: number }): void {
    this.levelId = data.levelId ?? 0;
    const found = DIGI_LEVELS.find((l) => l.id === this.levelId);
    this.lv = found ?? null;
    this.inVals = (this.lv?.inputs ?? []).map(() => 0);
    this.slotIdx = {};
    this.gateLeds = [];
    this.inTxs = [];
    this.inBgs = [];
    this.slotTxs = {};
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
      .text(W / 2, 100, 'ELEKTRONIKA DIGITAL', {
        fontSize: '38px', color: P.title, fontStyle: 'bold',
        fontFamily: "'Chakra Petch', sans-serif",
        stroke: '#92400e', strokeThickness: 2,
        shadow: { offsetX: 0, offsetY: 0, color: '#f59e0b', blur: 22, fill: true },
      })
      .setOrigin(0.5);
    this.add
      .text(W / 2, 152, 'Gerbang Quest • tabel kebenaran', { fontSize: '22px', color: P.dim })
      .setOrigin(0.5);

    const how = this.add.rectangle(W / 2, 250, 624, 120, 0x0b1628, 0.9).setOrigin(0.5);
    how.setStrokeStyle(2, 0x1e3a5f, 1);
    this.add
      .text(W / 2, 250,
        'Ketuk input (0/1) & kotak gerbang oranye.\nLED nyala live — CEK untuk nilai semua baris!',
        { fontSize: '22px', color: '#e2e8f0', align: 'center', lineSpacing: 7 })
      .setOrigin(0.5);

    const stars = getStars(KEY);
    let next = 1;
    for (let i = 1; i <= DIGI_LEVELS.length; i++) {
      if (stars[i]) next = Math.min(DIGI_LEVELS.length, i + 1);
    }
    const cols = 4;
    const cw = 140;
    const ch = 120;
    const stepX = (624 - cw) / (cols - 1);
    DIGI_LEVELS.forEach((lv, i) => {
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
      .text(W / 2, 700, 'NOT • AND • OR • XOR • NAND • adder • MUX', {
        fontSize: '20px', color: P.dim, align: 'center', wordWrap: { width: 620 },
      })
      .setOrigin(0.5);

    const numNames = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT'];
    const keys: Record<string, () => void> = {
      ESC: () => this.scene.start('Course'),
      ENTER: () => this.scene.restart({ levelId: next }),
    };
    DIGI_LEVELS.forEach((lv, i) => {
      keys[numNames[i]] = () => this.scene.restart({ levelId: lv.id });
    });
    bindKeys(this, keys);
  }

  // ---------- main ----------

  private types(): Record<string, GateType> {
    const out: Record<string, GateType> = {};
    for (const g of this.lv!.gates) {
      if (g.type === null) {
        out[g.id] = g.options![this.slotIdx[g.id] ?? g.def ?? 0];
      }
    }
    return out;
  }

  private buildPlay(): void {
    const W = 720;
    const P = pal();
    const lv = this.lv!;
    for (const g of lv.gates) {
      if (g.type === null) this.slotIdx[g.id] = g.def ?? 0;
    }

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
    this.add.text(60, 188, 'Cocokkan SEMUA baris tabel kebenaran', {
      fontSize: '20px', color: '#facc15', fontStyle: 'bold',
    });

    // input toggles
    const n = lv.inputs.length;
    const iw = Math.min(190, 600 / n);
    lv.inputs.forEach((nm, i) => {
      const x = W / 2 + (i - (n - 1) / 2) * (iw + 16);
      const bg = this.add.rectangle(x, 300, iw, 76, 0x0f2a3d).setOrigin(0.5);
      bg.setStrokeStyle(3, 0x334155, 1);
      const tx = this.add.text(x, 300, `${nm}=0`, { fontSize: '30px', color: '#64748b', fontStyle: 'bold' }).setOrigin(0.5);
      const z = this.add.zone(x, 300, iw, 88).setInteractive({ useHandCursor: true });
      z.on('pointerdown', () => {
        if (this.winOpen) return;
        this.inVals[i] = this.inVals[i] === 1 ? 0 : 1;
        beep(this.inVals[i] === 1 ? 660 : 440, 0.07, 'square', 0.07);
        this.refresh();
      });
      this.inBgs.push(bg);
      this.inTxs.push(tx);
    });

    // gerbang + LED
    let gy = 420;
    lv.gates.forEach((g) => {
      this.add.text(60, gy, `${g.id} =`, { fontSize: '26px', color: P.ink, fontStyle: 'bold' }).setOrigin(0, 0.5);
      if (g.type === null) {
        const opt = g.options![this.slotIdx[g.id]];
        const bg = this.add.rectangle(0, 0, 150, 62, 0xf59e0b).setOrigin(0.5);
        bg.setStrokeStyle(3, 0xfde68a, 1);
        const tx = this.add.text(0, 0, opt, { fontSize: '24px', color: '#451a03', fontStyle: 'bold' }).setOrigin(0.5);
        const vis = this.add.container(250, gy, [bg, tx]);
        const z = this.add.zone(250, gy, 150, 76).setInteractive({ useHandCursor: true });
        pressable(this, z, vis);
        z.on('pointerdown', () => {
          if (this.winOpen) return;
          const opts = g.options!;
          this.slotIdx[g.id] = (this.slotIdx[g.id] + 1) % opts.length;
          tx.setText(opts[this.slotIdx[g.id]]);
          sfxClick();
          this.refresh();
        });
        this.slotTxs[g.id] = tx;
      } else {
        const bg = this.add.rectangle(250, gy, 150, 62, 0x1e293b).setOrigin(0.5);
        bg.setStrokeStyle(2, 0x475569, 1);
        this.add.text(250, gy, g.type, { fontSize: '24px', color: '#e2e8f0', fontStyle: 'bold' }).setOrigin(0.5);
      }
      this.add.text(350, gy, `(${g.ins.join(' , ')})`, { fontSize: '21px', color: P.dim }).setOrigin(0, 0.5);
      const led = this.add.circle(620, gy, 20, 0x1e293b, 1).setStrokeStyle(3, 0x475569, 1);
      this.gateLeds.push(led);
      gy += 78;
    });

    // output besar
    const oy = gy + 10;
    this.add.text(60, oy, 'OUT =', { fontSize: '30px', color: P.ink, fontStyle: 'bold' }).setOrigin(0, 0.5);
    this.outLed = this.add.circle(230, oy, 30, 0x1e293b, 1).setStrokeStyle(4, 0x475569, 1);
    this.outTx = this.add.text(290, oy, '0', { fontSize: '34px', color: P.dim, fontStyle: 'bold' }).setOrigin(0, 0.5);

    // CEK
    const cy = oy + 80;
    buttonShadow(this, W / 2, cy, 672, 76);
    const cBg = this.add.rectangle(0, 0, 672, 76, 0x22d3ee).setOrigin(0.5);
    cBg.setStrokeStyle(3, 0xa5f3fc, 1);
    const cTx = this.add.text(0, 0, 'CEK SEMUA BARIS', { fontSize: '28px', color: '#04121a', fontStyle: 'bold', fontFamily: "'Chakra Petch', sans-serif" }).setOrigin(0.5);
    const cBtn = this.add.container(W / 2, cy, [cBg, cTx]);
    hazardStrip(this, W / 2, cy - 52, 672);
    const cZone = this.add.zone(W / 2, cy, 672, 88).setInteractive({ useHandCursor: true });
    pressable(this, cZone, cBtn);
    cZone.on('pointerdown', () => this.onCheck());
    cZone.on('pointerover', () => cBg.setFillStyle(0x67e8f9));
    cZone.on('pointerout', () => cBg.setFillStyle(0x22d3ee));

    this.msg = this.add
      .text(W / 2, cy + 48, 'Atur input & gerbang, lalu CEK', { fontSize: '21px', color: P.accentTx, align: 'center', wordWrap: { width: 640 } })
      .setOrigin(0.5, 0);

    this.hintTx = this.add
      .text(W / 2, cy + 108, `ⓘ ${lv.hint}`, {
        fontSize: '20px', color: '#fde68a', align: 'center', wordWrap: { width: 620 },
        backgroundColor: '#1c1408', padding: { x: 10, y: 8 },
      })
      .setOrigin(0.5, 0)
      .setVisible(false);
    const hz = this.add.zone(W / 2, cy + 78, 320, 64).setInteractive({ useHandCursor: true });
    const ht = this.add.text(W / 2, cy + 78, 'ⓘ hint', { fontSize: '19px', color: P.dim }).setOrigin(0.5);
    hz.on('pointerdown', () => {
      sfxClick();
      this.hintOn = !this.hintOn;
      this.hintTx.setVisible(this.hintOn);
      ht.setColor(this.hintOn ? pal().warn : pal().dim);
    });

    const numNames = ['ONE', 'TWO', 'THREE'];
    const keys: Record<string, () => void> = {
      SPACE: () => this.onCheck(),
      ENTER: () => this.onCheck(),
      ESC: () => {
        sfxClick();
        this.scene.restart({ levelId: 0 });
      },
    };
    lv.inputs.forEach((nm, i) => {
      void nm;
      keys[numNames[i]] = () => {
        if (this.winOpen) return;
        this.inVals[i] = this.inVals[i] === 1 ? 0 : 1;
        beep(this.inVals[i] === 1 ? 660 : 440, 0.07, 'square', 0.07);
        this.refresh();
      };
    });
    bindKeys(this, keys);
    this.refresh();
  }

  private refresh(): void {
    const lv = this.lv!;
    lv.inputs.forEach((nm, i) => {
      const on = this.inVals[i] === 1;
      this.inTxs[i].setText(`${nm}=${on ? 1 : 0}`);
      this.inTxs[i].setColor(on ? '#4ade80' : '#64748b');
      this.inBgs[i].setStrokeStyle(3, on ? 0x4ade80 : 0x334155, 1);
    });
    let row = 0;
    lv.inputs.forEach((nm, i) => {
      void nm;
      if (this.inVals[i] === 1) row |= 1 << i;
    });
    const types = this.types();
    const sig = new Map<string, number>();
    lv.inputs.forEach((nm, i) => sig.set(nm, this.inVals[i]));
    lv.gates.forEach((g, gi) => {
      const t = g.type ?? types[g.id];
      const v = evalGate(t, g.ins.map((s) => sig.get(s) ?? 0));
      sig.set(g.id, v);
      const led = this.gateLeds[gi];
      led.setFillStyle(v === 1 ? 0x4ade80 : 0x1e293b, 1);
      led.setStrokeStyle(3, v === 1 ? 0xbbf7d0 : 0x475569, 1);
    });
    const out = sig.get(lv.out) ?? 0;
    this.outLed.setFillStyle(out === 1 ? 0xfacc15 : 0x1e293b, 1);
    this.outLed.setStrokeStyle(4, out === 1 ? 0xfde68a : 0x475569, 1);
    this.outTx.setText(`${out}`).setColor(out === 1 ? pal().warn : pal().dim);
  }

  private onCheck(): void {
    if (this.winOpen || this.lv === null) return;
    const lv = this.lv;
    this.attempts += 1;
    const res = checkCircuit(lv, this.types());
    if (res.ok) {
      this.onWin();
      return;
    }
    sfxFail();
    this.showTable(res.badRow);
  }

  private showTable(badRow: number): void {
    const lv = this.lv!;
    const W = 720;
    const n = 1 << lv.inputs.length;
    const dim = this.add.rectangle(W / 2, 640, 720, 1280, 0x000000, 0.78).setDepth(20);
    dim.setInteractive();
    const panelH = 220 + n * 40;
    const panel = this.add.rectangle(W / 2, 620, 600, panelH, 0x0b1628).setDepth(21);
    panel.setStrokeStyle(3, 0xef4444, 1);
    const d = this.add.container(0, 0).setDepth(22);
    const top = 620 - panelH / 2;
    const t1 = this.add.text(W / 2, top + 44, 'HASIL CEK', { fontSize: '30px', color: '#f87171', fontStyle: 'bold' }).setOrigin(0.5);
    d.add(t1);
    for (let r = 0; r < n; r++) {
      const got = evalCircuit(lv, this.types(), r);
      const want = lv.expect[r];
      const ok = got === want;
      const line = this.add.text(W / 2, top + 96 + r * 40,
        `${rowLabel(lv, r)}  →  kamu ${got} / kunci ${want}  ${ok ? '✓' : '✗'}`,
        { fontSize: '21px', color: ok ? '#4ade80' : r === badRow ? '#f87171' : '#94a3b8', fontStyle: r === badRow ? 'bold' : 'normal' })
        .setOrigin(0.5);
      d.add(line);
    }
    const by = top + 96 + n * 40 + 20;
    const bg = this.add.rectangle(W / 2, by, 420, 68, 0x22d3ee).setOrigin(0.5);
    bg.setStrokeStyle(2, 0xa5f3fc, 1);
    const tx = this.add.text(W / 2, by, 'TUTUP & PERBAIKI', { fontSize: '24px', color: '#04121a', fontStyle: 'bold' }).setOrigin(0.5);
    const z = this.add.zone(W / 2, by, 440, 88).setInteractive({ useHandCursor: true }).setDepth(23);
    d.add([bg, tx]);
    const close = (): void => {
      dim.destroy();
      panel.destroy();
      d.destroy(true);
      z.destroy();
    };
    z.on('pointerdown', () => {
      sfxClick();
      close();
    });
    this.msg.setText(`✗ Baris "${rowLabel(lv, badRow)}" masih salah (cek ${this.attempts}×). Perbaiki gerbangmu!`).setColor(pal().warn);
  }

  private onWin(): void {
    sfxWin();
    sfxStar();
    speak('Semua baris tabel kebenaran cocok!');
    this.winOpen = true;
    this.cameras.main.flash(250, 190, 255, 210);
    const lv = this.lv!;
    const earned = this.attempts <= 1 ? 3 : this.attempts <= 3 ? 2 : 1;
    setStar(KEY, lv.id, earned);
    submitScore('digi', lv.id, earned);
    burst(this, 360, 500, { colors: [0x4ade80, 0x22d3ee, 0xfacc15, 0xffffff], count: 40, distMin: 80, distMax: 300 });

    const W = 720;
    const dim = this.add.rectangle(W / 2, 640, 720, 1280, 0x000000, 0.72).setDepth(20);
    const panel = this.add.rectangle(W / 2, 620, 600, 540, 0x0b1628).setDepth(21);
    panel.setStrokeStyle(3, 0x4ade80, 1);
    mascotBadge(this, 598, 348, 0.8, 'happy').setDepth(24);
    const d = this.add.container(0, 0).setDepth(22);
    const t1 = this.add.text(W / 2, 410, '★ TABEL COCOK!', { fontSize: '34px', color: '#4ade80', fontStyle: 'bold' }).setOrigin(0.5);
    const t2 = this.add.text(W / 2, 458, '★'.repeat(earned) + '☆'.repeat(3 - earned), { fontSize: '44px', color: '#facc15' }).setOrigin(0.5);
    const t3 = this.add.text(W / 2, 520,
      `Semua ${1 << lv.inputs.length} baris benar ✓\n${this.attempts}× tekan CEK`,
      { fontSize: '22px', color: '#e2e8f0', align: 'center', lineSpacing: 6 }).setOrigin(0.5);
    const t4 = this.add.text(W / 2, 600, `ⓘ ${lv.hint}`, {
      fontSize: '20px', color: '#a5f3fc', align: 'center', wordWrap: { width: 520 },
    }).setOrigin(0.5);
    d.add([t1, t2, t3, t4]);

    const mkBtn = (y: number, label: string, bgc: number, cb: () => void): void => {
      const bg = this.add.rectangle(W / 2, y, 440, 72, bgc).setOrigin(0.5);
      bg.setStrokeStyle(2, 0xa5f3fc, 1);
      const tx = this.add.text(W / 2, y, label, { fontSize: '26px', color: bgc === 0x4ade80 ? '#052e16' : '#e2e8f0', fontStyle: 'bold' }).setOrigin(0.5);
      const z = this.add.zone(W / 2, y, 440, 72).setInteractive({ useHandCursor: true }).setDepth(23);
      d.add([bg, tx]);
      z.on('pointerdown', cb);
    };
    const isLast = lv.id >= DIGI_LEVELS.length;
    mkBtn(676, isLast ? '★ SELESAI — KE MAPEL' : '▶ LEVEL BERIKUTNYA', 0x4ade80, () => {
      sfxClick();
      if (isLast) this.scene.start('Course');
      else this.scene.restart({ levelId: lv.id + 1 });
    });
    mkBtn(764, '↺ ULANGI LEVEL', 0x0f2a3d, () => {
      sfxClick();
      this.scene.restart({ levelId: lv.id });
    });
    mkBtn(852, '≡ DAFTAR LEVEL', 0x0f2a3d, () => {
      sfxClick();
      this.scene.restart({ levelId: 0 });
    });
    void dim;
  }
}
