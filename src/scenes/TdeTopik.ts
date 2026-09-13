import Phaser from 'phaser';
import { LEVELS } from '../levels';
import { getStars, sfxClick, bindKeys } from '../util';
import { ensureFxTextures, neonBackdrop, currentLine, burst } from '../fx';
import { pal } from '../theme';

interface Topik {
  id: string;
  icon: string;
  title: string;
  desc: string;
  starsKey: string;
  target: string;
  total: number;
}

const TOPIKS: Topik[] = [
  { id: 'atom', icon: '⊙', title: 'Struktur Atom', desc: 'Proton • neutron • elektron • Bohr', starsKey: 'atom', target: 'Atom', total: 8 },
  { id: 'listrik', icon: '◉', title: 'Dasar Kelistrikan', desc: 'Satuan • alat ukur • Ohm • daya', starsKey: 'listrik', target: 'Listrik', total: 8 },
  { id: 'dc', icon: '⚡', title: 'Rangkaian Arus Searah', desc: 'Seri-paralel • daya • KCL/KVL', starsKey: 'tde', target: 'Menu', total: LEVELS.length },
];

export class TdeTopikScene extends Phaser.Scene {
  constructor() {
    super('TdeTopik');
  }

  create(): void {
    const W = 720;
    const P = pal();
    ensureFxTextures(this);
    neonBackdrop(this);

    const back = this.add
      .text(24, 20, '‹ MATA KULIAH', { fontSize: '24px', color: P.accentTx, fontStyle: 'bold' })
      .setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => {
      sfxClick();
      this.scene.start('Course');
    });

    this.add
      .text(W / 2, 100, 'TEKNIK DASAR ELEKTRO', {
        fontSize: '38px', color: P.title, fontStyle: 'bold',
        fontFamily: "'Chakra Petch', sans-serif",
        stroke: '#92400e', strokeThickness: 2,
        shadow: { offsetX: 0, offsetY: 0, color: '#f59e0b', blur: 22, fill: true },
      })
      .setOrigin(0.5);
    this.add
      .text(W / 2, 152, 'Pilih pokok pembahasan', { fontSize: '23px', color: P.dim })
      .setOrigin(0.5);
    currentLine(this, 110, 610, 196);

    TOPIKS.forEach((t, i) => {
      const stars = getStars(t.starsKey);
      const done = Object.keys(stars).length;
      const totalStar = Object.values(stars).reduce((a, b) => a + b, 0);
      this.topikCard(t, 340 + i * 170, done, totalStar);
    });

    this.add
      .text(W / 2, 880, '3 pokok • 32 level • cocok buat 14 pertemuan', { fontSize: '21px', color: P.dim })
      .setOrigin(0.5);

    bindKeys(this, {
      ESC: () => this.scene.start('Course'),
      ENTER: () => this.scene.start('Atom'),
    });
  }

  private topikCard(t: Topik, y: number, done: number, totalStar: number): void {
    const W = 720;
    const cw = 624;
    const ch = 148;
    this.add.image(W / 2, y, 'fx-glow').setTint(0xe879f9).setAlpha(0.14).setScale(cw / 128, ch / 128 + 0.3);
    const bg = this.add.rectangle(W / 2, y, cw, ch, 0x103049, 0.94).setOrigin(0.5);
    bg.setStrokeStyle(2, 0xe879f9, 0.9);

    this.add.circle(118, y, 42, 0x4a1442, 1).setStrokeStyle(3, 0xe879f9, 1);
    this.add.text(118, y - 2, t.icon, { fontSize: '46px' }).setOrigin(0.5);
    this.add.text(182, y - 32, t.title, { fontSize: '29px', color: '#f8fafc', fontStyle: 'bold' }).setOrigin(0, 0.5);
    this.add.text(182, y + 12, t.desc, { fontSize: '20px', color: '#94a3b8' }).setOrigin(0, 0.5);

    this.add
      .text(648, y - 26, `${done}/${t.total} level`, { fontSize: '19px', color: '#a5f3fc', fontStyle: 'bold' })
      .setOrigin(1, 0.5);
    const shown = Math.min(3, totalStar);
    this.add
      .text(648, y + 4, '★'.repeat(shown) + '☆'.repeat(3 - shown), { fontSize: '20px', color: '#facc15' })
      .setOrigin(1, 0.5);
    this.add
      .text(648, y + 36, 'MAIN ▶', { fontSize: '22px', color: '#4ade80', fontStyle: 'bold' })
      .setOrigin(1, 0.5);

    const z = this.add.zone(W / 2, y, cw, ch).setInteractive({ useHandCursor: true });
    z.on('pointerdown', () => {
      sfxClick();
      burst(this, W / 2, y, { colors: [0xe879f9, 0xa5f3fc, 0xffffff], count: 18, distMin: 60, distMax: 200 });
      this.time.delayedCall(160, () => this.scene.start(t.target));
    });
    z.on('pointerover', () => bg.setFillStyle(0x164e63, 0.96));
    z.on('pointerout', () => bg.setFillStyle(0x103049, 0.94));
  }
}
