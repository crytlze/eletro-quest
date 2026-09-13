import * as Phaser from 'phaser';
import { COLORS, FONT_FAMILY, GAME_HEIGHT, GAME_WIDTH } from './constants';

/** Draw the signature dark-lab background: vertical gradient + circuit grid + vignette. */
export function drawLabBackground(scene: Phaser.Scene): void {
  const g = scene.add.graphics().setDepth(-10);

  // Vertical gradient (banded, cheap — 24 strips is plenty at 60fps).
  const strips = 24;
  const top = new Phaser.Display.Color(9, 15, 32);
  const bottom = new Phaser.Display.Color(5, 9, 20);
  for (let i = 0; i < strips; i++) {
    const t = i / (strips - 1);
    const r = Math.round(top.red + (bottom.red - top.red) * t);
    const gg = Math.round(top.green + (bottom.green - top.green) * t);
    const b = Math.round(top.blue + (bottom.blue - top.blue) * t);
    g.fillStyle(Phaser.Display.Color.GetColor(r, gg, b), 1);
    g.fillRect(0, (GAME_HEIGHT / strips) * i, GAME_WIDTH, GAME_HEIGHT / strips + 1);
  }

  // Circuit-board grid.
  g.lineStyle(1, COLORS.glassBorder, 0.35);
  const step = 56;
  for (let x = step; x < GAME_WIDTH; x += step) {
    g.lineBetween(x, 0, x, GAME_HEIGHT);
  }
  for (let y = step; y < GAME_HEIGHT; y += step) {
    g.lineBetween(0, y, GAME_WIDTH, y);
  }

  // A few glowing node dots to suggest PCB pads (static, zero per-frame cost).
  g.fillStyle(COLORS.cyan, 0.16);
  const nodes: Array<[number, number]> = [
    [56, 224],
    [664, 320],
    [112, 1080],
    [608, 1120],
    [360, 120]
  ];
  for (const [nx, ny] of nodes) {
    g.fillCircle(nx, ny, 11);
  }
  g.fillStyle(COLORS.cyan, 0.5);
  for (const [nx, ny] of nodes) {
    g.fillCircle(nx, ny, 4);
  }

  // Soft top glow band.
  g.fillGradientStyle(0x0ea5e9, 0x0ea5e9, 0x0ea5e9, 0x0ea5e9, 0.1, 0.1, 0, 0);
  g.fillRect(0, 0, GAME_WIDTH, 200);
}

/** Glassmorphism-style rounded panel. */
export function drawGlassPanel(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  radius = 24,
  fillAlpha = 0.72,
  borderAlpha = 0.9
): void {
  g.fillStyle(COLORS.glassFill, fillAlpha);
  g.fillRoundedRect(x, y, w, h, radius);
  // Subtle top highlight for the glass effect.
  g.fillStyle(0xffffff, 0.05);
  g.fillRoundedRect(x + 2, y + 2, w - 4, h * 0.42, {
    tl: radius - 2,
    tr: radius - 2,
    bl: 8,
    br: 8
  });
  g.lineStyle(2, COLORS.glassBorder, borderAlpha);
  g.strokeRoundedRect(x, y, w, h, radius);
  // Neon top edge accent.
  g.lineStyle(3, COLORS.cyan, 0.55);
  g.lineBetween(x + radius, y + 1, x + w - radius, y + 1);
}

export interface ToastOptions {
  y?: number;
  durationMs?: number;
}

const activeToasts: Phaser.GameObjects.Container[] = [];

/** Small floating feedback pill. Never punishes — just informs. */
export function showToast(scene: Phaser.Scene, message: string, opts: ToastOptions = {}): void {
  const y = opts.y ?? GAME_HEIGHT - 320;
  const durationMs = opts.durationMs ?? 1800;

  // Keep max 1 toast so taps don't stack pills.
  for (const t of activeToasts) {
    t.destroy(true);
  }
  activeToasts.length = 0;

  const paddingX = 28;
  const label = scene.add
    .text(0, 0, message, {
      fontFamily: FONT_FAMILY,
      fontSize: '27px',
      color: '#eaf6ff',
      align: 'center',
      wordWrap: { width: 560 }
    })
    .setOrigin(0.5);

  const w = Math.min(620, label.width + paddingX * 2);
  const h = label.height + 32;
  const g = scene.add.graphics();
  g.fillStyle(0x0b1a33, 0.95);
  g.fillRoundedRect(-w / 2, -h / 2, w, h, 20);
  g.lineStyle(2, COLORS.cyan, 0.7);
  g.strokeRoundedRect(-w / 2, -h / 2, w, h, 20);

  const c = scene.add.container(GAME_WIDTH / 2, y, [g, label]).setDepth(200).setAlpha(0);
  activeToasts.push(c);

  scene.tweens.add({
    targets: c,
    alpha: 1,
    y: y - 12,
    duration: 220,
    ease: 'Sine.easeOut',
    onComplete: () => {
      scene.time.delayedCall(durationMs, () => {
        scene.tweens.add({
          targets: c,
          alpha: 0,
          y: y - 28,
          duration: 260,
          ease: 'Sine.easeIn',
          onComplete: () => {
            const idx = activeToasts.indexOf(c);
            if (idx >= 0) activeToasts.splice(idx, 1);
            c.destroy(true);
          }
        });
      });
    }
  });
}

/** "LEVEL 01" style label. */
export function formatLevelLabel(id: number): string {
  return `LEVEL ${String(id).padStart(2, '0')}`;
}

/** Draw a simple neon lightning bolt into a graphics object. */
export function drawBolt(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  size: number,
  color = COLORS.cyan,
  alpha = 1
): void {
  const s = size / 32;
  g.fillStyle(color, alpha);
  g.beginPath();
  g.moveTo(cx + 4 * s, cy - 16 * s);
  g.lineTo(cx - 8 * s, cy + 2 * s);
  g.lineTo(cx - 1 * s, cy + 2 * s);
  g.lineTo(cx - 4 * s, cy + 16 * s);
  g.lineTo(cx + 8 * s, cy - 4 * s);
  g.lineTo(cx + 1 * s, cy - 4 * s);
  g.closePath();
  g.fillPath();
}
