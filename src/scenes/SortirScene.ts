import Phaser from 'phaser';
import { SORT_TOPICS } from '../sortDecks';
import type { SortTopic, SortLevel } from '../sortDecks';
import { getStars, setStar, getSettings, sfxClick, sfxWin, sfxFail, submitScore, sfxStar, speak, beep, bindKeys } from '../util';
import { mascotBadge } from '../mascot';
import { ensureFxTextures, neonBackdrop, burst } from '../fx';
import { pal } from '../theme';

// Sortir Kilat — pilah kartu ke wadah yang benar secepatnya.
// Dipakai topik Pengenalan & Jenis Matriks. data {deck}, levelId 0 = pilih.

export class SortirScene extends Phaser.Scene {
  private deckId = '';
  private deck: SortTopic | null = null;
  private levelId = 0;
  private lv: SortLevel | null = null;
  private ci = 0;
  private hearts = 3;
  private mistakes = 0;
  private streak = 0;
  private locked = true;
  private timerOn = false;
  private deadline = 0;
  private winOpen = false;
  private heartsTx!: Phaser.GameObjects.Text;
  private progTx!: Phaser.GameObjects.Text;
  private streakTx!: Phaser.GameObjects.Text;
  private barFill!: Phaser.GameObjects.Rectangle;
  private cardTx!: Phaser.GameObjects.Text;
  private cardBg!: Phaser.GameObjects.Rectangle;
  private feedTx!: Phaser.GameObjects.Text;
  private binBgs: Phaser.GameObjects.Rectangle[] = [];

  constructor() {
    super('Sortir');
  }

  init(data: { deck?: string; levelId?: number }): void {
    this.deckId = data.deck ?? '';
    this.deck = SORT_TOPICS[this.deckId] ?? null;
    this.levelId = data.levelId ?? 0;
    const found = this.deck?.levels.find((l) => l.id === this.levelId) ?? null;
    this.lv = found;
    this.ci = 0;
    this.hearts = 3;
    this.mistakes = 0;
    this.streak = 0;
    this.locked = true;
    this.timerOn = false;
    this.winOpen = false;
    this.binBgs = [];
  }

  create(): void {
    ensureFxTextures(this);
    neonBackdrop(this);
    if (this.deck === null) {
      this.scene.start('AljTopik');
      return;
    }
    if (this.lv === null) this.buildSelect();
    else this.buildPlay();
  }

  update(): void {
    if (!this.timerOn || this.lv === null) return;
    const t = (this.deadline - this.time.now) / this.lv.timeMs;
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
    const dk = this.deck!;
    const back = this.add
      .text(24, 20, '‹ TOPIK', { fontSize: '24px', color: P.accentTx, fontStyle: 'bold' })
      .setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => {
      sfxClick();
      this.scene.start('AljTopik');
    });
    this.add
      .text(W / 2, 100, dk.title, {
        fontSize: '40px', color: P.title, fontStyle: 'bold',
        fontFamily: "'Chakra Petch', sans-serif",
        stroke: '#92400e', strokeThickness: 2,
        shadow: { offsetX: 0, offsetY: 0, color: '#f59e0b', blur: 22, fill: true },
      })
      .setOrigin(0.5);
    this.add
      .text(W / 2, 152, dk.sub, { fontSize: '22px', color: P.dim })
      .setOrigin(0.5);

    const how = this.add.rectangle(W / 2, 250, 624, 120, 0x0b1628, 0.9).setOrigin(0.5);
    how.setStrokeStyle(2, 0x1e3a5f, 1);
    this.add
      .text(W / 2, 250, dk.howto, { fontSize: '22px', color: '#e2e8f0', align: 'center', lineSpacing: 7 })
      .setOrigin(0.5);

    const stars = getStars(dk.id);
    let next = 1;
    for (let i = 1; i <= dk.levels.length; i++) {
      if (stars[i]) next = Math.min(dk.levels.length, i + 1);
    }
    const cols = 4;
    const cw = 140;
    const ch = 120;
    const stepX = (624 - cw) / (cols - 1);
    dk.levels.forEach((lv, i) => {
      const col = i % cols;
      const gx = 48 + cw / 2 + col * stepX;
      const gy = 400 + Math.floor(i / cols) * (ch + 16) + ch / 2;
      const st = stars[lv.id] || 0;
      const bg = this.add.rectangle(gx, gy, cw, ch, st > 0 ? 0x103049 : 0x0b1628, 0.94).setOrigin(0.5);
      bg.setStrokeStyle(2, st > 0 ? 0x22d3ee : 0x334155, 1);
      this.add.text(gx, gy - 24, `${lv.id}`, { fontSize: '40px', color: '#f8fafc', fontStyle: 'bold' }).setOrigin(0.5);
      this.add.text(gx, gy + 14, lv.title.split(' ')[0], { fontSize: '20px', color: '#a5f3fc', wordWrap: { width: cw - 16 }, align: 'center' }).setOrigin(0.5);
      this.add
        .text(gx, gy + 38, st > 0 ? '★'.repeat(st) + '☆'.repeat(3 - st) : '☆☆☆', { fontSize: '20px', color: '#facc15' })
        .setOrigin(0.5);
      const z = this.add.zone(gx, gy, cw, ch).setInteractive({ useHandCursor: true });
      z.on('pointerdown', () => {
        sfxClick();
        this.scene.restart({ deck: dk.id, levelId: lv.id });
      });
    });

    this.add
      .text(W / 2, 700, dk.keywords, {
        fontSize: '20px', color: P.dim, align: 'center', wordWrap: { width: 620 },
      })
      .setOrigin(0.5);

    const numNames = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT'];
    const keys: Record<string, () => void> = {
      ESC: () => this.scene.start('AljTopik'),
      ENTER: () => this.scene.restart({ deck: dk.id, levelId: next }),
    };
    dk.levels.forEach((lv, i) => {
      if (i < numNames.length) keys[numNames[i]] = () => this.scene.restart({ deck: dk.id, levelId: lv.id });
    });
    bindKeys(this, keys);
  }

  // ---------- main ----------

  private buildPlay(): void {
    const W = 720;
    const P = pal();
    const dk = this.deck!;
    const lv = this.lv!;

    const back = this.add
      .text(24, 20, '‹ LEVEL', { fontSize: '24px', color: P.accentTx, fontStyle: 'bold' })
      .setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => {
      sfxClick();
      this.scene.restart({ deck: dk.id, levelId: 0 });
    });
    this.add
      .text(W / 2, 24, `LEVEL ${lv.id} • ${lv.title.toUpperCase()}`, { fontSize: '22px', color: P.ink, fontStyle: 'bold' })
      .setOrigin(0.5, 0);
    this.add.text(W / 2, 54, lv.sub, { fontSize: '19px', color: P.dim }).setOrigin(0.5, 0);

    this.heartsTx = this.add.text(60, 100, '♥♥♥', { fontSize: '32px', color: P.bad }).setOrigin(0, 0);
    this.streakTx = this.add.text(W / 2, 100, '', { fontSize: '26px', color: P.warn, fontStyle: 'bold' }).setOrigin(0.5, 0);
    this.progTx = this.add.text(660, 100, '', { fontSize: '24px', color: P.accentTx, fontStyle: 'bold' }).setOrigin(1, 0);

    const barBg = this.add.rectangle(W / 2, 168, 624, 16, 0x0b1628).setOrigin(0.5);
    barBg.setStrokeStyle(2, 0x334155, 1);
    this.barFill = this.add.rectangle(48, 168, 624, 12, 0x22d3ee).setOrigin(0, 0.5);

    this.cardBg = this.add.rectangle(W / 2, 350, 624, 260, 0x0b1628, 0.95).setOrigin(0.5);
    this.cardBg.setStrokeStyle(3, 0xe879f9, 1);
    this.cardTx = this.add.text(W / 2, 350, '', {
      fontSize: '34px', color: '#f8fafc', fontStyle: 'bold', align: 'center',
      lineSpacing: 10, wordWrap: { width: 540 },
    }).setOrigin(0.5);

    this.feedTx = this.add.text(W / 2, 500, lv.briefing, {
      fontSize: '20px', color: P.accentTx, align: 'center', wordWrap: { width: 600 },
    }).setOrigin(0.5, 0);

    const n = lv.bins.length;
    const bh = n <= 2 ? 120 : 100;
    const gap = 16;
    const y0 = n <= 2 ? 660 : 654;
    lv.bins.forEach((bn, i) => {
      const y = y0 + i * (bh + gap);
      const bg = this.add.rectangle(W / 2, y, 624, bh, 0x103049, 0.94).setOrigin(0.5);
      bg.setStrokeStyle(3, 0x334155, 1);
      this.add.text(W / 2, y, `[${i + 1}]  ${bn}`, { fontSize: '30px', color: '#f8fafc', fontStyle: 'bold' }).setOrigin(0.5);
      const z = this.add.zone(W / 2, y, 624, bh).setInteractive({ useHandCursor: true });
      z.on('pointerdown', () => this.choose(i));
      z.on('pointerover', () => {
        if (!this.locked) bg.setFillStyle(0x164e63, 0.96);
      });
      z.on('pointerout', () => {
        if (!this.locked) bg.setFillStyle(0x103049, 0.94);
      });
      this.binBgs.push(bg);
    });

    this.add.text(W / 2, 1000, `ⓘ ${lv.hint}`, {
      fontSize: '19px', color: P.dim, align: 'center', wordWrap: { width: 620 },
    }).setOrigin(0.5, 0);

    bindKeys(this, {
      ONE: () => this.choose(0),
      TWO: () => this.choose(1),
      THREE: () => this.choose(2),
      ESC: () => {
        sfxClick();
        this.scene.restart({ deck: dk.id, levelId: 0 });
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
    this.ci = i;
    const card = lv.cards[i];
    this.progTx.setText(`Kartu ${i + 1}/${lv.cards.length}`);
    this.cardTx.setText(card.t);
    this.cardBg.setStrokeStyle(3, 0xe879f9, 1);
    this.feedTx.setText(lv.briefing).setColor(pal().accentTx);
    for (const bg of this.binBgs) bg.setStrokeStyle(3, 0x334155, 1);
    this.paintHearts();
    this.paintStreak();
    this.locked = false;
    this.deadline = this.time.now + lv.timeMs;
    this.timerOn = true;
    beep(520, 0.06, 'square', 0.05);
  }

  private choose(i: number): void {
    if (this.locked || this.winOpen || this.lv === null) return;
    if (i >= this.lv.bins.length) return;
    const card = this.lv.cards[this.ci];
    this.locked = true;
    this.timerOn = false;
    if (i === card.bin) {
      this.streak += 1;
      this.paintStreak();
      beep(740, 0.1, 'sine', 0.11);
      this.cardBg.setStrokeStyle(4, 0x4ade80, 1);
      this.binBgs[i].setStrokeStyle(4, 0x4ade80, 1);
      burst(this, 360, 350, { colors: [0x4ade80, 0xe879f9, 0xffffff], count: 16, distMin: 50, distMax: 180 });
      const bonus = this.streak >= 2 ? ` ★x${this.streak}` : '';
      this.feedTx.setText(`✓ Tepat!${bonus}`).setColor(pal().good);
      this.time.delayedCall(500, () => this.afterCard());
    } else {
      this.onWrong(i);
    }
  }

  private onTimeout(): void {
    if (this.locked || this.winOpen || this.lv === null) return;
    this.locked = true;
    this.timerOn = false;
    this.onWrong(-1);
  }

  private onWrong(picked: number): void {
    const lv = this.lv!;
    const card = lv.cards[this.ci];
    this.mistakes += 1;
    this.streak = 0;
    this.paintStreak();
    this.hearts -= 1;
    this.paintHearts();
    sfxFail();
    if (getSettings().shake) this.cameras.main.shake(180, 0.009);
    this.cardBg.setStrokeStyle(4, 0xef4444, 1);
    if (picked >= 0) this.binBgs[picked].setStrokeStyle(4, 0xef4444, 1);
    this.binBgs[card.bin].setStrokeStyle(4, 0x4ade80, 1);
    const why = picked < 0 ? '• Kehabisan waktu!' : '× Salah wadah!';
    this.feedTx.setText(`${why} Mestinya: ${lv.bins[card.bin]}`).setColor(pal().bad);
    if (this.hearts <= 0) {
      this.time.delayedCall(1400, () => this.onFail());
    } else {
      this.time.delayedCall(1200, () => {
        if (!this.winOpen) this.ask(this.ci);
      });
    }
  }

  private afterCard(): void {
    if (this.winOpen || this.lv === null) return;
    if (this.ci >= this.lv.cards.length - 1) this.onWin();
    else this.ask(this.ci + 1);
  }

  private onWin(): void {
    sfxWin();
    sfxStar();
    speak('Sortir tuntas! ' + (this.mistakes === 0 ? 'Tanpa salah!' : 'Ada ' + this.mistakes + ' kesalahan.'));
    this.winOpen = true;
    this.cameras.main.flash(250, 190, 255, 210);
    const dk = this.deck!;
    const lv = this.lv!;
    const earned = this.mistakes === 0 ? 3 : this.mistakes <= 2 ? 2 : 1;
    setStar(dk.id, lv.id, earned);
    submitScore(dk.id, lv.id, earned);
    burst(this, 200, 500, { colors: [0xe879f9, 0x22d3ee, 0xffffff], count: 34, distMin: 80, distMax: 300 });
    burst(this, 520, 500, { colors: [0x4ade80, 0xfacc15, 0xffffff], count: 34, distMin: 80, distMax: 300 });
    this.endOverlay(
      '★ SORTIR TUNTAS!',
      '★'.repeat(earned) + '☆'.repeat(3 - earned),
      `${lv.cards.length} kartu • ${this.mistakes}× salah`,
      lv.id >= dk.levels.length
    );
  }

  private onFail(): void {
    sfxFail();
    this.winOpen = true;
    this.endOverlay('× Nyawa Habis', '☆☆☆', 'Fokus, lihat polanya!', false, true);
  }

  private endOverlay(title: string, stars: string, sub: string, isLast: boolean, failed = false): void {
    const W = 720;
    const dk = this.deck!;
    const lv = this.lv!;
    const dim = this.add.rectangle(W / 2, 640, 720, 1280, 0x000000, 0.72).setDepth(20);
    const panel = this.add.rectangle(W / 2, 620, 600, 520, 0x0b1628).setDepth(21);
    panel.setStrokeStyle(3, failed ? 0xef4444 : 0xe879f9, 1);
    if (!failed) mascotBadge(this, 598, 358, 0.8, 'happy').setDepth(24);
    if (!failed) mascotBadge(this, 598, 358, 0.8, 'happy').setDepth(24);
    const d = this.add.container(0, 0).setDepth(22);
    const t1 = this.add.text(W / 2, 420, title, {
      fontSize: '34px', color: failed ? '#f87171' : '#e879f9', fontStyle: 'bold',
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
    const go = (id: number): void => {
      this.scene.restart({ deck: dk.id, levelId: id });
    };
    if (failed) {
      mkBtn(656, '↺ COBA LAGI', 0xe879f9, () => {
        sfxClick();
        go(lv.id);
      });
      mkBtn(744, '≡ DAFTAR LEVEL', 0x0f2a3d, () => {
        sfxClick();
        go(0);
      });
    } else {
      mkBtn(656, isLast ? '★ SELESAI — KE TOPIK' : '▶ LEVEL BERIKUTNYA', 0xe879f9, () => {
        sfxClick();
        if (isLast) this.scene.start('AljTopik');
        else go(lv.id + 1);
      });
      mkBtn(744, '↺ ULANGI LEVEL', 0x0f2a3d, () => {
        sfxClick();
        go(lv.id);
      });
      mkBtn(832, '≡ DAFTAR LEVEL', 0x0f2a3d, () => {
        sfxClick();
        go(0);
      });
    }
    void dim;
  }
}
