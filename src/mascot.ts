import Phaser from 'phaser';

// Pak Volt — maskot lab, digambar prosedural (tanpa aset eksternal).
// Badan baterai + toga sarjana. Mood: idle | happy | sad.

export type MascotMood = 'idle' | 'happy' | 'sad';

export interface Mascot {
  c: Phaser.GameObjects.Container;
  setMood: (m: MascotMood) => void;
}

const INK = 0x451a03;
const AMBER = 0xfbbf24;

function drawFace(g: Phaser.GameObjects.Graphics, mood: MascotMood): void {
  g.clear();
  if (mood === 'happy') {
    g.lineStyle(4, INK, 1);
    g.beginPath();
    g.arc(-18, -10, 9, Math.PI, 0, false);
    g.strokePath();
    g.beginPath();
    g.arc(18, -10, 9, Math.PI, 0, false);
    g.strokePath();
    g.lineStyle(5, INK, 1);
    g.beginPath();
    g.arc(0, 4, 14, 0.15 * Math.PI, 0.85 * Math.PI, false);
    g.strokePath();
  } else if (mood === 'sad') {
    g.fillStyle(0xffffff, 1);
    g.fillCircle(-18, -10, 10);
    g.fillCircle(18, -10, 10);
    g.fillStyle(INK, 1);
    g.fillCircle(-18, -6, 4);
    g.fillCircle(18, -6, 4);
    g.fillStyle(0x7dd3fc, 1);
    g.fillCircle(-27, 2, 3);
    g.lineStyle(4, INK, 1);
    g.beginPath();
    g.arc(0, 24, 11, 1.15 * Math.PI, 1.85 * Math.PI, false);
    g.strokePath();
  } else {
    g.fillStyle(0xffffff, 1);
    g.fillCircle(-18, -12, 11);
    g.fillCircle(18, -12, 11);
    g.fillStyle(INK, 1);
    g.fillCircle(-18, -12, 5);
    g.fillCircle(18, -12, 5);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(-16, -14, 1.6);
    g.fillCircle(20, -14, 1.6);
    g.lineStyle(4, INK, 1);
    g.beginPath();
    g.arc(0, 4, 12, 0.2 * Math.PI, 0.8 * Math.PI, false);
    g.strokePath();
  }
}

/** Maskot badan penuh (menu utama). Otomatis mengambang. */
export function drawMascot(
  scene: Phaser.Scene,
  x: number,
  y: number,
  s: number,
  mood: MascotMood = 'idle'
): Mascot {
  const body = scene.add.graphics();
  // kaki
  body.fillStyle(INK, 1);
  body.fillRoundedRect(-26, 52, 20, 16, 7);
  body.fillRoundedRect(6, 52, 20, 16, 7);
  // lengan (kanan melambai ke atas)
  body.lineStyle(9, INK, 1);
  body.lineBetween(-46, -2, -62, 18);
  body.lineBetween(46, -2, 62, -22);
  body.fillStyle(AMBER, 1);
  body.fillCircle(-62, 20, 7);
  body.fillCircle(62, -24, 7);
  // badan baterai
  body.fillStyle(AMBER, 1);
  body.fillRoundedRect(-45, -48, 90, 104, 26);
  body.lineStyle(4, INK, 1);
  body.strokeRoundedRect(-45, -48, 90, 104, 26);
  // kutub + petir di perut
  body.fillStyle(INK, 1);
  body.fillRoundedRect(-14, -58, 28, 12, 4);
  body.lineStyle(7, INK, 1);
  body.beginPath();
  body.moveTo(8, 4);
  body.lineTo(-8, 24);
  body.lineTo(0, 24);
  body.lineTo(-6, 44);
  body.strokePath();
  // pipi
  body.fillStyle(0xf472b6, 0.55);
  body.fillCircle(-30, 2, 7);
  body.fillCircle(30, 2, 7);
  // toga sarjana
  body.fillStyle(0x1e293b, 1);
  body.fillRoundedRect(-30, -66, 60, 14, 5);
  body.fillStyle(0x0f172a, 1);
  body.fillRoundedRect(-38, -84, 76, 16, 4);
  body.lineStyle(3, 0xfacc15, 1);
  body.lineBetween(30, -76, 30, -58);
  body.fillStyle(0xfacc15, 1);
  body.fillCircle(30, -54, 4);

  const face = scene.add.graphics();
  drawFace(face, mood);
  const c = scene.add.container(x, y, [body, face]);
  c.setScale(s);
  scene.tweens.add({
    targets: c,
    y: y - 10,
    duration: 1100,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  });
  return {
    c,
    setMood: (m: MascotMood) => drawFace(face, m),
  };
}

/** Kepala mini buat overlay menang. */
export function mascotBadge(
  scene: Phaser.Scene,
  x: number,
  y: number,
  s: number,
  mood: MascotMood = 'happy'
): Phaser.GameObjects.Container {
  const glow = scene.add.image(0, 0, 'fx-glow').setTint(0xfbbf24).setAlpha(0.4).setScale(s * 1.1);
  const head = scene.add.graphics();
  head.fillStyle(AMBER, 1);
  head.fillCircle(0, 0, 30);
  head.lineStyle(4, INK, 1);
  head.strokeCircle(0, 0, 30);
  head.fillStyle(0x1e293b, 1);
  head.fillRoundedRect(-22, -40, 44, 10, 4);
  head.fillStyle(0x0f172a, 1);
  head.fillRoundedRect(-27, -50, 54, 12, 3);
  const face = scene.add.graphics();
  drawFace(face, mood);
  const c = scene.add.container(x, y, [glow, head, face]);
  c.setScale(s);
  scene.tweens.add({
    targets: c,
    angle: 6,
    duration: 900,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  });
  return c;
}

const PRAISE = [
  'Kerja bagus, calon insinyur!',
  'Voltase otakmu naik!',
  'Pak Volt bangga padamu!',
  'Stabil kayak jembatan Wheatstone!',
  'Arus belajarmu deras!',
  'Jangan kasih kendor!',
];

export function pickPraise(): string {
  return PRAISE[Math.floor(Math.random() * PRAISE.length)];
}
