import Phaser from 'phaser';
import { STAT_LEVELS } from '../statLevels';
import { LIST_LEVELS } from '../listLevels';
import { QUIZ_A } from '../quizAlj1';
import { QUIZ_B } from '../quizAlj2';
import {
  weakList, recordMistake, recordOk, sfxClick, sfxWin, sfxFail, speak,
  beep, bindKeys, getSettings,
} from '../util';
import { ensureFxTextures, neonBackdrop, burst } from '../fx';
import { mascotBadge } from '../mascot';
import { pal } from '../theme';

// Latihan Kelemahan — soal-soal yang paling sering salah, diulang sampai bisa.
// Tanpa nyawa & tanpa gagal: ini tempat latihan, bukan ujian!

const TIME_MS = 20000;
const OPT_Y = [600, 722, 844];
const MAXQ = 10;

interface PoolQ {
  key: string;
  topic: string;
  levelTitle: string;
  q: string;
  opts: [string, string, string];
  ans: number;
  expl: string;
  sesat: [string, string, string];
}

interface TopicSrc {
  title: string;
  levels: { id: number; title: string; questions: { q: string; opts: [string, string, string]; ans: number; expl: string; sesat: [string, string, string] }[] }[];
}

const SOURCES: Record<string, TopicSrc> = {
  stat: { title: 'Statistika', levels: STAT_LEVELS },
  listrik: { title: 'Dasar Kelistrikan', levels: LIST_LEVELS },
  aljP3: { title: 'Operasi Matriks', levels: QUIZ_A.aljP3.levels },
  aljP4: { title: 'Determinan', levels: QUIZ_B.aljP4.levels },
  aljP7: { title: 'Gauss-Jordan', levels: QUIZ_B.aljP7.levels },
};

function buildPool(): PoolQ[] {
  const out: PoolQ[] = [];
  for (const w of weakList()) {
    const parts = w.key.split(':');
    if (parts.length !== 3) continue;
    const src = SOURCES[parts[0]];
    if (!src) continue;
    const lv = src.levels.find((l) => l.id === Number(parts[1]));
    const qq = lv?.questions[Number(parts[2])];
    if (!qq) continue;
    out.push({
      key: w.key, topic: src.title, levelTitle: lv.title,
      q: qq.q, opts: qq.opts, ans: qq.ans, expl: qq.expl, sesat: qq.sesat,
    });
    if (out.length >= MAXQ) break;
  }
  return out;
}

export class LatihanScene extends Phaser.Scene {
  private pool: PoolQ[] = [];
  private qi = 0;
  private correct = 0;
  private streak = 0;
  private locked = true;
  private timerOn = false;
  private deadline = 0;
  private done = false;
  private qCountTx!: Phaser.GameObjects.Text;
  private streakTx!: Phaser.GameObjects.Text;
  private barFill!: Phaser.GameObjects.Rectangle;
  private tagTx!: Phaser.GameObjects.Text;
  private qTx!: Phaser.GameObjects.Text;
  private explTx!: Phaser.GameObjects.Text;
  private optBgs: Phaser.GameObjects.Rectangle[] = [];
  private optTxs: Phaser.GameObjects.Text[] = [];

  constructor() {
    super('Latihan');
  }

  create(): void {
    ensureFxTextures(this);
    neonBackdrop(this);
    this.pool = buildPool();
    this.qi = 0;
    this.correct = 0;
    this.streak = 0;
    this.locked = true;
    this.timerOn = false;
    this.done = false;
    this.optBgs = [];
    this.optTxs = [];
    if (this.pool.length === 0) this.buildEmpty();
    else this.buildPlay();
  }

  update(): void {
    if (!this.timerOn) return;
    const t = (this.deadline - this.time.now) / TIME_MS;
    if (t <= 0) {
      this.barFill.setScale(0.01, 1);
      this.onTimeout();
      return;
    }
    this.barFill.setScale(Math.max(0.01, t), 1);
    this.barFill.setFillStyle(t > 0.5 ? 0x22d3ee : t > 0.25 ? 0xfacc15 : 0xef4444);
  }

  private buildEmpty(): void {
    const W = 720;
    const P = pal();
    this.add
      .text(W / 2, 420, 'Belum ada data salah!\nMain kuis dulu, yang salah\nmuncul di sini buat latihan.', {
        fontSize: '26px', color: P.ink, align: 'center', lineSpacing: 10,
      })
      .setOrigin(0.5);
    const bg = this.add.rectangle(W / 2, 700, 440, 72, 0x22d3ee).setOrigin(0.5);
    bg.setStrokeStyle(2, 0xa5f3fc, 1);
    this.add.text(W / 2, 700, '≡ MENU UTAMA', { fontSize: '26px', color: '#04121a', fontStyle: 'bold' }).setOrigin(0.5);
    const z = this.add.zone(W / 2, 700, 440, 88).setInteractive({ useHandCursor: true });
    z.on('pointerdown', () => {
      sfxClick();
      this.scene.start('MainMenu');
    });
    bindKeys(this, {
      ESC: () => this.scene.start('MainMenu'),
      ENTER: () => this.scene.start('MainMenu'),
    });
  }

  private buildPlay(): void {
    const W = 720;
    const P = pal();
    const back = this.add
      .text(24, 20, '‹ MENU', { fontSize: '24px', color: P.accentTx, fontStyle: 'bold' })
      .setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => {
      sfxClick();
      this.scene.start('MainMenu');
    });
    this.add
      .text(W / 2, 28, 'LATIHAN KELEMAHAN', { fontSize: '26px', color: P.ink, fontStyle: 'bold' })
      .setOrigin(0.5, 0);
    this.add.text(W / 2, 60, 'Soal yang sering salah — tanpa nyawa, santai!', { fontSize: '19px', color: P.dim }).setOrigin(0.5, 0);

    this.streakTx = this.add
      .text(W / 2, 104, '', { fontSize: '26px', color: P.warn, fontStyle: 'bold' })
      .setOrigin(0.5, 0);
    this.qCountTx = this.add
      .text(660, 104, '', { fontSize: '24px', color: P.accentTx, fontStyle: 'bold' })
      .setOrigin(1, 0);

    const barBg = this.add.rectangle(W / 2, 168, 624, 16, 0x0b1628).setOrigin(0.5);
    barBg.setStrokeStyle(2, 0x334155, 1);
    this.barFill = this.add.rectangle(48, 168, 624, 12, 0x22d3ee).setOrigin(0, 0.5);

    this.tagTx = this.add.text(60, 196, '', { fontSize: '19px', color: P.accentTx, fontStyle: 'bold' }).setOrigin(0, 0);
    const qCard = this.add.rectangle(W / 2, 350, 624, 240, 0x0b1628, 0.92).setOrigin(0.5);
    qCard.setStrokeStyle(2, 0xe879f9, 0.9);
    this.qTx = this.add
      .text(W / 2, 350, '', {
        fontSize: '26px', color: '#f8fafc', fontStyle: 'bold', align: 'center',
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
        this.scene.start('MainMenu');
      },
    });

    this.ask(0);
  }

  private ask(i: number): void {
    const q = this.pool[i];
    this.qi = i;
    this.qCountTx.setText(`Soal ${i + 1}/${this.pool.length}`);
    this.tagTx.setText(`${q.topic} • ${q.levelTitle}`);
    this.qTx.setText(q.q);
    this.explTx.setVisible(false);
    for (let k = 0; k < 3; k++) {
      this.optTxs[k].setText(`${k + 1}.  ${q.opts[k]}`);
      this.optBgs[k].setFillStyle(0x103049, 0.94);
      this.optBgs[k].setStrokeStyle(2, 0x334155, 1);
    }
    this.streakTx.setText(this.streak >= 2 ? `★ x${this.streak}` : '');
    this.locked = false;
    this.deadline = this.time.now + TIME_MS;
    this.timerOn = true;
  }

  private revealCorrect(): void {
    const ans = this.pool[this.qi].ans;
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
    if (this.locked || this.done) return;
    const q = this.pool[this.qi];
    this.locked = true;
    this.timerOn = false;
    if (i === q.ans) {
      this.correct += 1;
      this.streak += 1;
      recordOk(q.key);
      beep(740, 0.12, 'sine', 0.12);
      this.revealCorrect();
      burst(this, 360, OPT_Y[i], { colors: [0x4ade80, 0xe879f9, 0xffffff], count: 22, distMin: 60, distMax: 220 });
      this.explTx.setText(`✓ Mantap, naik level! ${q.expl}`).setColor('#bbf7d0').setVisible(true);
      this.time.delayedCall(1200, () => this.afterCard());
    } else {
      this.onWrong(i);
    }
  }

  private onTimeout(): void {
    if (this.locked || this.done) return;
    this.locked = true;
    this.timerOn = false;
    this.onWrong(-1);
  }

  private onWrong(picked: number): void {
    const q = this.pool[this.qi];
    this.streak = 0;
    recordMistake(q.key);
    sfxFail();
    if (getSettings().shake) this.cameras.main.shake(180, 0.009);
    this.revealCorrect();
    const trap = picked >= 0 ? q.sesat[picked] : '';
    const trapTx = trap !== '' ? `Jebakan: ${trap} ` : '';
    const prefix = picked < 0 ? '• Waktu habis! ' : '× Belum tepat! ';
      this.explTx.setText(`${prefix}${trapTx}✓ ${q.opts[q.ans]}. ${q.expl}`).setColor('#fecaca').setVisible(true);
    this.time.delayedCall(2200, () => {
      if (!this.done) this.afterCard();
    });
  }

  private afterCard(): void {
    if (this.done) return;
    if (this.qi >= this.pool.length - 1) this.onWin();
    else this.ask(this.qi + 1);
  }

  private onWin(): void {
    sfxWin();
    this.done = true;
    this.cameras.main.flash(250, 190, 255, 210);
    const total = this.pool.length;
    const pct = Math.round((this.correct / total) * 100);
    speak(`Latihan selesai! Benar ${this.correct} dari ${total} soal.`);
    burst(this, 360, 500, { colors: [0xe879f9, 0x4ade80, 0xfacc15, 0xffffff], count: 40, distMin: 80, distMax: 300 });

    const W = 720;
    const dim = this.add.rectangle(W / 2, 640, 720, 1280, 0x000000, 0.72).setDepth(20);
    const panel = this.add.rectangle(W / 2, 620, 600, 520, 0x0b1628).setDepth(21);
    panel.setStrokeStyle(3, 0xe879f9, 1);
    mascotBadge(this, 598, 358, 0.8, 'happy').setDepth(24);
    const d = this.add.container(0, 0).setDepth(22);
    const t1 = this.add.text(W / 2, 420, '💪 MAKIN KUAT!', { fontSize: '34px', color: '#e879f9', fontStyle: 'bold' }).setOrigin(0.5);
    const t2 = this.add.text(W / 2, 478, `${this.correct}/${total} benar (${pct}%)`, { fontSize: '30px', color: '#f8fafc', fontStyle: 'bold' }).setOrigin(0.5);
    const t3 = this.add.text(W / 2, 540,
      pct === 100 ? 'Bersih! Kelemahanmu lunas' : 'Yang masih salah bakal muncul lagi. Gas!',
      { fontSize: '22px', color: '#e2e8f0', align: 'center', wordWrap: { width: 520 }, lineSpacing: 6 }).setOrigin(0.5);
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
      mkBtn(676, '↺ LATIHAN LAGI', 0xe879f9, () => {
        sfxClick();
        this.scene.restart();
      });
      mkBtn(764, '≡ MENU UTAMA', 0x0f2a3d, () => {
        sfxClick();
        this.scene.start('MainMenu');
      });
    void dim;
  }
}
