import Phaser from 'phaser';
import { PROG_LEVELS, ProgLevel, Cmd } from '../progLevels';
import { getStars, setStar, getSettings, sfxClick, sfxWin, sfxFail, sfxStar, submitScore, speak, beep, bindKeys } from '../util';
import { mascotBadge } from '../mascot';
import { ensureFxTextures, neonBackdrop, burst, pressable, hazardStrip } from '../fx';
import { pal } from '../theme';

// Robot Kode — Dasar Komputer & Pemrograman (susun sekuens perintah).
// levelId 0 = pilih level.

const KEY = 'prog';
const CMD_ICON: Record<Cmd, string> = { F: '▲', L: '◀', R: '▶' };
const DX = [1, 0, -1, 0];
const DY = [0, 1, 0, -1];

export class ProgScene extends Phaser.Scene {
  private levelId = 0;
  private lv: ProgLevel | null = null;
  private prog: Cmd[] = [];
  private running = false;
  private winOpen = false;
  private boardGfx!: Phaser.GameObjects.Graphics;
  private robotGfx!: Phaser.GameObjects.Graphics;
  private progTxs: Phaser.GameObjects.Text[] = [];
  private progLabel!: Phaser.GameObjects.Text;
  private msg!: Phaser.GameObjects.Text;
  private rx = 0;
  private ry = 0;
  private rdir = 0;
  private gotStars = 0;
  private needStars = 0;
  private fx = 0;
  private fy = 0;
  private cell = 80;
  private bx = 0;
  private by = 0;

  constructor() {
    super('Kode');
  }

  init(data: { levelId?: number }): void {
    this.levelId = data.levelId ?? 0;
    const found = PROG_LEVELS.find((l) => l.id === this.levelId);
    this.lv = found ?? null;
    this.prog = [];
    this.running = false;
    this.winOpen = false;
    this.progTxs = [];
    this.rx = 0;
    this.ry = 0;
    this.rdir = 0;
    this.gotStars = 0;
    this.takenSet = new Set<string>();
    this.decoTexts = [];
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
      .text(W / 2, 100, 'DASAR KOMPUTER', {
        fontSize: '42px', color: P.title, fontStyle: 'bold',
        fontFamily: "'Chakra Petch', sans-serif",
        stroke: '#92400e', strokeThickness: 2,
        shadow: { offsetX: 0, offsetY: 0, color: '#f59e0b', blur: 22, fill: true },
      })
      .setOrigin(0.5);
    this.add
      .text(W / 2, 152, 'Robot Kode • sekuens & logika program', { fontSize: '22px', color: P.dim })
      .setOrigin(0.5);

    const how = this.add.rectangle(W / 2, 250, 624, 120, 0x0b1628, 0.9).setOrigin(0.5);
    how.setStrokeStyle(2, 0x1e3a5f, 1);
    this.add
      .text(W / 2, 250,
        'Susun perintah ▲◀▶, tekan RUN ▶\nantar robot ke ★ & ambil semua ★!',
        { fontSize: '22px', color: '#e2e8f0', align: 'center', lineSpacing: 7 })
      .setOrigin(0.5);

    const stars = getStars(KEY);
    let next = 1;
    for (let i = 1; i <= PROG_LEVELS.length; i++) {
      if (stars[i]) next = Math.min(PROG_LEVELS.length, i + 1);
    }
    const cols = 4;
    const cw = 140;
    const ch = 120;
    const stepX = (624 - cw) / (cols - 1);
    PROG_LEVELS.forEach((lv, i) => {
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
      .text(W / 2, 700, 'Sekuens • belok • lubang • bintang • labirin', {
        fontSize: '20px', color: P.dim, align: 'center', wordWrap: { width: 620 },
      })
      .setOrigin(0.5);

    const numNames = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT'];
    const keys: Record<string, () => void> = {
      ESC: () => this.scene.start('Course'),
      ENTER: () => this.scene.restart({ levelId: next }),
    };
    PROG_LEVELS.forEach((lv, i) => {
      keys[numNames[i]] = () => this.scene.restart({ levelId: lv.id });
    });
    bindKeys(this, keys);
  }

  // ---------- main ----------

  private cellXY(x: number, y: number): { x: number; y: number } {
    return { x: this.bx + x * this.cell + this.cell / 2, y: this.by + y * this.cell + this.cell / 2 };
  }

  private buildPlay(): void {
    const W = 720;
    const P = pal();
    const lv = this.lv!;
    const rows = lv.grid.length;
    const cols = lv.grid[0].length;
    this.cell = Math.floor(Math.min(600 / cols, 400 / rows, 110));
    this.bx = (W - cols * this.cell) / 2;
    this.by = 270;

    let sx = 0;
    let sy = 0;
    this.needStars = 0;
    lv.grid.forEach((row, y) => {
      [...row].forEach((ch, x) => {
        if (ch === 'R') { sx = x; sy = y; }
        if (ch === 'F') { this.fx = x; this.fy = y; }
        if (ch === '*') this.needStars += 1;
      });
    });
    this.rx = sx;
    this.ry = sy;
    this.rdir = 0;
    this.gotStars = 0;

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

    const card = this.add.rectangle(W / 2, 150, 672, 120, 0x0b1628, 0.92).setOrigin(0.5);
    card.setStrokeStyle(2, 0x1e3a5f, 1);
    this.add.text(60, 105, lv.briefing, {
      fontSize: '20px', color: '#e2e8f0', lineSpacing: 5, wordWrap: { width: 600 },
    });
    this.add.text(60, 168, `ⓘ ${lv.hint}`, {
      fontSize: '18px', color: '#fde68a', wordWrap: { width: 600 },
    });

    const area = this.add.rectangle(W / 2, this.by + (rows * this.cell) / 2, 672, rows * this.cell + 40, 0x070d1d, 0.88).setOrigin(0.5);
    area.setStrokeStyle(2, 0x22d3ee, 0.8);
    this.boardGfx = this.add.graphics();
    this.robotGfx = this.add.graphics().setDepth(5);
    this.drawBoard();

    // strip program
    const stripY = this.by + rows * this.cell + 62;
    this.progLabel = this.add
      .text(60, stripY, 'PROGRAM (0/20):', { fontSize: '20px', color: P.dim, fontStyle: 'bold' })
      .setOrigin(0, 0.5);
    this.renderProg(stripY + 44);

    // tombol perintah
    const btnY = stripY + 120;
    this.cmdBtn(60, btnY, 150, 68, '▲', 'MAJU', () => this.addCmd('F'));
    this.cmdBtn(222, btnY, 150, 68, '◀', 'KIRI', () => this.addCmd('L'));
    this.cmdBtn(384, btnY, 150, 68, '▶', 'KANAN', () => this.addCmd('R'));
    this.cmdBtn(546, btnY, 114, 68, '×', '', () => this.delCmd());

    // RUN + hapus
    const runY = btnY + 84;
    const runBg = this.add.rectangle(0, 0, 400, 68, 0x4ade80).setOrigin(0.5);
    runBg.setStrokeStyle(3, 0xbbf7d0, 1);
    const runTx = this.add.text(0, 0, '▶ RUN', { fontSize: '30px', color: '#052e16', fontStyle: 'bold', fontFamily: "'Chakra Petch', sans-serif" }).setOrigin(0.5);
    const runBtn = this.add.container(60 + 200, runY, [runBg, runTx]);
    hazardStrip(this, 260, runY - 50, 400);
    const runZone = this.add.zone(60 + 200, runY, 400, 88).setInteractive({ useHandCursor: true });
    pressable(this, runZone, runBtn);
    runZone.on('pointerdown', () => this.onRun());
    runZone.on('pointerover', () => runBg.setFillStyle(0x86efac));
    runZone.on('pointerout', () => runBg.setFillStyle(0x4ade80));
    this.cmdBtn(472, runY, 188, 68, '×', '', () => {
      if (this.running || this.winOpen) return;
      sfxClick();
      this.prog = [];
      this.renderProg(stripY + 44);
      this.msg.setText('Program dihapus. Susun lagi!').setColor(pal().accentTx);
    });

    this.msg = this.add
      .text(W / 2, runY + 44, 'Susun perintah, lalu RUN ▶', { fontSize: '21px', color: P.accentTx, align: 'center', wordWrap: { width: 640 } })
      .setOrigin(0.5, 0);

    bindKeys(this, {
      UP: () => this.addCmd('F'),
      W: () => this.addCmd('F'),
      LEFT: () => this.addCmd('L'),
      A: () => this.addCmd('L'),
      RIGHT: () => this.addCmd('R'),
      D: () => this.addCmd('R'),
      BACKSPACE: () => this.delCmd(),
      ENTER: () => this.onRun(),
      ESC: () => {
        sfxClick();
        this.scene.restart({ levelId: 0 });
      },
    });
  }

  private cmdBtn(x: number, y: number, w: number, h: number, icon: string, sub: string, cb: () => void): void {
    const bg = this.add.rectangle(0, 0, w, h, 0x0f2a3d).setOrigin(0.5);
    bg.setStrokeStyle(2, 0x334155, 1);
    const tx = this.add.text(0, sub === '' ? 0 : -8, icon, { fontSize: '30px', color: '#f8fafc', fontStyle: 'bold' }).setOrigin(0.5);
    const parts: Phaser.GameObjects.GameObject[] = [bg, tx];
    if (sub !== '') {
      const st = this.add.text(0, 18, sub, { fontSize: '18px', color: '#94a3b8', fontStyle: 'bold' }).setOrigin(0.5);
      parts.push(st);
    }
    const vis = this.add.container(x + w / 2, y, parts);
    const z = this.add.zone(x + w / 2, y, w, 88).setInteractive({ useHandCursor: true });
    pressable(this, z, vis);
    z.on('pointerdown', cb);
    z.on('pointerover', () => bg.setFillStyle(0x164e63));
    z.on('pointerout', () => bg.setFillStyle(0x0f2a3d));
  }

  private tileAt(x: number, y: number): string {
    const lv = this.lv!;
    if (y < 0 || y >= lv.grid.length || x < 0 || x >= lv.grid[0].length) return '#';
    return lv.grid[y][x];
  }

  private drawBoard(): void {
    const lv = this.lv!;
    const g = this.boardGfx;
    g.clear();
    for (const t of this.decoTexts) t.destroy();
    this.decoTexts = [];
    const rows = lv.grid.length;
    const cols = lv.grid[0].length;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const p = this.cellXY(x, y);
        const ch = lv.grid[y][x];
        const s = this.cell - 6;
        if (ch === '#') {
          g.fillStyle(0x334155, 1);
          g.fillRoundedRect(p.x - s / 2, p.y - s / 2, s, s, 10);
          g.fillStyle(0x475569, 1);
          g.fillRoundedRect(p.x - s / 2 + 8, p.y - s / 2 + 8, s - 16, 14, 6);
        } else if (ch === 'O') {
          g.fillStyle(0x0b1628, 1);
          g.fillRoundedRect(p.x - s / 2, p.y - s / 2, s, s, 10);
          g.fillStyle(0x000000, 1);
          g.fillCircle(p.x, p.y, s * 0.3);
          g.lineStyle(3, 0x7f1d1d, 1);
          g.strokeCircle(p.x, p.y, s * 0.3);
        } else {
          g.fillStyle(0x0f2a3d, 0.9);
          g.fillRoundedRect(p.x - s / 2, p.y - s / 2, s, s, 10);
          g.lineStyle(1, 0x1e3a5f, 1);
          g.strokeRoundedRect(p.x - s / 2, p.y - s / 2, s, s, 10);
        }
        if (ch === '*') {
          const taken = this.starTaken(x, y);
          const t = this.add.text(p.x, p.y - 2, '★', { fontSize: `${Math.floor(s * 0.55)}px` }).setOrigin(0.5).setDepth(4);
          t.setAlpha(taken ? 0.2 : 1);
          this.decoTexts.push(t);
        }
        if (ch === 'F') {
          const f = this.add.text(p.x, p.y - 2, '⚑', { fontSize: `${Math.floor(s * 0.55)}px` }).setOrigin(0.5).setDepth(4);
          this.decoTexts.push(f);
        }
      }
    }
    this.drawRobot();
  }

  private takenSet = new Set<string>();
  private decoTexts: Phaser.GameObjects.Text[] = [];

  private starTaken(x: number, y: number): boolean {
    return this.takenSet.has(`${x},${y}`);
  }

  private drawRobot(): void {
    const g = this.robotGfx;
    g.clear();
    const p = this.cellXY(this.rx, this.ry);
    const r = this.cell * 0.32;
    const ang = (this.rdir * Math.PI) / 2;
    const tipX = p.x + Math.cos(ang) * r;
    const tipY = p.y + Math.sin(ang) * r;
    const lX = p.x + Math.cos(ang + 2.5) * r;
    const lY = p.y + Math.sin(ang + 2.5) * r;
    const rX = p.x + Math.cos(ang - 2.5) * r;
    const rY = p.y + Math.sin(ang - 2.5) * r;
    g.fillStyle(0x22d3ee, 0.3);
    g.fillCircle(p.x, p.y, r + 8);
    g.fillStyle(0x22d3ee, 1);
    g.fillTriangle(tipX, tipY, lX, lY, rX, rY);
    g.lineStyle(3, 0xa5f3fc, 1);
    g.strokeTriangle(tipX, tipY, lX, lY, rX, rY);
    g.fillStyle(0x04121a, 1);
    g.fillCircle(p.x, p.y, r * 0.28);
  }

  private renderProg(y: number): void {
    for (const t of this.progTxs) t.destroy();
    this.progTxs = [];
    this.progLabel.setText(`PROGRAM (${this.prog.length}/${this.lv!.limit}):`);
    if (this.prog.length === 0) {
      const t = this.add.text(60, y, '— kosong, ketuk tombol perintah —', { fontSize: '19px', color: pal().dim }).setOrigin(0, 0.5);
      this.progTxs.push(t);
      return;
    }
    let x = 60;
    this.prog.forEach((c, i) => {
      const t = this.add.text(x, y, CMD_ICON[c], { fontSize: '30px', color: '#e2e8f0', fontStyle: 'bold', backgroundColor: '#0f2a3d', padding: { x: 6, y: 4 } }).setOrigin(0, 0.5);
      t.setData('pi', i);
      this.progTxs.push(t);
      x += 52;
    });
  }

  private progStripY(): number {
    const rows = this.lv!.grid.length;
    return this.by + rows * this.cell + 62 + 44;
  }

  private addCmd(c: Cmd): void {
    if (this.running || this.winOpen || this.lv === null) return;
    if (this.prog.length >= this.lv.limit) {
      this.msg.setText(`⚠ Maksimal ${this.lv.limit} perintah! Hapus dulu pakai tombol ×.`).setColor(pal().warn);
      return;
    }
    this.prog.push(c);
    beep(c === 'F' ? 520 : c === 'L' ? 440 : 600, 0.06, 'square', 0.06);
    this.renderProg(this.progStripY());
  }

  private delCmd(): void {
    if (this.running || this.winOpen) return;
    sfxClick();
    this.prog.pop();
    if (this.lv !== null) this.renderProg(this.progStripY());
  }

  private hiProg(i: number): void {
    this.progTxs.forEach((t, k) => {
      t.setColor(k === i ? '#facc15' : k < i ? '#4ade80' : '#e2e8f0');
    });
  }

  private onRun(): void {
    if (this.running || this.winOpen || this.lv === null) return;
    if (this.prog.length === 0) {
      this.msg.setText('Program masih kosong! Tambah perintah dulu.').setColor(pal().warn);
      return;
    }
    sfxClick();
    this.running = true;
    // reset posisi
    const lv = this.lv;
    lv.grid.forEach((row, y) => {
      [...row].forEach((ch, x) => {
        if (ch === 'R') { this.rx = x; this.ry = y; }
      });
    });
    this.rdir = 0;
    this.gotStars = 0;
    this.takenSet = new Set<string>();
    this.drawBoard();
    this.msg.setText('Robot jalan...').setColor(pal().accentTx);
    this.execStep(0);
  }

  private execStep(i: number): void {
    const lv = this.lv!;
    if (i >= this.prog.length) {
      // program habis
      if (this.rx === this.fx && this.ry === this.fy && this.gotStars === this.needStars) {
        this.onWin();
      } else {
        const miss = this.needStars - this.gotStars;
        this.onFail(miss > 0 ? `Belum finish! ${miss} ★ belum diambil.` : 'Belum sampai bendera ⚑!');
      }
      return;
    }
    this.hiProg(i);
    const c = this.prog[i];
    beep(c === 'F' ? 500 : 380, 0.05, 'square', 0.05);
    if (c === 'L') {
      this.rdir = (this.rdir + 3) % 4;
      this.drawRobot();
      this.time.delayedCall(300, () => this.execStep(i + 1));
      return;
    }
    if (c === 'R') {
      this.rdir = (this.rdir + 1) % 4;
      this.drawRobot();
      this.time.delayedCall(300, () => this.execStep(i + 1));
      return;
    }
    const nx = this.rx + DX[this.rdir];
    const ny = this.ry + DY[this.rdir];
    const t = this.tileAt(nx, ny);
    if (t === '#') {
      this.drawRobot();
      this.time.delayedCall(350, () => this.onFail('Duar! Nabrak tembok 🧱.'));
      return;
    }
    if (nx < 0 || ny < 0 || ny >= lv.grid.length || nx >= lv.grid[0].length) {
      this.time.delayedCall(350, () => this.onFail('Robot keluar arena!'));
      return;
    }
    // gerak (tween halus)
    const from = this.cellXY(this.rx, this.ry);
    this.rx = nx;
    this.ry = ny;
    const to = this.cellXY(nx, ny);
    const proxy = { t: 0 };
    this.tweens.add({
      targets: proxy,
      t: 1,
      duration: 260,
      onUpdate: () => {
        this.robotGfx.clear();
        const ix = from.x + (to.x - from.x) * proxy.t;
        const iy = from.y + (to.y - from.y) * proxy.t;
        this.drawRobotAt(ix, iy);
      },
      onComplete: () => {
        const cell = this.tileAt(nx, ny);
        if (cell === 'O') {
          this.drawRobot();
          this.time.delayedCall(350, () => this.onFail('Blub! Jatuh ke lubang 🕳.'));
          return;
        }
        if (cell === '*') {
          const key = `${nx},${ny}`;
          if (!this.takenSet.has(key)) {
            this.takenSet.add(key);
            this.gotStars += 1;
            beep(880, 0.12, 'sine', 0.1);
            burst(this, to.x, to.y, { colors: [0xfacc15, 0xffffff], count: 12, distMin: 30, distMax: 110 });
          }
        }
        this.drawBoard();
        if (nx === this.fx && ny === this.fy && this.gotStars === this.needStars) {
          this.time.delayedCall(350, () => this.onWin());
          return;
        }
        this.time.delayedCall(120, () => this.execStep(i + 1));
      },
    });
  }

  private drawRobotAt(px: number, py: number): void {
    const g = this.robotGfx;
    const r = this.cell * 0.32;
    const ang = (this.rdir * Math.PI) / 2;
    g.fillStyle(0x22d3ee, 1);
    g.fillTriangle(
      px + Math.cos(ang) * r, py + Math.sin(ang) * r,
      px + Math.cos(ang + 2.5) * r, py + Math.sin(ang + 2.5) * r,
      px + Math.cos(ang - 2.5) * r, py + Math.sin(ang - 2.5) * r
    );
  }

  private onWin(): void {
    this.running = false;
    sfxWin();
    sfxStar();
    speak('Misi selesai dalam ' + this.prog.length + ' perintah!');
    this.winOpen = true;
    this.cameras.main.flash(250, 190, 255, 210);
    const lv = this.lv!;
    const steps = this.prog.length;
    const earned = steps <= lv.par ? 3 : steps <= lv.par + 3 ? 2 : 1;
    setStar(KEY, lv.id, earned);
    submitScore('prog', lv.id, earned);
    const p = this.cellXY(this.fx, this.fy);
    burst(this, p.x, p.y, { colors: [0x4ade80, 0x22d3ee, 0xfacc15, 0xffffff], count: 40, distMin: 80, distMax: 280 });

    const W = 720;
    const dim = this.add.rectangle(W / 2, 640, 720, 1280, 0x000000, 0.72).setDepth(20);
    const panel = this.add.rectangle(W / 2, 620, 600, 540, 0x0b1628).setDepth(21);
    panel.setStrokeStyle(3, 0x4ade80, 1);
    mascotBadge(this, 598, 348, 0.8, 'happy').setDepth(24);
    const d = this.add.container(0, 0).setDepth(22);
    const t1 = this.add.text(W / 2, 410, '★ MISI SELESAI!', { fontSize: '34px', color: '#4ade80', fontStyle: 'bold' }).setOrigin(0.5);
    const t2 = this.add.text(W / 2, 458, '★'.repeat(earned) + '☆'.repeat(3 - earned), { fontSize: '44px', color: '#facc15' }).setOrigin(0.5);
    const t3 = this.add.text(W / 2, 522,
      `${steps} perintah (par ${lv.par}) • ${this.gotStars}★\nRobot sampai + semua bintang ✓`,
      { fontSize: '22px', color: '#e2e8f0', align: 'center', lineSpacing: 6 }).setOrigin(0.5);
    const t4 = this.add.text(W / 2, 600, 'Program = sekuens perintah berurutan 💻', {
      fontSize: '20px', color: '#a5f3fc', align: 'center',
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
    const isLast = lv.id >= PROG_LEVELS.length;
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

  private onFail(reason: string): void {
    this.running = false;
    sfxFail();
    if (getSettings().shake) this.cameras.main.shake(200, 0.01);
    this.msg.setText(reason + ' Program tetap tersimpan — perbaiki!').setColor(pal().warn);
    this.hiProg(-1);
  }
}
