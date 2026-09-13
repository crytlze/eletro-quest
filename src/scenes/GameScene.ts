import Phaser from 'phaser';
import { LEVELS, LevelDef } from '../levels';
import { BranchInput, solveCircuit, SolveResult, fmt } from '../solver';
import { setStar, getStars, getSettings, sfxClick, sfxPower, sfxWin, sfxFail, sfxStar, sfxBoom, submitScore, speak, bindKeys } from '../util';
import { mascotBadge } from '../mascot';
import { ensureFxTextures, neonBackdrop, burst, pressable, buttonShadow, hazardStrip } from '../fx';
import { pal } from '../theme';

interface SlotState {
  defId: string;
  a: number;
  b: number;
  idx: number;
  btn: Phaser.GameObjects.Container;
  label: Phaser.GameObjects.Text;
}

export class GameScene extends Phaser.Scene {
  private levelId = 1;
  private lv!: LevelDef;
  private slots: SlotState[] = [];
  private gfx!: Phaser.GameObjects.Graphics;
  private lampGlow!: Phaser.GameObjects.Image;
  private lampCircle!: Phaser.GameObjects.Arc;
  private lampEmoji!: Phaser.GameObjects.Text;
  private readV!: Phaser.GameObjects.Text;
  private readI!: Phaser.GameObjects.Text;
  private readP!: Phaser.GameObjects.Text;
  private readT!: Phaser.GameObjects.Text;
  private readBgs: Phaser.GameObjects.Rectangle[] = [];
  private flowDots: Phaser.GameObjects.Image[] = [];
  private flowTweens: Phaser.Tweens.Tween[] = [];
  private msg!: Phaser.GameObjects.Text;
  private hintTx!: Phaser.GameObjects.Text;
  private lampLabel!: Phaser.GameObjects.Text;
  private nodeLabels: Phaser.GameObjects.Text[] = [];
  private hintOn = false;
  private attempts = 0;
  private lastResult: SolveResult | null = null;
  private winOpen = false;

  constructor() {
    super('Game');
  }

  init(data: { levelId?: number }): void {
    this.levelId = data.levelId ?? 1;
    const found = LEVELS.find((l) => l.id === this.levelId);
    this.lv = found ?? LEVELS[0];
    this.slots = [];
    this.readBgs = [];
    this.flowDots = [];
    this.flowTweens = [];
    this.nodeLabels = [];
    this.attempts = 0;
    this.lastResult = null;
    this.winOpen = false;
    this.hintOn = false;
  }

  create(): void {
    const W = 720;
    const P = pal();
    ensureFxTextures(this);
    neonBackdrop(this);

    // header
    const back = this.add.text(24, 24, '‹ MENU', { fontSize: '26px', color: P.accentTx, fontStyle: 'bold' })
      .setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => { sfxClick(); this.scene.start('Menu'); });
    this.add.text(W / 2, 28, `LEVEL ${this.lv.id} • ${this.lv.title.toUpperCase()}`, {
      fontSize: '24px', color: P.ink, fontStyle: 'bold',
      shadow: { offsetX: 0, offsetY: 0, color: '#22d3ee', blur: 10, fill: true },
    }).setOrigin(0.5, 0);
    this.add.text(W / 2, 58, this.lv.sub, { fontSize: '19px', color: P.dim }).setOrigin(0.5, 0);
    const div = this.add.graphics();
    div.lineStyle(6, 0x22d3ee, 0.12);
    div.lineBetween(48, 94, 672, 94);
    div.lineStyle(2, 0x22d3ee, 0.5);
    div.lineBetween(48, 94, 672, 94);

    // info card
    const card = this.add.rectangle(W / 2, 190, 672, 190, 0x0b1628).setOrigin(0.5);
    card.setStrokeStyle(2, 0x1e3a5f, 1);
    this.add.text(60, 112, this.lv.briefing, {
      fontSize: '20px', color: '#e2e8f0', lineSpacing: 5, wordWrap: { width: 600 },
    });
    this.add.text(60, 218, `Vs ${this.lv.vs}V   •   Fuse ${this.lv.fuse}A`, {
      fontSize: '20px', color: '#a5f3fc', fontStyle: 'bold',
    });
    this.add.text(60, 250, `${this.lv.targetLabel}`, {
      fontSize: '20px', color: P.warn, fontStyle: 'bold', wordWrap: { width: 600 },
    });

    // circuit area
    const area = this.add.rectangle(W / 2, 545, 672, 420, 0x070d1d, 0.88).setOrigin(0.5);
    area.setStrokeStyle(2, 0x22d3ee, 0.8);
    this.gfx = this.add.graphics();
    this.lampGlow = this.add.image(0, 0, 'fx-glow').setTint(0xfacc15).setAlpha(0).setDepth(1).setScale(1.4);
    this.lampCircle = this.add.circle(0, 0, 34, 0x111827, 1).setDepth(2);
    this.lampCircle.setStrokeStyle(3, 0xfacc15, 1);
    this.lampEmoji = this.add.text(0, 0, '○', { fontSize: '36px' }).setOrigin(0.5).setDepth(3);

    this.buildCircuitObjects();

    // readout
    const labels = ['V LAMPU', 'I LAMPU', 'P LAMPU', 'I TOTAL'];
    this.readBgs = [];
    for (let i = 0; i < 4; i++) {
      const x = 60 + i * 162 + 75;
      const bg = this.add.rectangle(x, 830, 150, 92, 0x0b1628, 0.92).setOrigin(0.5);
      bg.setStrokeStyle(2, 0x1e3a5f, 1);
      this.readBgs.push(bg);
      this.add.text(x, 796, labels[i], { fontSize: '18px', color: '#64748b', fontStyle: 'bold' }).setOrigin(0.5);
    }
    this.readV = this.add.text(135, 838, '—', { fontSize: '26px', color: '#f8fafc', fontStyle: 'bold' }).setOrigin(0.5);
    this.readI = this.add.text(297, 838, '—', { fontSize: '26px', color: '#f8fafc', fontStyle: 'bold' }).setOrigin(0.5);
    this.readP = this.add.text(459, 838, '—', { fontSize: '26px', color: '#f8fafc', fontStyle: 'bold' }).setOrigin(0.5);
    this.readT = this.add.text(621, 838, '—', { fontSize: '26px', color: '#f8fafc', fontStyle: 'bold' }).setOrigin(0.5);

    this.msg = this.add.text(W / 2, 895, 'Ketuk kotak oranye, lalu tekan POWER', {
      fontSize: '21px', color: P.accentTx, align: 'center', wordWrap: { width: 640 },
    }).setOrigin(0.5, 0);

    // POWER
    buttonShadow(this, W / 2, 1000, 672, 88);
    const pwBg = this.add.rectangle(0, 0, 672, 88, 0x22d3ee).setOrigin(0.5);
    pwBg.setStrokeStyle(3, 0xa5f3fc, 1);
    const pwTx = this.add.text(0, 0, 'POWER', { fontSize: '34px', color: '#04121a', fontStyle: 'bold', fontFamily: "'Chakra Petch', sans-serif" }).setOrigin(0.5);
    const pw = this.add.container(W / 2, 1000, [pwBg, pwTx]);
    hazardStrip(this, W / 2, 948, 672);
    const pwZone = this.add.zone(W / 2, 1000, 672, 88).setInteractive({ useHandCursor: true });
    pressable(this, pwZone, pw);
    pwZone.on('pointerdown', () => this.onPower());
    pwZone.on('pointerover', () => pwBg.setFillStyle(0x67e8f9));
    pwZone.on('pointerout', () => pwBg.setFillStyle(0x22d3ee));

    // row kecil
    this.smallBtn(60, 1072, 216, 60, 'ⓘ HINT', () => {
      this.toggleHint();
    });
    this.smallBtn(288, 1072, 216, 60, '↺ RESET', () => {
      sfxClick();
      this.resetSlots();
    });
    this.smallBtn(516, 1072, 144, 60, '⏭', () => {
      sfxClick();
      this.gotoLevel(this.levelId % LEVELS.length + 1);
    });

    this.hintTx = this.add.text(W / 2, 1150, `ⓘ ${this.lv.hint}\n${this.lv.rumus}`, {
      fontSize: '20px', color: '#fde68a', align: 'center', lineSpacing: 6,
      wordWrap: { width: 640 }, backgroundColor: '#1c1408', padding: { x: 12, y: 10 },
    }).setOrigin(0.5, 0).setVisible(false);

    bindKeys(this, {
      ENTER: () => this.onPower(),
      P: () => this.onPower(),
      H: () => this.toggleHint(),
      R: () => {
        sfxClick();
        this.resetSlots();
      },
      ESC: () => {
        sfxClick();
        this.scene.start('Menu');
      },
    });

    this.redraw();
  }

  private toggleHint(): void {
    sfxClick();
    this.hintOn = !this.hintOn;
    this.hintTx.setVisible(this.hintOn);
  }

  private smallBtn(x: number, y: number, w: number, h: number, label: string, cb: () => void): void {
    const cx = x + w / 2;
    const cy = y + h / 2;
    const bg = this.add.rectangle(cx, cy, w, h, 0x0f2a3d).setOrigin(0.5);
    bg.setStrokeStyle(2, 0x334155, 1);
    this.add.text(cx, cy, label, { fontSize: '22px', color: '#e2e8f0', fontStyle: 'bold' }).setOrigin(0.5);
    const z = this.add.zone(cx, cy, w, 88).setInteractive({ useHandCursor: true });
    z.on('pointerdown', cb);
    z.on('pointerover', () => bg.setFillStyle(0x164e63));
    z.on('pointerout', () => bg.setFillStyle(0x0f2a3d));
  }

  private nodeXY(n: number): { x: number; y: number } {
    const p = this.lv.nodePos[n] ?? { x: 50, y: 50 };
    return { x: 48 + (p.x / 100) * 624, y: 335 + (p.y / 100) * 420 };
  }

  private buildCircuitObjects(): void {
    // bersihkan sisa (saat restart scene otomatis bersih, tapi aman)
    for (const s of this.slots) s.btn.destroy(true);
    this.slots = [];
    for (const t of this.nodeLabels) t.destroy();
    this.nodeLabels = [];
    if (this.lampLabel) this.lampLabel.destroy();

    // label node statis
    for (let n = 0; n < this.lv.numNodes; n++) {
      const p = this.nodeXY(n);
      const tag = n === 1 ? `+${this.lv.vs}V` : n === 0 ? 'GND' : `N${n}`;
      const tx = this.add
        .text(p.x, p.y - 30, tag, {
          fontSize: '18px',
          color: n === 1 ? '#fca5a5' : '#94a3b8',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setDepth(4);
      this.nodeLabels.push(tx);
    }
    const lampDef = this.lv.fixed.find((f) => f.isLamp);
    this.lampLabel = this.add
      .text(0, 0, lampDef ? lampDef.label : 'Lampu', { fontSize: '19px', color: '#fde68a', fontStyle: 'bold' })
      .setOrigin(0.5)
      .setDepth(5);

    // hitung offset untuk cabang paralel yang berbagi pasangan node sama
    const pairCount = new Map<string, number>();
    const keyOf = (a: number, b: number): string => `${Math.min(a, b)}-${Math.max(a, b)}`;
    const fixedKeys = this.lv.fixed.map((f) => keyOf(f.a, f.b));
    const slotKeys = this.lv.slots.map((s) => keyOf(s.a, s.b));
    [...fixedKeys, ...slotKeys].forEach((k) => pairCount.set(k, (pairCount.get(k) || 0) + 1));
    const seen = new Map<string, number>();
    const takeOffset = (k: string): number => {
      const total = pairCount.get(k) || 1;
      const i = seen.get(k) || 0;
      seen.set(k, i + 1);
      if (total === 1) return 0;
      return (i - (total - 1) / 2) * 46;
    };

    // fixed branches (non-lamp) sebagai label statis
    this.lv.fixed.forEach((f) => {
      if (f.isLamp) return;
      const A = this.nodeXY(f.a);
      const B = this.nodeXY(f.b);
      const mx = (A.x + B.x) / 2 + takeOffset(keyOf(f.a, f.b));
      const my = (A.y + B.y) / 2;
      const bg = this.add.rectangle(mx, my, 120, 52, 0x1e293b).setOrigin(0.5).setDepth(4);
      bg.setStrokeStyle(2, 0x475569, 1);
      this.add.text(mx, my, f.label, { fontSize: '19px', color: '#e2e8f0', fontStyle: 'bold' }).setOrigin(0.5).setDepth(5);
    });

    // slots: tombol oranye
    this.lv.slots.forEach((s) => {
      const A = this.nodeXY(s.a);
      const B = this.nodeXY(s.b);
      const off = takeOffset(keyOf(s.a, s.b));
      const mx = (A.x + B.x) / 2 + off;
      const my = (A.y + B.y) / 2;
      const opt = s.options[s.def];
      const glow = this.add.rectangle(0, 0, 164, 80, 0xf59e0b, 0.22).setDepth(3);
      const bg = this.add.rectangle(0, 0, 150, 66, 0xf59e0b).setOrigin(0.5).setDepth(4);
      bg.setStrokeStyle(3, 0xfde68a, 1);
      const label = this.add.text(0, -10, `${s.id}: ${opt.label}`, {
        fontSize: '22px', color: '#451a03', fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(5);
      const sub = this.add.text(0, 14, 'ketuk ⇅', { fontSize: '18px', color: '#78350f' }).setOrigin(0.5).setDepth(5);
      const btn = this.add.container(mx, my, [glow, bg, label, sub]);
      const zone = this.add.zone(mx, my, 164, 88).setInteractive({ useHandCursor: true });
      const st: SlotState = { defId: s.id, a: s.a, b: s.b, idx: s.def, btn, label };
      pressable(this, zone, btn);
      zone.on('pointerdown', () => {
        if (this.winOpen) return;
        const def = this.lv.slots.find((d) => d.id === st.defId)!;
        st.idx = (st.idx + 1) % def.options.length;
        const o = def.options[st.idx];
        st.label.setText(`${st.defId}: ${o.label}`);
        sfxClick();
        this.lastResult = null;
        this.clearReadout();
        this.redraw();
      });
      this.slots.push(st);
    });
  }

  private branches(): BranchInput[] {
    const out: BranchInput[] = [];
    for (const f of this.lv.fixed) out.push({ a: f.a, b: f.b, r: f.r, label: f.label, isLamp: f.isLamp });
    for (const st of this.slots) {
      const def = this.lv.slots.find((d) => d.id === st.defId)!;
      const o = def.options[st.idx];
      out.push({ a: st.a, b: st.b, r: o.r, label: `${st.defId}:${o.label}` });
    }
    return out;
  }

  private clearReadout(): void {
    this.readV.setText('—');
    this.readI.setText('—');
    this.readP.setText('—');
    this.readT.setText('—');
    this.msg.setText('Ketuk kotak oranye, lalu tekan POWER').setColor(pal().accentTx);
    this.tweens.killTweensOf(this.lampGlow);
    this.lampGlow.setAlpha(0);
    this.lampEmoji.setText('○');
    this.clearFlow();
    for (const bg of this.readBgs) bg.setStrokeStyle(2, 0x1e3a5f, 1);
  }

  private clearFlow(): void {
    for (const tw of this.flowTweens) tw.stop();
    this.flowTweens = [];
    for (const d of this.flowDots) d.destroy();
    this.flowDots = [];
  }

  private spawnFlow(ax: number, ay: number, bx: number, by: number, tint: number, speed: number): void {
    const dist = Math.hypot(bx - ax, by - ay);
    const dur = Phaser.Math.Clamp((dist / Math.max(speed, 1)) * 900, 300, 1300);
    for (let k = 0; k < 3; k++) {
      const d = this.add.image(ax, ay, 'fx-dot').setDepth(3).setTint(tint).setScale(0.75).setAlpha(0.95);
      const halo = this.add.image(ax, ay, 'fx-glow').setDepth(3).setTint(tint).setScale(0.35).setAlpha(0.5);
      this.flowDots.push(d, halo);
      const proxy = { t: 0 };
      const tw = this.tweens.add({
        targets: proxy,
        t: 1,
        duration: dur,
        repeat: -1,
        delay: (dur / 3) * k,
        onUpdate: () => {
          if (!d.active) return;
          const x = ax + (bx - ax) * proxy.t;
          const y = ay + (by - ay) * proxy.t;
          d.setPosition(x, y);
          if (halo.active) halo.setPosition(x, y);
        },
      });
      this.flowTweens.push(tw);
    }
  }

  private resetSlots(): void {
    this.lv.slots.forEach((d, i) => {
      const st = this.slots[i];
      if (!st) return;
      st.idx = d.def;
      st.label.setText(`${st.defId}: ${d.options[st.idx].label}`);
    });
    this.lastResult = null;
    this.clearReadout();
    this.redraw();
  }

  private onPower(): void {
    if (this.winOpen) return;
    sfxPower();
    this.attempts += 1;
    this.clearFlow();
    this.tweens.killTweensOf(this.lampGlow);
    const res = solveCircuit(this.lv.vs, this.lv.numNodes, this.branches(), this.lv.fuse);
    this.lastResult = res;

    this.readV.setText(`${fmt(res.lampV)} V`);
    this.readI.setText(`${fmt(res.lampI)} A`);
    this.readP.setText(`${fmt(res.lampP)} W`);
    this.readT.setText(`${fmt(res.totalI)} A`);

    // glow lampu ∝ daya + denyut hidup
    const bright = Phaser.Math.Clamp(res.lampP / 6, 0, 1);
    const baseAlpha = res.blown ? 0 : 0.12 + bright * 0.65;
    this.lampGlow.setAlpha(baseAlpha);
    this.lampGlow.setScale(1.0 + bright * 1.5);
    if (!res.blown && res.lampI >= 0.005) {
      this.tweens.add({
        targets: this.lampGlow,
        alpha: Math.max(0.1, baseAlpha * 0.82),
        duration: 420,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
    this.lampEmoji.setText(res.blown ? '×' : res.lampI < 0.005 ? '○' : '●');

    // titik arus mengalir di tiap cabang berarus
    const branches = this.branches();
    branches.forEach((b, i) => {
      const r = b.r;
      if (!isFinite(r) || r > 1e8) return;
      const I = Math.abs(res.branchI[i]);
      if (I < 0.03) return;
      const A = this.nodeXY(b.a);
      const B = this.nodeXY(b.b);
      const dir = res.branchI[i] >= 0 ? 1 : -1;
      const ax = dir >= 0 ? A.x : B.x;
      const ay = dir >= 0 ? A.y : B.y;
      const bx = dir >= 0 ? B.x : A.x;
      const by = dir >= 0 ? B.y : A.y;
      this.spawnFlow(ax, ay, bx, by, res.blown ? 0xf87171 : 0x67e8f9, 120 + I * 260);
    });
    for (const bg of this.readBgs) bg.setStrokeStyle(2, res.blown ? 0xef4444 : 0x22d3ee, 1);
    this.redraw();

    if (res.blown) {
      sfxFail();
      sfxBoom();
      if (getSettings().shake) this.cameras.main.shake(280, 0.016);
      const bp = this.nodeXY(1);
      burst(this, bp.x, bp.y, { colors: [0xef4444, 0xf59e0b, 0xfacc15, 0xffffff], count: 30 });
      this.msg.setText(`× FUSE PUTUS! I total ${fmt(res.totalI)}A > ${this.lv.fuse}A. Ada korslet — jangan pilih Kabel di paralel!`).setColor(pal().bad);
      return;
    }
    if (res.lampI < 0.005) {
      sfxFail();
      this.msg.setText('○ Rangkaian TERBUKA — lampu mati (0 A). Ganti opsi "Putus" jadi resistor/kabel.').setColor(pal().warn);
      return;
    }
    const ok = this.lv.check({ lampV: res.lampV, lampI: res.lampI, lampP: res.lampP, totalI: res.totalI });
    if (ok) {
      this.onWin(res);
    } else {
      sfxFail();
      const dim = res.lampP < 1.5;
      this.msg.setText(
        dim
          ? `▼ Belum pas: lampu REDUP (V=${fmt(res.lampV)}V I=${fmt(res.lampI)}A). Kecilkan R seri / besarkan R paralel. Target: ${this.lv.targetLabel}`
          : `▲ Belum pas: V=${fmt(res.lampV)}V I=${fmt(res.lampI)}A P=${fmt(res.lampP)}W. Cek target & coba nilai lain. Target: ${this.lv.targetLabel}`
      ).setColor(pal().warn);
    }
  }

  private onWin(res: SolveResult): void {
    sfxWin();
    sfxStar();
    speak('Hasil tepat! ' + this.lv.prinsip + ' ' + this.lv.bedah.join(' '));
    this.winOpen = true;
    this.cameras.main.flash(250, 180, 255, 200);
    burst(this, 200, 380, { colors: [0x22d3ee, 0xfacc15, 0xf472b6, 0xffffff], count: 36, distMin: 80, distMax: 300 });
    burst(this, 520, 380, { colors: [0x4ade80, 0x22d3ee, 0xfacc15, 0xffffff], count: 36, distMin: 80, distMax: 300 });
    const stars = getStars('tde');
    const prev = stars[this.lv.id] || 0;
    const earned = this.attempts <= 1 ? 3 : this.attempts <= 3 ? 2 : 1;
    setStar('tde', this.lv.id, earned);
    submitScore('tde', this.lv.id, earned);

    const W = 720;
    const dim = this.add.rectangle(W / 2, 640, 720, 1280, 0x000000, 0.72).setDepth(20);
    const panel = this.add.rectangle(W / 2, 630, 600, 760, 0x0b1628).setDepth(21);
    panel.setStrokeStyle(3, 0x22d3ee, 1);
    mascotBadge(this, 598, 258, 0.8, 'happy').setDepth(24);
    const d = this.add.container(0, 0).setDepth(22);
    const t1 = this.add.text(W / 2, 322, '★ RANGKAIAN BENAR!', { fontSize: '32px', color: '#4ade80', fontStyle: 'bold' }).setOrigin(0.5);
    const t2 = this.add.text(W / 2, 366, '★'.repeat(earned) + '☆'.repeat(3 - earned), { fontSize: '40px', color: '#facc15' }).setOrigin(0.5);
    const t3 = this.add.text(W / 2, 410,
      `V=${fmt(res.lampV)}V  I=${fmt(res.lampI)}A  P=${fmt(res.lampP)}W • ${this.attempts}× POWER` +
      (prev > earned ? ` (terbaik: ${prev}★)` : ''),
      { fontSize: '20px', color: '#e2e8f0', align: 'center' }).setOrigin(0.5);
    const ph = this.add.text(W / 2, 452, 'PRINSIP', { fontSize: '21px', color: '#facc15', fontStyle: 'bold' }).setOrigin(0.5);
    const pb = this.add.text(W / 2, 474, this.lv.prinsip, {
      fontSize: '19px', color: '#e2e8f0', align: 'center', wordWrap: { width: 520 }, lineSpacing: 4,
    }).setOrigin(0.5, 0);
    const bh = this.add.text(W / 2, 548, 'BEDAH SOAL', { fontSize: '21px', color: '#67e8f9', fontStyle: 'bold' }).setOrigin(0.5);
    d.add([t1, t2, t3, ph, pb, bh]);
    // langkah bedah muncul satu-satu (pop animasi)
    this.lv.bedah.slice(0, 4).forEach((step, i) => {
      const st = this.add.text(110, 578 + i * 32, `${i + 1}. ${step}`, {
        fontSize: '19px', color: '#cbd5e1', wordWrap: { width: 500 },
      }).setOrigin(0, 0).setAlpha(0);
      d.add(st);
      this.tweens.add({
        targets: st,
        alpha: 1,
        x: 118,
        duration: 260,
        delay: 250 + i * 230,
        ease: 'Cubic.easeOut',
      });
    });

    const mkBtn = (y: number, label: string, bgc: number, cb: () => void): void => {
      const bg = this.add.rectangle(W / 2, y, 440, 68, bgc).setOrigin(0.5);
      bg.setStrokeStyle(2, 0xa5f3fc, 1);
      const tx = this.add.text(W / 2, y, label, { fontSize: '25px', color: bgc === 0x22d3ee ? '#04121a' : '#e2e8f0', fontStyle: 'bold' }).setOrigin(0.5);
      const z = this.add.zone(W / 2, y, 440, 68).setInteractive({ useHandCursor: true }).setDepth(23);
      d.add([bg, tx]);
      z.on('pointerdown', cb);
    };
    const isLast = this.lv.id >= LEVELS.length;
    mkBtn(796, isLast ? '★ SELESAI — KE MENU' : '▶ LEVEL BERIKUTNYA', 0x22d3ee, () => {
      sfxClick();
      if (isLast) this.scene.start('Menu');
      else this.gotoLevel(this.lv.id + 1);
    });
    mkBtn(884, '↺ ULANGI LEVEL', 0x0f2a3d, () => {
      sfxClick();
      dim.destroy(); d.destroy(true);
      this.gotoLevel(this.lv.id);
    });
    mkBtn(972, '≡ MENU', 0x0f2a3d, () => {
      sfxClick();
      this.scene.start('Menu');
    });
  }

  private gotoLevel(id: number): void {
    this.scene.restart({ levelId: id });
  }

  private redraw(): void {
    const g = this.gfx;
    g.clear();

    // node dots (+ simbol ground di node 0)
    for (let n = 0; n < this.lv.numNodes; n++) {
      const p = this.nodeXY(n);
      const col = n === 1 ? 0xef4444 : n === 0 ? 0x64748b : 0x22d3ee;
      if (n === 0) {
        g.lineStyle(4, 0x94a3b8, 1);
        g.lineBetween(p.x - 18, p.y + 14, p.x + 18, p.y + 14);
        g.lineBetween(p.x - 12, p.y + 22, p.x + 12, p.y + 22);
        g.lineBetween(p.x - 5, p.y + 30, p.x + 5, p.y + 30);
      }
      g.fillStyle(0x22d3ee, 0.25);
      g.fillCircle(p.x, p.y, 15);
      g.fillStyle(col, 1);
      g.fillCircle(p.x, p.y, 10);
      g.lineStyle(2, 0x0b1628, 1);
      g.strokeCircle(p.x, p.y, 10);
    }

    const res = this.lastResult;
    const branches = this.branches();

    // grup offset paralel (samakan dengan buildCircuitObjects)
    const keyOf = (a: number, b: number): string => `${Math.min(a, b)}-${Math.max(a, b)}`;
    const pairCount = new Map<string, number>();
    branches.forEach((b) => {
      const k = keyOf(b.a, b.b);
      pairCount.set(k, (pairCount.get(k) || 0) + 1);
    });
    const seen = new Map<string, number>();
    const offOf = (a: number, b: number): number => {
      const k = keyOf(a, b);
      const total = pairCount.get(k) || 1;
      const i = seen.get(k) || 0;
      seen.set(k, i + 1);
      if (total === 1) return 0;
      return (i - (total - 1) / 2) * 46;
    };

    branches.forEach((b, i) => {
      const A = this.nodeXY(b.a);
      const B = this.nodeXY(b.b);
      const isOpen = !isFinite(b.r) || b.r > 1e8;
      offOf(b.a, b.b);
      let col = 0x475569;
      let w = 4;
      if (res && !isOpen) {
        const I = Math.abs(res.branchI[i]);
        if (res.blown) { col = 0xef4444; w = 6; }
        else if (I > 0.05) { col = 0x22d3ee; w = 5; }
        else { col = 0x334155; w = 4; }
      }
      if (isOpen) {
        // garis putus-putus: celah di tengah
        g.lineStyle(3, 0x475569, 0.7);
        g.lineBetween(A.x, A.y, (A.x + B.x) / 2 - 40, (A.y + B.y) / 2);
        g.lineBetween((A.x + B.x) / 2 + 40, (A.y + B.y) / 2, B.x, B.y);
        g.fillStyle(0xef4444, 1);
        g.fillCircle((A.x + B.x) / 2 - 40, (A.y + B.y) / 2, 4);
        g.fillCircle((A.x + B.x) / 2 + 40, (A.y + B.y) / 2, 4);
      } else {
        // kabel neon: lapis glow + inti terang
        g.lineStyle(w + 5, col, 0.22);
        g.lineBetween(A.x, A.y, B.x, B.y);
        g.lineStyle(w, res && Math.abs(res.branchI[i]) > 0.05 && !res.blown ? 0xd9faff : col, 1);
        g.lineBetween(A.x, A.y, B.x, B.y);
      }
    });

    // posisi lampu
    const lamp = this.lv.fixed.find((f) => f.isLamp);
    if (lamp) {
      const A = this.nodeXY(lamp.a);
      const B = this.nodeXY(lamp.b);
      const mx = (A.x + B.x) / 2;
      const my = (A.y + B.y) / 2;
      this.lampGlow.setPosition(mx, my);
      this.lampCircle.setPosition(mx, my);
      this.lampEmoji.setPosition(mx, my - 2);
      this.lampLabel.setPosition(mx, my + 46);
    }
  }
}
