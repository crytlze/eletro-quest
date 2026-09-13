import Phaser from 'phaser';
import { LEVELS } from '../levels';
import { getStars, sfxClick, bindKeys } from '../util';
import { ensureFxTextures, neonBackdrop, currentLine, burst } from '../fx';
import { pal } from '../theme';

interface Course {
  id: string;
  icon: string;
  title: string;
  desc: string;
  starsKey: string;
  target: string;
  total: number;
  agg?: string[];
}

const COURSES: Course[] = [
  { id: 'tde', icon: '⚡', title: 'Teknik Dasar Elektro', desc: 'Atom • dasar • rangkaian DC', starsKey: 'tde', target: 'TdeTopik', total: LEVELS.length + 16, agg: ['tde', 'atom', 'listrik'] },
  { id: 'rl', icon: '∿', title: 'Rangkaian Listrik', desc: 'AC • RLC • fasor • resonansi', starsKey: 'rl', target: 'AC', total: 8 },
  { id: 'elka', icon: '◉', title: 'Dasar Elektronika', desc: 'Transistor • titik kerja • bias', starsKey: 'elka', target: 'Bias', total: 8 },
  { id: 'digi', icon: '◆', title: 'Elektronika Digital', desc: 'Gerbang logika • adder • MUX', starsKey: 'digi', target: 'Digital', total: 8 },
  { id: 'alj', icon: '∑', title: 'Aljabar Linier', desc: '7 topik • 58 level • UTS aman', starsKey: 'alj', target: 'AljTopik', total: 58, agg: ['aljP1', 'aljP2', 'aljP3', 'aljP4', 'aljP5', 'alj', 'aljP7'] },
  { id: 'stat', icon: '◑', title: 'Statistik & Probabilitas', desc: 'Peluang • Rata-rata • Harapan', starsKey: 'stat', target: 'Stat', total: 8 },
  { id: 'prog', icon: '▲', title: 'Dasar Komputer', desc: 'Algoritma • sekuens • robot', starsKey: 'prog', target: 'Kode', total: 8 },
];

export class CourseScene extends Phaser.Scene {
  constructor() {
    super('Course');
  }

  create(): void {
    const W = 720;
    const P = pal();
    ensureFxTextures(this);
    neonBackdrop(this);

    const back = this.add
      .text(24, 20, '‹ MENU UTAMA', { fontSize: '24px', color: P.accentTx, fontStyle: 'bold' })
      .setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => {
      sfxClick();
      this.scene.start('MainMenu');
    });

    this.add
      .text(W / 2, 100, 'PILIH MATA KULIAH', {
        fontSize: '42px', color: P.title, fontStyle: 'bold',
        fontFamily: "'Chakra Petch', sans-serif",
        stroke: '#92400e', strokeThickness: 2,
        shadow: { offsetX: 0, offsetY: 0, color: '#f59e0b', blur: 22, fill: true },
      })
      .setOrigin(0.5);
    this.add
      .text(W / 2, 152, 'Pilih modul buat mulai main', { fontSize: '23px', color: P.dim })
      .setOrigin(0.5);
    currentLine(this, 110, 610, 196);

    COURSES.forEach((c, i) => {
      const keys = c.agg ?? [c.starsKey];
      let done = 0;
      let totalStar = 0;
      for (const k of keys) {
        const s = getStars(k);
        done += Object.keys(s).length;
        totalStar += Object.values(s).reduce((a, b) => a + b, 0);
      }
      this.courseCard(c, 322 + i * 120, done, totalStar);
    });

    this.add
      .text(W / 2, 1160, '7 modul • semua bisa dimainkan', { fontSize: '20px', color: P.dim })
      .setOrigin(0.5);

    bindKeys(this, {
      ESC: () => this.scene.start('MainMenu'),
      ENTER: () => this.scene.start('Menu'),
    });
  }

  private courseCard(c: Course, y: number, done: number, totalStar: number): void {
    const W = 720;
    const cw = 624;
    const ch = 104;
    this.add.image(W / 2, y, 'fx-glow').setTint(0x22d3ee).setAlpha(0.14).setScale(cw / 128, ch / 128 + 0.4);
    const bg = this.add.rectangle(W / 2, y, cw, ch, 0x103049, 0.94).setOrigin(0.5);
    bg.setStrokeStyle(2, 0x22d3ee, 1);

    this.add.circle(112, y, 32, 0x22d3ee, 1).setStrokeStyle(3, 0xa5f3fc, 1);
    this.add.text(112, y - 2, c.icon, { fontSize: '34px' }).setOrigin(0.5);
    this.add.text(162, y - 18, c.title, { fontSize: '26px', color: '#f8fafc', fontStyle: 'bold' }).setOrigin(0, 0.5);
    this.add.text(162, y + 18, c.desc, { fontSize: '20px', color: '#94a3b8' }).setOrigin(0, 0.5);

    this.add
      .text(648, y - 18, `${done}/${c.total}`, { fontSize: '18px', color: '#a5f3fc', fontStyle: 'bold' })
      .setOrigin(1, 0.5);
    const shown = Math.min(3, totalStar);
    this.add
      .text(648, y + 8, '★'.repeat(shown) + '☆'.repeat(3 - shown), { fontSize: '17px', color: '#facc15' })
      .setOrigin(1, 0.5);
    this.add
      .text(648, y + 30, 'MAIN ▶', { fontSize: '19px', color: '#4ade80', fontStyle: 'bold' })
      .setOrigin(1, 0.5);

    const z = this.add.zone(W / 2, y, cw, ch).setInteractive({ useHandCursor: true });
    z.on('pointerdown', () => {
      sfxClick();
      burst(this, W / 2, y, { colors: [0x22d3ee, 0xa5f3fc, 0xffffff], count: 18, distMin: 60, distMax: 200 });
      this.time.delayedCall(160, () => this.scene.start(c.target));
    });
    z.on('pointerover', () => bg.setFillStyle(0x164e63, 0.96));
    z.on('pointerout', () => bg.setFillStyle(0x103049, 0.94));
  }
}
