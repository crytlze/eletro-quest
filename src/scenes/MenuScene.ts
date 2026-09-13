import Phaser from 'phaser';
import { LEVELS } from '../levels';
import { getStars, clearStars, sfxClick, bindKeys } from '../util';
import { ensureFxTextures, neonBackdrop, currentLine, buttonShadow, pressable } from '../fx';
import { pal } from '../theme';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create(): void {
    const W = 720;
    const P = pal();
    ensureFxTextures(this);
    neonBackdrop(this);

    const back = this.add
      .text(24, 20, '‹ TOPIK', { fontSize: '24px', color: P.accentTx, fontStyle: 'bold' })
      .setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => {
      sfxClick();
      this.scene.start('TdeTopik');
    });

    // Judul dengan glow + denyut halus
    const title = this.add
      .text(W / 2, 118, 'TEKNIK DASAR ELEKTRO', {
        fontSize: '42px',
        fontFamily: "'Chakra Petch', sans-serif",
        color: P.title,
        fontStyle: 'bold',
        stroke: '#92400e',
        strokeThickness: 2,
        shadow: { offsetX: 0, offsetY: 0, color: '#f59e0b', blur: 26, fill: true },
      })
      .setOrigin(0.5);
    this.tweens.add({
      targets: title,
      scale: 1.025,
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    this.add
      .text(W / 2, 172, 'Teknik Dasar Elektro • Rangkaian DC', {
        fontSize: '24px',
        color: P.accentTx,
        fontStyle: 'bold',
        shadow: { offsetX: 0, offsetY: 0, color: '#0891b2', blur: 12, fill: true },
      })
      .setOrigin(0.5);
    this.add
      .text(
        W / 2,
        218,
        'Rakit rangkaian • tekan POWER • penuhi target V / I\n16 level • ±30 menit • tanpa install',
        {
          fontSize: '21px',
          color: P.ink,
          align: 'center',
          lineSpacing: 6,
        }
      )
      .setOrigin(0.5);

    currentLine(this, 110, 610, 268);

    // tombol main (level lanjut)
    const stars = getStars('tde');
    let next = 1;
    for (let i = 1; i <= LEVELS.length; i++) {
      if (stars[i]) next = Math.min(LEVELS.length, i + 1);
    }
    buttonShadow(this, W / 2, 348, 440, 88);
    const playBg = this.add.rectangle(0, 0, 440, 88, 0x22d3ee).setOrigin(0.5);
    playBg.setStrokeStyle(3, 0xa5f3fc, 1);
    const playTx = this.add
      .text(0, 0, `▶ MAIN LEVEL ${next}`, { fontSize: '30px', color: '#04121a', fontStyle: 'bold', fontFamily: "'Chakra Petch', sans-serif" })
      .setOrigin(0.5);
    const play = this.add.container(W / 2, 348, [playBg, playTx]);
    const playZone = this.add.zone(W / 2, 348, 440, 88).setInteractive({ useHandCursor: true });
    pressable(this, playZone, play);
    playZone.on('pointerdown', () => {
      sfxClick();
      this.scene.start('Game', { levelId: next });
    });
    playZone.on('pointerover', () => playBg.setFillStyle(0x67e8f9));
    playZone.on('pointerout', () => playBg.setFillStyle(0x22d3ee));

    this.add.text(60, 392, 'PILIH LEVEL (16)', { fontSize: '24px', color: P.accentTx, fontStyle: 'bold' });

    // grid 4 x 4
    const cols = 4;
    const cw = 140;
    const ch = 88;
    LEVELS.forEach((lv, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = 118 + col * ((624 - cw) / (cols - 1));
      const y = 472 + row * 108;
      const st = stars[lv.id] || 0;
      if (st > 0) {
        this.add.image(x, y, 'fx-glow').setTint(0x22d3ee).setAlpha(0.22)
          .setScale(cw / 128 + 0.3, ch / 128 + 0.4);
      }
      const bg = this.add.rectangle(x, y, cw, ch, st > 0 ? 0x103049 : 0x0b1628, 0.92).setOrigin(0.5);
      bg.setStrokeStyle(2, st > 0 ? 0x22d3ee : 0x334155, 1);
      this.add.text(x, y - 20, `${lv.id}`, { fontSize: '34px', color: '#f8fafc', fontStyle: 'bold' }).setOrigin(0.5);
      this.add.text(x, y + 10, lv.title.split(' ')[0], { fontSize: '20px', color: '#a5f3fc' }).setOrigin(0.5);
      this.add
        .text(x, y + 30, st > 0 ? '★'.repeat(st) + '☆'.repeat(3 - st) : '☆☆☆', {
          fontSize: '20px',
          color: '#facc15',
        })
        .setOrigin(0.5);
      const z = this.add.zone(x, y, cw, ch).setInteractive({ useHandCursor: true });
      z.on('pointerdown', () => {
        sfxClick();
        this.scene.start('Game', { levelId: lv.id });
      });
      z.on('pointerover', () => bg.setFillStyle(0x164e63, 0.95));
      z.on('pointerout', () => bg.setFillStyle(st > 0 ? 0x103049 : 0x0b1628, 0.92));
    });

    const howBg = this.add.rectangle(W / 2, 922, 620, 150, 0x0b1628, 0.85).setOrigin(0.5);
    howBg.setStrokeStyle(2, 0x1e3a5f, 1);
    this.add
      .text(
        W / 2,
        922,
        'Cara main:\n1) Ketuk kotak ORANYE untuk ganti komponen\n2) Tekan POWER untuk uji rangkaian\n3) Baca multimeter (V/A/W) & penuhi target',
        { fontSize: '22px', color: '#e2e8f0', align: 'center', lineSpacing: 8 }
      )
      .setOrigin(0.5);

    this.add
      .text(W / 2, 1010, 'Materi: Ohm • Seri-Paralel • KCL/KVL • Daya • Fuse', {
        fontSize: '20px',
        color: P.dim,
      })
      .setOrigin(0.5);

    const rst = this.add
      .text(W / 2, 1072, '↺ reset progress', { fontSize: '20px', color: P.dim })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    rst.on('pointerdown', () => {
      clearStars();
      sfxClick();
      this.scene.restart();
    });
    const rstZ = this.add.zone(W / 2, 1072, 240, 64).setInteractive({ useHandCursor: true });
    rstZ.on('pointerdown', () => {
      clearStars();
      sfxClick();
      this.scene.restart();
    });

    this.add
      .text(W / 2, 1180, 'v1.0 • dibuat untuk demo kelas S1 Elektro', {
        fontSize: '20px',
        color: P.dim,
      })
      .setOrigin(0.5);

    const numNames = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'ZERO'];
    const keys: Record<string, () => void> = {
      ESC: () => this.scene.start('TdeTopik'),
      ENTER: () => this.scene.start('Game', { levelId: next }),
    };
    LEVELS.forEach((lv, i) => {
      if (i < numNames.length) keys[numNames[i]] = () => this.scene.start('Game', { levelId: lv.id });
    });
    bindKeys(this, keys);
  }
}
