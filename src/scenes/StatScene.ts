import Phaser from 'phaser';
import { STAT_LEVELS, StatLevel } from '../statLevels';
import { getStars, setStar, getSettings, sfxClick, sfxWin, sfxFail, sfxStar, submitScore, speak, beep, bindKeys, recordMistake, recordOk, weakKey } from '../util';
import { mascotBadge } from '../mascot';
import { ensureFxTextures, neonBackdrop, burst } from '../fx';
import { pal } from '../theme';

// Lab Peluang — Statistika & Probabilitas. Tiap level 3 soal,
// 3 nyawa, 15 detik per soal. levelId 0 = pilih level.

const KEY = 'stat';
const TIME_MS = 15000;
const OPT_Y = [600, 722, 844];

export class StatScene extends Phaser.Scene {
  private levelId = 0;
  private lv: StatLevel | null = null;
  private qi = 0;
  private hearts = 3;
  private mistakes = 0;
  private streak = 0;
  private locked = true;
  private timerOn = false;
  private deadline = 0;
  private winOpen = false;
  private heartsTx!: Phaser.GameObjects.Text;
  private qCountTx!: Phaser.GameObjects.Text;
  private streakTx!: Phaser.GameObjects.Text;
  private barFill!: Phaser.GameObjects.Rectangle;
  private qTx!: Phaser.GameObjects.Text;
  private explTx!: Phaser.GameObjects.Text;
  private optBgs: Phaser.GameObjects.Rectangle[] = [];
  private optTxs: Phaser.GameObjects.Text[] = [];
  private optZones: Phaser.GameObjects.Zone[] = [];

  constructor() {
    super('Stat');
  }

  init(data: { levelId?: number }): void {
    this.levelId = data.levelId ?? 0;
    const found = STAT_LEVELS.find((l) => l.id === this.levelId);
    this.lv = found ?? null;
    this.qi = 0;
    this.hearts = 3;
    this.mistakes = 0;
    this.streak = 0;
    this.locked = true;
    this.timerOn = false;
    this.winOpen = false;
    this.optBgs = [];
    this.optTxs = [];
    this.optZones = [];
  }

  create(): void {
    ensureFxTextures(this);
    neonBackdrop(this);
    if (this.lv === null) this.buildSelect();
    else this.buildPlay();
  }

  update(): void {
    if (!this.timerOn || this.lv === null) return;
    const t = (this.deadline - this.time.now) / TIME_MS;
    if (t <= 0) {
      this.barFill.setScale(0.01, 1);
      this.onTimeout();
      return;
    }
    this.barFill.setScale(Math.max(0.01, t), 1);
    this.barFill.setFillStyle(t > 0.5 ? 0x22d3ee : t > 0.25 ? 0xfacc15 : 0xef4444);
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
      .text(W / 2, 100, 'STATISTIKA & PROBABILITAS', {
        fontSize: '34px', color: P.title, fontStyle: 'bold',
        fontFamily: "'Chakra Petch', sans-serif",
        stroke: '#92400e', strokeThickness: 2,
        shadow: { offsetX: 0, offsetY: 0, color: '#f59e0b', blur: 22, fill: true },
      })
      .setOrigin(0.5);
    this.add
      .text(W / 2, 152, 'Lab Peluang • 3 soal • 3 nyawa • 15 detik/soal', { fontSize: '22px', color: P.dim })
      .setOrigin(0.5);

    const how = this.add.rectangle(W / 2, 250, 624, 120, 0x0b1628, 0.9).setOrigin(0.5);
    how.setStrokeStyle(2, 0x1e3a5f, 1);
    this.add
      .text(W / 2, 250,
        'Jawab secepat & setepat mungkin.\nSalah atau kehabisan waktu = −1 nyawa ♥',
        { fontSize: '22px', color: '#e2e8f0', align: 'center', lineSpacing: 7 })
      .setOrigin(0.5);

    const stars = getStars(KEY);
    let next = 1;
    for (let i = 1; i <= STAT_LEVELS.length; i++) {
      if (stars[i]) next = Math.min(STAT_LEVELS.length, i + 1);
    }
    const cols = 4;
    const cw = 140;
    const ch = 120;
    const stepX = (624 - cw) / (cols - 1);
    STAT_LEVELS.forEach((lv, i) => {
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
      .text(W / 2, 700, 'Koin • dadu • kartu • rata-rata • median • harapan', {
        fontSize: '20px', color: P.dim, align: 'center', wordWrap: { width: 620 },
      })
      .setOrigin(0.5);

    const numNames = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT'];
    const keys: Record<string, () => void> = {
      ESC: () => this.scene.start('Course'),
      ENTER: () => this.scene.restart({ levelId: next }),
    };
    STAT_LEVELS.forEach((lv, i) => {
      keys[numNames[i]] = () => this.scene.restart({ levelId: lv.id });
    });
    bindKeys(this, keys);
  }

  // ---------- main ----------

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

    this.heartsTx = this.add
      .text(60, 100, '♥♥♥', { fontSize: '32px', color: P.bad })
      .setOrigin(0, 0);
    this.streakTx = this.add
      .text(W / 2, 100, '', { fontSize: '26px', color: P.warn, fontStyle: 'bold' })
      .setOrigin(0.5, 0);
    this.qCountTx = this.add
      .text(660, 100, '', { fontSize: '24px', color: P.accentTx, fontStyle: 'bold' })
      .setOrigin(1, 0);

    const barBg = this.add.rectangle(W / 2, 168, 624, 16, 0x0b1628).setOrigin(0.5);
    barBg.setStrokeStyle(2, 0x334155, 1);
    this.barFill = this.add.rectangle(48, 168, 624, 12, 0x22d3ee).setOrigin(0, 0.5);

    const qCard = this.add.rectangle(W / 2, 330, 624, 260, 0x0b1628, 0.92).setOrigin(0.5);
    qCard.setStrokeStyle(2, 0x22d3ee, 0.8);
    this.qTx = this.add
      .text(W / 2, 330, '', {
        fontSize: '27px', color: '#f8fafc', fontStyle: 'bold', align: 'center',
        lineSpacing: 8, wordWrap: { width: 540 },
      })
      .setOrigin(0.5);

    for (let i = 0; i < 3; i++) {
      const y = OPT_Y[i];
      const bg = this.add.rectangle(W / 2, y, 624, 100, 0x103049, 0.94).setOrigin(0.5);
      bg.setStrokeStyle(2, 0x334155, 1);
      const tx = this.add
        .text(W / 2, y, '', { fontSize: '30px', color: '#f8fafc', fontStyle: 'bold', align: 'center' })
        .setOrigin(0.5);
      const z = this.add.zone(W / 2, y, 624, 100).setInteractive({ useHandCursor: true });
      z.on('pointerdown', () => this.choose(i));
      z.on('pointerover', () => {
        if (!this.locked) bg.setFillStyle(0x164e63, 0.96);
      });
      z.on('pointerout', () => {
        if (!this.locked) bg.setFillStyle(0x103049, 0.94);
      });
      this.optBgs.push(bg);
      this.optTxs.push(tx);
      this.optZones.push(z);
    }

    this.explTx = this.add
      .text(W / 2, 940, '', {
        fontSize: '22px', color: '#e2e8f0', align: 'center', lineSpacing: 6,
        wordWrap: { width: 620 }, backgroundColor: '#0b1628', padding: { x: 12, y: 10 },
      })
      .setOrigin(0.5, 0)
      .setVisible(false);

    bindKeys(this, {
      ONE: () => this.choose(0),
      TWO: () => this.choose(1),
      THREE: () => this.choose(2),
      ESC: () => {
        sfxClick();
        this.scene.restart({ levelId: 0 });
      },
    });

    this.ask(0);
  }

  private paintHearts(): void {
    this.heartsTx.setText('♥'.repeat(this.hearts) + '♡'.repeat(Math.max(0, 3 - this.hearts)));
  }

  private paintStreak(): void {
    this.streakTx.setText(this.streak >= 2 ? `★ x${this.streak}` : '');
  }

  private ask(i: number): void {
    const lv = this.lv!;
    this.qi = i;
    const q = lv.questions[i];
    this.qCountTx.setText(`Soal ${i + 1}/3`);
    this.qTx.setText(q.q);
    this.explTx.setVisible(false);
    for (let k = 0; k < 3; k++) {
      this.optTxs[k].setText(`${k + 1}.  ${q.opts[k]}`);
      this.optBgs[k].setFillStyle(0x103049, 0.94);
      this.optBgs[k].setStrokeStyle(2, 0x334155, 1);
    }
    this.paintHearts();
    this.paintStreak();
    this.locked = false;
    this.deadline = this.time.now + TIME_MS;
    this.timerOn = true;
  }

  private revealCorrect(): void {
    const ans = this.lv!.questions[this.qi].ans;
    for (let k = 0; k < 3; k++) {
      if (k === ans) {
        this.optBgs[k].setFillStyle(0x14532d, 1);
        this.optBgs[k].setStrokeStyle(3, 0x4ade80, 1);
      } else {
        this.optBgs[k].setFillStyle(0x0b1628, 0.9);
      }
    }
  }

  private choose(i: number): void {
    if (this.locked || this.winOpen || this.lv === null) return;
    const q = this.lv.questions[this.qi];
    this.locked = true;
    this.timerOn = false;
    if (i === q.ans) {
      recordOk(weakKey('stat', this.lv.id, this.qi));
      this.streak += 1;
      this.paintStreak();
      beep(740, 0.12, 'sine', 0.12);
      setTimeout(() => beep(988, 0.16, 'sine', 0.12), 100);
      this.revealCorrect();
      burst(this, 360, OPT_Y[i], { colors: [0x4ade80, 0x22d3ee, 0xffffff], count: 22, distMin: 60, distMax: 220 });
      const bonus = this.streak >= 2 ? `★ Streak x${this.streak}! ` : '✓ Benar! ';
      this.explTx.setText(`${bonus}${q.expl}`).setColor('#bbf7d0').setVisible(true);
      this.time.delayedCall(1100, () => this.afterCorrect());
    } else {
      this.onWrong('× Kurang tepat! ', i);
    }
  }

  private onTimeout(): void {
    if (this.locked || this.winOpen || this.lv === null) return;
    this.locked = true;
    this.timerOn = false;
      this.onWrong('• Waktu habis! ', -1);
  }

  private onWrong(prefix: string, picked: number): void {
    const q = this.lv!.questions[this.qi];
    recordMistake(weakKey('stat', this.lv!.id, this.qi));
    this.mistakes += 1;
    this.streak = 0;
    this.paintStreak();
    this.hearts -= 1;
    this.paintHearts();
    sfxFail();
    if (getSettings().shake) this.cameras.main.shake(180, 0.009);
    this.revealCorrect();
    const trap = picked >= 0 ? q.sesat[picked] : '';
    const trapTx = trap !== '' ? `Jebakan: ${trap} ` : '';
    this.explTx.setText(`${prefix}${trapTx}✓ ${q.opts[q.ans]}. ${q.expl}`).setColor('#fecaca').setVisible(true);
    if (this.hearts <= 0) {
      this.time.delayedCall(1500, () => this.onFail());
    } else {
      this.time.delayedCall(1900, () => {
        if (!this.winOpen) this.ask(this.qi);
      });
    }
  }

  private afterCorrect(): void {
    if (this.winOpen || this.lv === null) return;
    if (this.qi >= 2) this.onWin();
    else this.ask(this.qi + 1);
  }

  private onWin(): void {
    sfxWin();
    sfxStar();
    speak('Level selesai! ' + (this.mistakes === 0 ? 'Sempurna tanpa salah!' : 'Ada ' + this.mistakes + ' kesalahan.'));
    this.winOpen = true;
    this.cameras.main.flash(250, 190, 255, 210);
    const lv = this.lv!;
    const earned = this.mistakes === 0 ? 3 : this.mistakes === 1 ? 2 : 1;
    setStar(KEY, lv.id, earned);
    submitScore('stat', lv.id, earned);
    burst(this, 200, 500, { colors: [0xfacc15, 0x22d3ee, 0xf472b6, 0xffffff], count: 34, distMin: 80, distMax: 300 });
    burst(this, 520, 500, { colors: [0x4ade80, 0x22d3ee, 0xfacc15, 0xffffff], count: 34, distMin: 80, distMax: 300 });
    this.endOverlay(
      '★ LEVEL SELESAI!',
      '★'.repeat(earned) + '☆'.repeat(3 - earned),
      `3 soal dijawab • ${this.mistakes}× salah`,
      lv.id >= STAT_LEVELS.length
    );
  }

  private onFail(): void {
    sfxFail();
    this.winOpen = true;
    this.endOverlay('× Nyawa Habis', '☆☆☆', 'Jangan nyerah — coba lagi!', false, true);
  }

  private endOverlay(title: string, stars: string, sub: string, isLast: boolean, failed = false): void {
    const W = 720;
    const lv = this.lv!;
    const dim = this.add.rectangle(W / 2, 640, 720, 1280, 0x000000, 0.72).setDepth(20);
    const panel = this.add.rectangle(W / 2, 620, 600, 520, 0x0b1628).setDepth(21);
    panel.setStrokeStyle(3, failed ? 0xef4444 : 0xfacc15, 1);
    if (!failed) mascotBadge(this, 598, 358, 0.8, 'happy').setDepth(24);
    const d = this.add.container(0, 0).setDepth(22);
    const t1 = this.add.text(W / 2, 420, title, {
      fontSize: '34px', color: failed ? '#f87171' : '#facc15', fontStyle: 'bold',
    }).setOrigin(0.5);
    const t2 = this.add.text(W / 2, 476, stars, { fontSize: '46px', color: '#facc15' }).setOrigin(0.5);
    const t3 = this.add.text(W / 2, 540, sub, {
      fontSize: '22px', color: '#e2e8f0', align: 'center', lineSpacing: 6,
    }).setOrigin(0.5);
    d.add([t1, t2, t3]);

    const mkBtn = (y: number, label: string, bgc: number, cb: () => void): void => {
      const bg = this.add.rectangle(W / 2, y, 440, 72, bgc).setOrigin(0.5);
      bg.setStrokeStyle(2, 0xa5f3fc, 1);
      const tx = this.add.text(W / 2, y, label, {
        fontSize: '26px', color: bgc === 0x0f2a3d ? '#e2e8f0' : '#04121a', fontStyle: 'bold',
      }).setOrigin(0.5);
      const z = this.add.zone(W / 2, y, 440, 72).setInteractive({ useHandCursor: true }).setDepth(23);
      d.add([bg, tx]);
      z.on('pointerdown', cb);
    };
    if (failed) {
      mkBtn(656, '↺ COBA LAGI', 0x22d3ee, () => {
        sfxClick();
        this.scene.restart({ levelId: lv.id });
      });
      mkBtn(744, '≡ DAFTAR LEVEL', 0x0f2a3d, () => {
        sfxClick();
        this.scene.restart({ levelId: 0 });
      });
    } else {
      mkBtn(656, isLast ? '★ SELESAI — KE MAPEL' : '▶ LEVEL BERIKUTNYA', 0x22d3ee, () => {
        sfxClick();
        if (isLast) this.scene.start('Course');
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
    }
    void dim;
  }
}
