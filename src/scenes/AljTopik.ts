import Phaser from 'phaser';
import { ALJ_LEVELS } from '../aljLevels';
import { getStars, sfxClick, bindKeys } from '../util';
import { ensureFxTextures, neonBackdrop, currentLine, burst } from '../fx';
import { pal } from '../theme';

interface AljTopik {
  id: string;
  icon: string;
  title: string;
  desc: string;
  starsKey: string;
  target: string;
  params: Record<string, string>;
  total: number;
}

const TOPIKS: AljTopik[] = [
  { id: 'p1', icon: '●', title: 'Pengenalan', desc: 'Sortir: skalar • vektor • matriks', starsKey: 'aljP1', target: 'Sortir', params: { deck: 'aljP1' }, total: 4 },
  { id: 'p2', icon: '◆', title: 'Matriks', desc: 'Sortir jenis-jenis matriks', starsKey: 'aljP2', target: 'Sortir', params: { deck: 'aljP2' }, total: 6 },
  { id: 'p3', icon: '+', title: 'Operasi Matriks', desc: 'Jumlah • kurang • kali • transpose', starsKey: 'aljP3', target: 'Kuis', params: { topic: 'aljP3' }, total: 8 },
  { id: 'p4', icon: '≡', title: 'Determinan', desc: 'Det 2×2 • 3×3 • sifat', starsKey: 'aljP4', target: 'Kuis', params: { topic: 'aljP4' }, total: 8 },
  { id: 'p5', icon: '▲', title: 'Invers Matriks', desc: 'Memory match A ↔ A⁻¹', starsKey: 'aljP5', target: 'Match', params: {}, total: 6 },
  { id: 'p6', icon: '∑', title: 'SPL', desc: 'Misi Vektor • 20 level', starsKey: 'alj', target: 'Aljabar', params: {}, total: ALJ_LEVELS.length },
  { id: 'p7', icon: '≠', title: 'Gauss & Jordan', desc: 'OBE • eselon • solusi', starsKey: 'aljP7', target: 'Kuis', params: { topic: 'aljP7' }, total: 6 },
];

export class AljTopikScene extends Phaser.Scene {
  constructor() {
    super('AljTopik');
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
      .text(W / 2, 100, 'ALJABAR LINIER', {
        fontSize: '42px', color: P.title, fontStyle: 'bold',
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
      this.topikCard(t, 322 + i * 120, done, totalStar);
    });

    this.add
      .text(W / 2, 1160, '7 pokok • 58 level • 1 UTS aman', { fontSize: '20px', color: P.dim })
      .setOrigin(0.5);

    bindKeys(this, {
      ESC: () => this.scene.start('Course'),
      ENTER: () => this.scene.start('Kuis', { topic: 'aljP1' }),
    });
  }

  private topikCard(t: AljTopik, y: number, done: number, totalStar: number): void {
    const W = 720;
    const cw = 624;
    const ch = 104;
    this.add.image(W / 2, y, 'fx-glow').setTint(0x22d3ee).setAlpha(0.14).setScale(cw / 128, ch / 128 + 0.4);
    const bg = this.add.rectangle(W / 2, y, cw, ch, 0x103049, 0.94).setOrigin(0.5);
    bg.setStrokeStyle(2, 0x22d3ee, 1);

    this.add.circle(112, y, 32, 0x22d3ee, 1).setStrokeStyle(3, 0xa5f3fc, 1);
    this.add.text(112, y - 2, t.icon, { fontSize: '34px' }).setOrigin(0.5);
    this.add.text(162, y - 18, t.title, { fontSize: '26px', color: '#f8fafc', fontStyle: 'bold' }).setOrigin(0, 0.5);
    this.add.text(162, y + 18, t.desc, { fontSize: '17px', color: '#94a3b8' }).setOrigin(0, 0.5);

    this.add
      .text(648, y - 18, `${done}/${t.total}`, { fontSize: '18px', color: '#a5f3fc', fontStyle: 'bold' })
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
      this.time.delayedCall(160, () => this.scene.start(t.target, t.params));
    });
    z.on('pointerover', () => bg.setFillStyle(0x164e63, 0.96));
    z.on('pointerout', () => bg.setFillStyle(0x103049, 0.94));
  }
}
