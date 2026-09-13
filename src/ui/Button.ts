import * as Phaser from 'phaser';
import { COLORS, FONT_FAMILY } from '../utils/constants';
import { audioManager } from '../audio/AudioManager';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'success';

export interface ButtonOptions {
  width?: number;
  height?: number;
  variant?: ButtonVariant;
}

const VARIANT_STYLE: Record<ButtonVariant, { fill: number; edge: number; text: string }> = {
  primary: { fill: 0x0e7490, edge: COLORS.cyan, text: '#eaf6ff' },
  secondary: { fill: 0x16294a, edge: 0x3b82f6, text: '#cfe8ff' },
  ghost: { fill: 0x0b1a33, edge: 0x2b4a73, text: '#8aa0b8' },
  success: { fill: 0x15803d, edge: COLORS.neonGreen, text: '#f0fdf4' }
};

/**
 * Reusable premium button: glass fill, neon edge, press squash.
 * Touch target defaults to 96px tall (≥44 CSS px after FIT scaling).
 */
export class PremiumButton extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Graphics;
  private labelText: Phaser.GameObjects.Text;
  private readonly bw: number;
  private readonly bh: number;
  private onTap: () => void;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    label: string,
    onTap: () => void,
    opts: ButtonOptions = {}
  ) {
    super(scene, x, y);
    this.bw = opts.width ?? 296;
    this.bh = opts.height ?? 96;
    const variant = opts.variant ?? 'primary';
    this.onTap = onTap;

    const style = VARIANT_STYLE[variant];
    this.bg = scene.add.graphics();
    this.drawFace(style.fill, style.edge);

    this.labelText = scene.add
      .text(0, 0, label.toUpperCase(), {
        fontFamily: FONT_FAMILY,
        fontSize: '30px',
        fontStyle: 'bold',
        color: style.text,
        letterSpacing: 2
      } as Phaser.Types.GameObjects.Text.TextStyle)
      .setOrigin(0.5);

    this.add([this.bg, this.labelText]);

    // Explicit hit shape: Containers have no texture frame, so default
    // hit areas are unreliable — a centered invisible rect always works
    // for both mouse and touch.
    const hit = scene.add.rectangle(0, 0, this.bw, this.bh, 0xffffff, 0);
    hit.setInteractive({ useHandCursor: true });
    this.add(hit);

    hit.on('pointerover', () => {
      this.drawFace(style.fill, 0x9be9ff);
    });
    hit.on('pointerout', () => {
      this.drawFace(style.fill, style.edge);
      this.setScale(1);
    });
    hit.on('pointerdown', () => {
      audioManager.unlock();
      audioManager.play('click');
      scene.tweens.add({ targets: this, scale: 0.94, duration: 70, ease: 'Sine.easeOut' });
    });
    hit.on('pointerup', () => {
      scene.tweens.add({
        targets: this,
        scale: 1,
        duration: 120,
        ease: 'Back.easeOut',
        onComplete: () => this.onTap()
      });
    });

    scene.add.existing(this);
  }

  private drawFace(fill: number, edge: number): void {
    const w = this.bw;
    const h = this.bh;
    this.bg.clear();
    // Drop shadow.
    this.bg.fillStyle(0x000000, 0.35);
    this.bg.fillRoundedRect(-w / 2, -h / 2 + 5, w, h, 22);
    // Body.
    this.bg.fillStyle(fill, 1);
    this.bg.fillRoundedRect(-w / 2, -h / 2, w, h, 22);
    // Glass highlight.
    this.bg.fillStyle(0xffffff, 0.09);
    this.bg.fillRoundedRect(-w / 2 + 3, -h / 2 + 3, w - 6, h * 0.4, { tl: 19, tr: 19, bl: 8, br: 8 });
    // Neon edge.
    this.bg.lineStyle(2.5, edge, 1);
    this.bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 22);
  }
}
