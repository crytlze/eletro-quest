import Phaser from 'phaser';
import { pal } from './theme';
import { stopVoice } from './voice';

// Helper visual prosedural — tanpa aset gambar eksternal.
// Semua tekstur digambar saat runtime (lingkaran, glow radial).

/** Bikin tekstur fx-dot & fx-glow sekali per scene (aman dipanggil ulang). */
export function ensureFxTextures(scene: Phaser.Scene): void {
  const tex = scene.textures;
  if (!tex.exists('fx-dot')) {
    const g = scene.make.graphics({}, false);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(8, 8, 7);
    g.generateTexture('fx-dot', 16, 16);
    g.destroy();
  }
  if (!tex.exists('fx-glow')) {    const S = 128;
    const t = tex.createCanvas('fx-glow', S, S);
    if (t) {
      const ctx = t.context;
      const grad = ctx.createRadialGradient(S / 2, S / 2, 2, S / 2, S / 2, S / 2);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(0.4, 'rgba(255,255,255,0.35)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, S, S);
      t.refresh();
    }
  }
  if (!tex.exists('hazard')) {
    // strip kuning-hitam gaya peralatan lab
    const g = scene.make.graphics({}, false);
    g.fillStyle(0x141414, 1);
    g.fillRect(0, 0, 64, 16);
    g.fillStyle(0xfbbf24, 1);
    for (let x = -32; x < 64; x += 32) {
      g.fillTriangle(x, 16, x + 16, 16, x + 16, 0);
      g.fillTriangle(x, 16, x + 16, 0, x + 32, 0);
    }
    g.generateTexture('hazard', 64, 16);
    g.destroy();
  }
}

/** Strip hazard di atas tombol aksi. */
export function hazardStrip(scene: Phaser.Scene, x: number, y: number, w: number): Phaser.GameObjects.Image {
  return scene.add.image(x, y, 'hazard').setDisplaySize(w, 14).setOrigin(0.5);
}

function reducedMotion(): boolean {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
}

/** Background: gradasi + grid + partikel melayang (ikut tema). */
export function neonBackdrop(scene: Phaser.Scene): void {
  const W = 720;
  const H = 1280;
  const P = pal();
  stopVoice();
  const g = scene.add.graphics().setDepth(-10);
  g.fillGradientStyle(P.bgTop, P.bgTop, P.bgBot, P.bgBot, 0.95);
  g.fillRect(0, 0, W, H);
  g.lineStyle(1, P.grid, P.gridAlpha);
  for (let x = 24; x <= W; x += 48) g.lineBetween(x, 0, x, H);
  for (let y = 24; y <= H; y += 48) g.lineBetween(0, y, W, y);
  // garis mayor blueprint
  g.lineStyle(2, P.grid, Math.min(1, P.gridAlpha + 0.14));
  for (let x = 24; x <= W; x += 240) g.lineBetween(x, 0, x, H);
  for (let y = 24; y <= H; y += 240) g.lineBetween(0, y, W, y);

  for (let i = 0; i < P.dots; i++) {
    const x = Phaser.Math.Between(0, W);
    const y = Phaser.Math.Between(0, H);
    const d = scene.add
      .image(x, y, 'fx-dot')
      .setDepth(-9)
      .setTint(P.dot)
      .setAlpha(Phaser.Math.FloatBetween(0.08, 0.28))
      .setScale(Phaser.Math.FloatBetween(0.3, 0.9));
    if (reducedMotion()) continue;
    scene.tweens.add({
      targets: d,
      y: y - Phaser.Math.Between(120, 300),
      duration: Phaser.Math.Between(4000, 9000),
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: Phaser.Math.Between(0, 4000),
    });
  }
}

/** Garis arus horizontal + titik arus yang jalan terus. */
export function currentLine(scene: Phaser.Scene, x1: number, x2: number, y: number): void {
  const P = pal();
  const g = scene.add.graphics().setDepth(-8);
  g.lineStyle(7, P.line, 0.14);
  g.lineBetween(x1, y, x2, y);
  g.lineStyle(2, P.line, 0.55);
  g.lineBetween(x1, y, x2, y);
  const dot = scene.add.image(x1, y, 'fx-dot').setDepth(-7).setTint(P.line).setScale(0.8);
  const glow = scene.add.image(x1, y, 'fx-glow').setDepth(-7).setTint(P.line).setScale(0.5).setAlpha(0.5);
  if (reducedMotion()) { dot.setPosition((x1 + x2) / 2, y); glow.setPosition((x1 + x2) / 2, y); return; }
  const proxy = { t: 0 };
  scene.tweens.add({
    targets: proxy,
    t: 1,
    duration: 2200,
    repeat: -1,
    ease: 'Sine.easeInOut',
    onUpdate: () => {
      const x = x1 + (x2 - x1) * proxy.t;
      dot.setPosition(x, y);
      glow.setPosition(x, y);
    },
  });
}

export interface BurstOpts {
  colors?: number[];
  count?: number;
  distMin?: number;
  distMax?: number;
  durMin?: number;
  durMax?: number;
  depth?: number;
  rise?: number; // tambahan gerak ke bawah (gravitasi), default 0.25*dist
}

/** Ledakan partikel radial ( sparks / confetti ). Sekali tembak, bersih sendiri. */
export function burst(scene: Phaser.Scene, x: number, y: number, opts: BurstOpts = {}): void {
  const colors = opts.colors ?? [0xef4444, 0xf59e0b, 0xfacc15, 0xffffff];
  const count = opts.count ?? 24;
  const dMin = opts.distMin ?? 60;
  const dMax = opts.distMax ?? 220;
  for (let i = 0; i < count; i++) {
    const s = scene.add
      .image(x, y, 'fx-dot')
      .setTint(Phaser.Math.RND.pick(colors))
      .setScale(Phaser.Math.FloatBetween(0.4, 1.1))
      .setDepth(opts.depth ?? 30)
      .setAlpha(1);
    const ang = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const dist = Phaser.Math.Between(dMin, dMax);
    const rise = opts.rise ?? dist * 0.25;
    scene.tweens.add({
      targets: s,
      x: x + Math.cos(ang) * dist,
      y: y + Math.sin(ang) * dist + rise,
      alpha: 0,
      scale: 0.05,
      duration: Phaser.Math.Between(opts.durMin ?? 450, opts.durMax ?? 900),
      ease: 'Cubic.easeOut',
      onComplete: () => s.destroy(),
    });
  }
}

/** Efek tekan (squash sesaat + balik memantul) untuk tombol container. */
export function pressable(scene: Phaser.Scene, target: Phaser.GameObjects.GameObject, body: Phaser.GameObjects.Container): void {
  target.on('pointerdown', () => {
    if (reducedMotion()) { body.setAlpha(0.88); scene.time.delayedCall(100, () => body.setAlpha(1)); return; }
    scene.tweens.killTweensOf(body);
    body.setScale(0.94);
    scene.tweens.add({ targets: body, scale: 1, duration: 180, ease: 'Back.easeOut' });
  });
}

/** Bayangan + glow di belakang tombol. Kembalikan agar ikut container bila perlu. */
export function buttonShadow(scene: Phaser.Scene, x: number, y: number, w: number, h: number, glowColor = 0x22d3ee): void {
  scene.add.rectangle(x, y + 7, w, h, 0x000000, 0.45).setOrigin(0.5).setDepth(-2);
  scene.add.image(x, y, 'fx-glow').setTint(glowColor).setAlpha(0.28).setDepth(-1)
    .setScale(w / 128, h / 128);
}
