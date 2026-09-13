import Phaser from 'phaser';
import { getSettings, setSettings, clearStars, sfxClick, beep, bindKeys, playerName, getSession, logoutSession, submitReview, reviewStats, flushReviews, weakCount } from '../util';
import { showAuthOverlay } from '../auth';
import { ensureFxTextures, neonBackdrop, currentLine, pressable, burst } from '../fx';
import { pal, getTheme, setTheme, nextTheme, THEME_ORDER } from '../theme';
import { ensureMusic, setMusicEnabled } from '../music';
import { drawMascot, pickPraise } from '../mascot';

// Profil creator — tampil di layar "Tentang Creator".
const CREATOR = {
  avatar: 'MS',
  name: 'Muhammad Sufi Aulia',
  role: 'Pakar AI & Data Analis',
  identity: 'Kreator Eletro Quest',
  quote: '"Belajar elektro paling asik sambil main."',
};

export class MainMenuScene extends Phaser.Scene {
  private modalObjs: Phaser.GameObjects.GameObject[] = [];
  private resetArmed = false;

  constructor() {
    super('MainMenu');
  }

  create(): void {
    const W = 720;
    const P = pal();
    ensureFxTextures(this);
    neonBackdrop(this);
    ensureMusic();
    this.modalObjs = [];
    this.resetArmed = false;

    // lencana petir digambar manual (bukan emoji)
    this.add.image(W / 2, 48, 'fx-glow').setTint(0xf59e0b).setAlpha(0.35).setScale(0.9);
    const badge = this.add.graphics();
    badge.fillStyle(0xfbbf24, 1);
    badge.fillCircle(W / 2, 48, 30);
    badge.lineStyle(3, 0x92400e, 1);
    badge.strokeCircle(W / 2, 48, 30);
    badge.lineStyle(10, 0x451a03, 1);
    badge.beginPath();
    badge.moveTo(W / 2 + 8, 28);
    badge.lineTo(W / 2 - 8, 50);
    badge.lineTo(W / 2 + 2, 50);
    badge.lineTo(W / 2 - 6, 68);
    badge.strokePath();
    const title = this.add
      .text(W / 2, 108, 'ELETRO QUEST', {
        fontSize: '60px',
        fontFamily: "'Chakra Petch', sans-serif",
        color: P.title,
        fontStyle: 'bold',
        stroke: '#92400e',
        strokeThickness: 2,
        shadow: { offsetX: 0, offsetY: 0, color: '#f59e0b', blur: 26, fill: true },
      })
      .setOrigin(0.5);
    // hormati prefers-reduced-motion (jangan animasi kalau user minta diam)
    if (!this.prefersReducedMotion()) {
      this.tweens.add({
        targets: title, scale: 1.025, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
    }
    this.add
      .text(W / 2, 162, 'Game Edukasi • S1 Teknik Elektro', {
        fontSize: '20px', color: P.accentTx, fontStyle: 'bold',
      })
      .setOrigin(0.5);

    currentLine(this, 110, 610, 206);

    // Tombol AKUN eksplisit di kanan-atas header — selalu kelihatan,
    // tidak dorong layout menu bawah. Kuning amber biar beda dari tombol cyan.
    const accW = 228;
    const accX = W - 16 - accW / 2;
    const accY = 30;
    const accBg = this.add.rectangle(0, 0, accW, 56, 0x0f2a3d, 0.95);
    accBg.setStrokeStyle(2, 0xf59e0b, 1);
    const accTx = this.add
      .text(0, 0, '', { fontSize: '20px', color: '#fde68a', fontStyle: 'bold' })
      .setOrigin(0.5);
    const accVis = this.add.container(accX, accY, [accBg, accTx]).setDepth(10);
    const accZone = this.add.zone(accX, accY, accW + 16, 68).setInteractive({ useHandCursor: true }).setDepth(12);
    pressable(this, accZone, accVis);

    // Tombol LEADERBOARD kiri-atas — simetris dengan akun, selalu kelihatan.
    const lbW = 200;
    const lbX = 16 + lbW / 2;
    const lbBg = this.add.rectangle(0, 0, lbW, 56, 0x0f2a3d, 0.95);
    lbBg.setStrokeStyle(2, 0x22d3ee, 1);
    const lbTx = this.add
      .text(0, 0, '★ PAPAN', { fontSize: '20px', color: '#a5f3fc', fontStyle: 'bold' })
      .setOrigin(0.5);
    const lbVis = this.add.container(lbX, accY, [lbBg, lbTx]).setDepth(10);
    const lbZone = this.add.zone(lbX, accY, lbW + 16, 68).setInteractive({ useHandCursor: true }).setDepth(12);
    pressable(this, lbZone, lbVis);
    lbZone.on('pointerdown', () => {
      sfxClick();
      burst(this, lbX, accY, { colors: [0xf59e0b, 0xfacc15, 0xffffff], count: 12, distMin: 40, distMax: 120 });
      this.time.delayedCall(150, () => this.scene.start('Leaderboard'));
    });

    this.bigButton(322, 'book', 'MATA KULIAH', 'Teknik Elektro • Aljabar • Statistik', () => {
      sfxClick();
      burst(this, W / 2, 322, { colors: [0x22d3ee, 0xa5f3fc, 0xffffff], count: 16, distMin: 60, distMax: 200 });
      this.time.delayedCall(150, () => this.scene.start('Course'));
    });
    this.bigButton(440, 'gear', 'PENGATURAN', 'Suara • Getar • Reset', () => this.openSettings());
    this.bigButton(558, 'user', 'TENTANG CREATOR', 'Kenalan sama pembuat game', () => this.openCreator());
    this.bigButton(676, 'star', 'SARAN & REVIEW', 'Kasih bintang + masukan', () => this.openReview());

    this.add
      .text(W / 2, 762, 'Belajar sambil main', { fontSize: '16px', color: P.dim })
      .setOrigin(0.5);

    const nameTx = this.add.text(W / 2, 800, '', { fontSize: '20px', color: P.dim }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    const paintName = (): void => {
      const sess = getSession();
      if (sess !== null) {
        const short = sess.username.length > 12 ? `${sess.username.slice(0, 12)}…` : sess.username;
        accTx.setText(`● ${short} • KELUAR`);
        accBg.setFillStyle(0x14532d, 0.95);
        accBg.setStrokeStyle(2, 0x4ade80, 1);
        const fn = sess.fullname.length > 20 ? `${sess.fullname.slice(0, 20)}…` : sess.fullname;
        nameTx.setText(`${fn} (@${sess.username})`);
        return;
      }
      accTx.setText('○ MASUK / DAFTAR');
      accBg.setFillStyle(0x0f2a3d, 0.95);
      accBg.setStrokeStyle(2, 0xf59e0b, 1);
      const nn = playerName();
      nameTx.setText(nn === null ? 'main tanpa akun (ketuk untuk daftar)' : `${nn} (ketuk untuk akun)`);
    };
    paintName();
    const openAccount = (): void => {
      sfxClick();
      if (getSession() !== null) {
        let out = false;
        try {
          out = window.confirm('Keluar dari akun ini?');
        } catch {
          out = false;
        }
        if (out) logoutSession();
      } else {
        showAuthOverlay('daftar', () => paintName());
        return;
      }
      paintName();
    };
    accZone.on('pointerdown', openAccount);
    nameTx.on('pointerdown', openAccount);

    const wc = weakCount();
    const latBg = this.add.rectangle(W / 2, 842, 624, 64, wc > 0 ? 0x7c2d12 : 0x0f2a3d).setOrigin(0.5);
    latBg.setStrokeStyle(2, wc > 0 ? 0xfb923c : 0x334155, 1);
    this.add.text(W / 2, 842, wc > 0 ? `LATIHAN KELEMAHAN (${wc} soal)` : 'LATIHAN KELEMAHAN', {
      fontSize: '22px', color: wc > 0 ? '#fed7aa' : '#94a3b8', fontStyle: 'bold',
    }).setOrigin(0.5);
    const latZ = this.add.zone(W / 2, 842, 624, 72).setInteractive({ useHandCursor: true });
    latZ.on('pointerdown', () => {
      sfxClick();
      this.scene.start('Latihan');
    });

    // Pak Volt, maskot lab + celoteh bergilir
    drawMascot(this, 240, 950, 1.0, 'idle');
    const bubBg = this.add.rectangle(0, 0, 330, 120, 0x0b1628, 0.95).setOrigin(0.5);
    bubBg.setStrokeStyle(2, 0x22d3ee, 0.8);
    const bubTx = this.add.text(0, 0, 'Halo! Aku Pak Volt!', {
      fontSize: '20px', color: '#e2e8f0', align: 'center', wordWrap: { width: 290 }, lineSpacing: 5,
    }).setOrigin(0.5);
    const bub = this.add.container(505, 930, [bubBg, bubTx]);
    const tips = [
      'Ketuk MATA KULIAH buat pilih mapel!',
      'Mode TERANG enak di proyektor!',
      'Bintangmu kesimpen otomatis!',
      'Kalah itu wajar, coba lagi!',
      pickPraise(),
    ];
    let ti = 0;
    this.time.addEvent({
      delay: 5000,
      loop: true,
      callback: () => {
        ti = (ti + 1) % tips.length;
        bubTx.setText(tips[ti]);
        if (!this.prefersReducedMotion()) {
          this.tweens.add({ targets: bub, scale: 1.05, duration: 150, yoyo: true });
        }
      },
    });

    this.add
      .text(W / 2, 1180, 'v1.0 • dibuat untuk mahasiswa S1 Elektro', { fontSize: '14px', color: P.dim })
      .setOrigin(0.5);

    bindKeys(this, {
      ENTER: () => {
        if (this.modalObjs.length === 0) this.scene.start('Course');
      },
      L: () => {
        if (this.modalObjs.length === 0) openAccount();
      },
      B: () => {
        if (this.modalObjs.length === 0) this.scene.start('Leaderboard');
      },
      ESC: () => {
        if (this.modalObjs.length > 0) this.closeModal();
      },
    });
  }

  private prefersReducedMotion(): boolean {
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
  }

  /** Gambar ikon vektor (tanpa emoji/font) — garis 2px konsisten, 1 gaya. */
  private drawVectorIcon(g: Phaser.GameObjects.Graphics, kind: string): void {
    g.lineStyle(2.5, 0x04121a, 1);
    if (kind === 'book') {
      g.strokeRect(-16, -14, 32, 28);
      g.lineBetween(-4, -14, -4, 14);
      g.lineBetween(-16, -6, 12, -6);
      g.lineBetween(-16, 2, 12, 2);
    } else if (kind === 'gear') {
      g.strokeCircle(0, 0, 12);
      g.strokeCircle(0, 0, 4);
      for (let a = 0; a < 8; a++) {
        const ang = (a * Math.PI * 2) / 8;
        const x1 = Math.cos(ang) * 14, y1 = Math.sin(ang) * 14;
        const x2 = Math.cos(ang) * 20, y2 = Math.sin(ang) * 20;
        g.lineBetween(x1, y1, x2, y2);
      }
    } else if (kind === 'user') {
      g.strokeCircle(0, -8, 9);
      g.beginPath(); g.moveTo(-14, 16); g.lineTo(-10, 6); g.lineTo(10, 6); g.lineTo(14, 16); g.strokePath();
    } else if (kind === 'star') {
      const rOut = 18, rIn = 8;
      g.beginPath();
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? rOut : rIn;
        const ang = -Math.PI / 2 + (i * Math.PI) / 5;
        const x = Math.cos(ang) * r, y = Math.sin(ang) * r;
        if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
      }
      g.closePath(); g.strokePath();
    }
  }

  private bigButton(y: number, icon: string, title: string, desc: string, cb: () => void): void {
    const W = 720;
    const w = 624;
    const h = 100;
    this.add.rectangle(W / 2, y + 7, w, h, 0x000000, 0.45).setOrigin(0.5).setDepth(-1);
    this.add.image(W / 2, y, 'fx-glow').setTint(0x22d3ee).setAlpha(0.14).setScale(w / 128, h / 128 + 0.3);
    const bg = this.add.rectangle(0, 0, w, h, 0x103049, 0.94);
    bg.setStrokeStyle(2, 0x22d3ee, 1);
    const circ = this.add.circle(-w / 2 + 70, 0, 38, 0xffffff, 1);
    circ.setStrokeStyle(3, 0xa5f3fc, 1);
    // ikon vektor di atas circle putih — konsisten stroke 2.5px, tanpa emoji
    const icG = this.add.graphics().setPosition(-w / 2 + 70, -2);
    this.drawVectorIcon(icG, icon);
    const t1 = this.add
      .text(-w / 2 + 124, -20, title, { fontSize: '30px', color: '#f8fafc', fontStyle: 'bold', fontFamily: "'Chakra Petch', sans-serif" })
      .setOrigin(0, 0.5);
    const t2 = this.add
      .text(-w / 2 + 124, 20, desc, { fontSize: '14px', color: '#94a3b8' })
      .setOrigin(0, 0.5);
    const ch = this.add
      .text(w / 2 - 36, 0, '›', { fontSize: '32px', color: '#67e8f9', fontStyle: 'bold' })
      .setOrigin(0.5);
    const vis = this.add.container(W / 2, y, [bg, circ, icG, t1, t2, ch]);
    const z = this.add.zone(W / 2, y, w, h).setInteractive({ useHandCursor: true });
    if (!this.prefersReducedMotion()) pressable(this, z, vis);
    else z.on('pointerdown', () => { vis.setAlpha(0.9); this.time.delayedCall(90, () => vis.setAlpha(1)); });
    z.on('pointerdown', cb);
    z.on('pointerover', () => bg.setFillStyle(0x164e63, 0.96));
    z.on('pointerout', () => bg.setFillStyle(0x103049, 0.94));
  }

  private openReview(): void {
    sfxClick();
    void flushReviews();
    if (getSession() === null) {
      showAuthOverlay('daftar', (ok) => {
        if (ok) this.openReviewForm();
      });
      return;
    }
    this.openReviewForm();
  }

  private openReviewForm(): void {
    const { cx, top } = this.modalShell('Saran & Review', 620);
    let rating = 5;
    const starTxs: Phaser.GameObjects.Text[] = [];
    for (let i = 0; i < 5; i++) {
      const st = this.add.text(cx - 120 + i * 60, top + 70, '★', { fontSize: '48px', color: '#facc15' }).setOrigin(0.5).setDepth(42);
      const z = this.add.zone(cx - 120 + i * 60, top + 70, 60, 60).setInteractive({ useHandCursor: true }).setDepth(43);
      const idx = i;
      z.on('pointerdown', () => {
        rating = idx + 1;
        starTxs.forEach((t, k) => t.setColor(k < rating ? '#facc15' : '#475569'));
        sfxClick();
      });
      this.modalObjs.push(st, z);
      starTxs.push(st);
    }
    const infoTx = this.add.text(cx, top + 140, '...', { fontSize: '20px', color: '#94a3b8' }).setOrigin(0.5).setDepth(42);
    this.modalObjs.push(infoTx);
    reviewStats()
      .then((s) => {
        try {
          infoTx.setText(s === null ? 'Mode offline — ulasan kesimpen di HP' : `${s.count} ulasan masuk • rata-rata ${s.avg}★`);
        } catch {
          /* modal keburu tutup */
        }
      })
      .catch(() => undefined);
    const resultTx = this.add.text(cx, top + 180, '', {
      fontSize: '21px', color: '#e2e8f0', align: 'center', wordWrap: { width: 500 },
    }).setOrigin(0.5, 0).setVisible(false).setDepth(42);
    this.modalObjs.push(resultTx);
    this.modalButton(cx, top + 280, 'KIRIM MASUKAN', true, () => {
      sfxClick();
      let text: string | null = null;
      try {
        text = window.prompt('Tulis saran / review / laporan bug:', '');
      } catch {
        text = null;
      }
      if (text === null) return;
      if (text.trim() === '') {
        resultTx.setText('Tulis dulu pesannya!').setColor('#fbbf24').setVisible(true);
        return;
      }
      const nm = getSession();
      resultTx.setText('Mengirim...').setColor('#a5f3fc').setVisible(true);
      void submitReview(rating, text.trim()).then((st) => {
        try {
          if (st === 'ok') {
            resultTx.setText(`✓ Makasih${nm !== null ? ' ' + nm.username : ''}! Masuk ke Pak Sufi`).setColor('#4ade80').setVisible(true);
          } else if (st === 'auth') {
            this.closeModal();
            showAuthOverlay('masuk', (ok2) => {
              if (ok2) this.openReviewForm();
            });
          } else {
            resultTx.setText('Kesimpen di HP, kekirim pas online.').setColor('#fde68a').setVisible(true);
          }
        } catch {
          /* abaikan */
        }
      });
    });
    this.modalButton(cx, top + 370, 'TUTUP', false, () => {
      sfxClick();
      this.closeModal();
    });
  }

  // ---------- modal ----------

  private closeModal(): void {
    for (const o of this.modalObjs) o.destroy();
    this.modalObjs = [];
    this.resetArmed = false;
  }

  private modalShell(title: string, bodyH: number): { cx: number; top: number } {
    this.closeModal();
    const W = 720;
    const cx = W / 2;
    const cy = 640;
    const dim = this.add.rectangle(cx, cy, 720, 1280, 0x000000, 0.72).setDepth(40);
    dim.setInteractive();
    const panel = this.add.rectangle(cx, cy, 600, bodyH, 0x0b1628).setDepth(41);
    panel.setStrokeStyle(3, 0x22d3ee, 1);
    const t = this.add
      .text(cx, cy - bodyH / 2 + 52, title, { fontSize: '32px', color: '#a5f3fc', fontStyle: 'bold' })
      .setOrigin(0.5)
      .setDepth(42);
    this.modalObjs.push(dim, panel, t);
    return { cx, top: cy - bodyH / 2 + 100 };
  }

  private modalButton(cx: number, y: number, label: string, primary: boolean, cb: () => void): void {
    const bg = this.add.rectangle(0, 0, 420, 68, primary ? 0x22d3ee : 0x0f2a3d, 1);
    bg.setStrokeStyle(2, 0xa5f3fc, 1);
    const tx = this.add
      .text(0, 0, label, {
        fontSize: '24px', color: primary ? '#04121a' : '#e2e8f0', fontStyle: 'bold',
      })
      .setOrigin(0.5);
    const wrap = this.add.container(cx, y, [bg, tx]).setDepth(42);
    const z = this.add.zone(cx, y, 440, 88).setInteractive({ useHandCursor: true }).setDepth(43);
    pressable(this, z, wrap);
    z.on('pointerdown', cb);
    this.modalObjs.push(bg, tx, wrap, z);
  }

  private openCreator(): void {
    sfxClick();
    const { cx, top } = this.modalShell('Tentang Creator', 580);
    const ring = this.add.circle(cx, top + 44, 46, 0x22d3ee, 1).setDepth(42);
    ring.setStrokeStyle(4, 0xa5f3fc, 1);
    const av = this.add.text(cx, top + 42, CREATOR.avatar, { fontSize: '54px' }).setOrigin(0.5).setDepth(42);
    const nm = this.add
      .text(cx, top + 116, CREATOR.name, { fontSize: '30px', color: '#f8fafc', fontStyle: 'bold' })
      .setOrigin(0.5)
      .setDepth(42);
    const rl = this.add
      .text(cx, top + 152, CREATOR.role, { fontSize: '21px', color: '#67e8f9', fontStyle: 'bold' })
      .setOrigin(0.5)
      .setDepth(42);
    const id = this.add
      .text(cx, top + 182, CREATOR.identity, { fontSize: '20px', color: '#94a3b8' })
      .setOrigin(0.5)
      .setDepth(42);
    const qt = this.add
      .text(cx, top + 230, CREATOR.quote, {
        fontSize: '21px', color: '#fde68a', align: 'center', wordWrap: { width: 480 },
      })
      .setOrigin(0.5, 0)
      .setDepth(42);
    this.modalObjs.push(ring, av, nm, rl, id, qt);
    this.modalButton(cx, top + 350, 'TUTUP', true, () => {
      sfxClick();
      this.closeModal();
    });
  }

  private openSettings(): void {
    sfxClick();
    const { cx, top } = this.modalShell('Pengaturan', 850);

    const sndLabel = this.add
      .text(cx - 200, top + 40, 'Suara', { fontSize: '25px', color: '#e2e8f0', fontStyle: 'bold' })
      .setDepth(42);
    const shkLabel = this.add
      .text(cx - 200, top + 130, 'Getar layar', { fontSize: '25px', color: '#e2e8f0', fontStyle: 'bold' })
      .setDepth(42);
    const musLabel = this.add
      .text(cx - 200, top + 220, 'Musik', { fontSize: '25px', color: '#e2e8f0', fontStyle: 'bold' })
      .setDepth(42);
    const voiLabel = this.add
      .text(cx - 200, top + 310, 'Pak Volt', { fontSize: '25px', color: '#e2e8f0', fontStyle: 'bold' })
      .setDepth(42);
    this.modalObjs.push(sndLabel, shkLabel, musLabel, voiLabel);

    const mkPill = (y: number, get: () => boolean, set: (v: boolean) => void): void => {
      const bg = this.add.rectangle(cx + 130, y, 150, 60, 0x334155, 1).setDepth(42);
      bg.setStrokeStyle(2, 0xa5f3fc, 1);
      const tx = this.add
        .text(cx + 130, y, 'OFF', { fontSize: '24px', color: '#ffffff', fontStyle: 'bold' })
        .setOrigin(0.5)
        .setDepth(42);
      const paint = (): void => {
        const on = get();
        bg.setFillStyle(on ? 0x16a34a : 0x334155);
        tx.setText(on ? 'ON' : 'OFF');
      };
      const z = this.add.zone(cx + 130, y, 200, 88).setInteractive({ useHandCursor: true }).setDepth(43);
      z.on('pointerdown', () => {
        set(!get());
        paint();
      });
      this.modalObjs.push(bg, tx, z);
      paint();
    };
    mkPill(top + 40, () => getSettings().sound, (v) => this.flipSound(v));
    mkPill(top + 130, () => getSettings().shake, (v) => {
      this.flipShake(v);
      sfxClick();
    });
    mkPill(top + 220, () => getSettings().music, (v) => {
      this.flipMusic(v);
      sfxClick();
    });
    mkPill(top + 310, () => getSettings().voice, (v) => {
      this.flipVoice(v);
      sfxClick();
    });

    // Tema tampilan (5 gaya — ketuk untuk ganti)
    const thmLabel = this.add
      .text(cx - 200, top + 400, 'Tema', { fontSize: '25px', color: '#e2e8f0', fontStyle: 'bold' })
      .setDepth(42);
    this.modalObjs.push(thmLabel);
    const cur = THEME_ORDER.find((t) => t.id === getTheme()) ?? THEME_ORDER[0];
    const thmBg = this.add.rectangle(cx + 100, top + 400, 260, 60, 0x1e3a5f, 1).setDepth(42);
    thmBg.setStrokeStyle(2, 0xa5f3fc, 1);
    const thmTx = this.add
      .text(cx + 100, top + 400, `◀ ${cur.icon} ${cur.name} ▶`, { fontSize: '23px', color: '#e2e8f0', fontStyle: 'bold' })
      .setOrigin(0.5)
      .setDepth(42);
    const thmZ = this.add.zone(cx + 100, top + 400, 280, 88).setInteractive({ useHandCursor: true }).setDepth(43);
    thmZ.on('pointerdown', () => {
      setTheme(nextTheme());
      sfxClick();
      this.scene.restart();
    });
    this.modalObjs.push(thmBg, thmTx, thmZ);

    const rstBg = this.add.rectangle(cx, top + 490, 420, 64, 0x7f1d1d, 1).setDepth(42);
    rstBg.setStrokeStyle(2, 0xfca5a5, 1);
    const rstTx = this.add
      .text(cx, top + 490, 'RESET PROGRESS', { fontSize: '23px', color: '#fecaca', fontStyle: 'bold' })
      .setOrigin(0.5)
      .setDepth(42);
    const rstZ = this.add.zone(cx, top + 490, 440, 88).setInteractive({ useHandCursor: true }).setDepth(43);
    rstZ.on('pointerdown', () => {
      if (!this.resetArmed) {
        this.resetArmed = true;
        rstTx.setText('YAKIN? KETUK LAGI');
        sfxClick();
      } else {
        clearStars();
        sfxClick();
        this.scene.restart();
      }
    });
    this.modalObjs.push(rstBg, rstTx, rstZ);

    this.modalButton(cx, top + 590, 'TUTUP', true, () => {
      sfxClick();
      this.closeModal();
    });
  }

  private flipVoice(v: boolean): void {
    const s = getSettings();
    s.voice = v;
    setSettings(s);
  }

  private flipMusic(v: boolean): void {
    const s = getSettings();
    s.music = v;
    setSettings(s);
  }

  private flipSound(v: boolean): void {
    const s = getSettings();
    s.sound = v;
    setSettings(s);
    setMusicEnabled(v);
    if (v) beep(660, 0.08, 'square', 0.08);
  }

  private flipShake(v: boolean): void {
    const s = getSettings();
    s.shake = v;
    setSettings(s);
  }
}
