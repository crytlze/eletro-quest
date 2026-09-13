import * as Phaser from 'phaser';
import { COLORS, FONT_FAMILY, GAME_WIDTH, SCENE_KEYS } from '../utils/constants';
import { drawBolt, drawLabBackground } from '../utils/helpers';

/** Boot: procedural logo + loading bar, then hands off to MainMenu. No external assets. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.Boot);
  }

  create(): void {
    drawLabBackground(this);
    const cx = GAME_WIDTH / 2;

    // Logo badge.
    const badge = this.add.graphics();
    badge.fillStyle(0x06283a, 1);
    badge.fillCircle(cx, 430, 110);
    badge.lineStyle(3, COLORS.cyan, 0.9);
    badge.strokeCircle(cx, 430, 110);
    badge.lineStyle(10, COLORS.cyan, 0.12);
    badge.strokeCircle(cx, 430, 128);
    const bolt = this.add.graphics();
    drawBolt(bolt, cx, 430, 120);

    this.add
      .text(cx, 600, 'ELECTROPUZZLE', {
        fontFamily: FONT_FAMILY,
        fontSize: '64px',
        fontStyle: 'bold',
        color: '#eaf6ff',
        letterSpacing: 4
      } as Phaser.Types.GameObjects.Text.TextStyle)
      .setOrigin(0.5);
    this.add
      .text(cx, 652, 'INTERACTIVE ELECTRICAL ENGINEERING', {
        fontFamily: FONT_FAMILY,
        fontSize: '24px',
        color: '#8aa0b8',
        letterSpacing: 3
      } as Phaser.Types.GameObjects.Text.TextStyle)
      .setOrigin(0.5);

    // Loading bar frame.
    const barW = 440;
    const barH = 18;
    const barX = cx - barW / 2;
    const barY = 760;
    const frame = this.add.graphics();
    frame.fillStyle(0x0b1a33, 1);
    frame.fillRoundedRect(barX - 4, barY - 4, barW + 8, barH + 8, 12);
    frame.lineStyle(2, COLORS.glassBorder, 1);
    frame.strokeRoundedRect(barX - 4, barY - 4, barW + 8, barH + 8, 12);
    const fill = this.add.graphics();

    this.add
      .text(cx, 810, 'Warming up the lab…', {
        fontFamily: FONT_FAMILY,
        fontSize: '26px',
        color: '#5b7190'
      })
      .setOrigin(0.5);

    // Pulse the badge while "loading".
    this.tweens.add({ targets: badge, alpha: 0.75, duration: 450, yoyo: true, repeat: -1 });

    // Simulated load (no assets yet) — tween the fill, then go.
    const progress = { t: 0 };
    this.tweens.add({
      targets: progress,
      t: 1,
      duration: 900,
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        fill.clear();
        fill.fillStyle(COLORS.cyan, 1);
        fill.fillRoundedRect(barX, barY, Math.max(18, barW * progress.t), barH, 9);
      },
      onComplete: () => {
        this.scene.start(SCENE_KEYS.MainMenu);
      }
    });

    this.tweens.add({ targets: bolt, y: -6, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }
}
