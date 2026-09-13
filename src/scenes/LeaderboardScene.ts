import Phaser from 'phaser';
import { sfxClick, bindKeys, getSession } from '../util';
import { ensureFxTextures, neonBackdrop } from '../fx';
import { pal } from '../theme';
import { fetchBoard, type BoardEntry } from '../leaderboard';

const MEDALS = ['1st', '2nd', '3rd'];

export class LeaderboardScene extends Phaser.Scene {
  constructor() {
    super('Leaderboard');
  }

  create(): void {
    const W = 720;
    const P = pal();
    ensureFxTextures(this);
    neonBackdrop(this);

    const back = this.add
      .text(24, 20, '‹ MENU UTAMA', { fontSize: '24px', color: P.accentTx, fontStyle: 'bold' })
      .setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => {
      sfxClick();
      this.scene.start('MainMenu');
    });

    this.add
      .text(W / 2, 100, 'LEADERBOARD', {
        fontSize: '42px', color: P.title, fontStyle: 'bold',
        fontFamily: "'Chakra Petch', sans-serif",
      })
      .setOrigin(0.5);
    const statusTx = this.add
      .text(W / 2, 150, 'Memuat...', { fontSize: '16px', color: P.dim })
      .setOrigin(0.5);

    const listY = 210;
    const rowH = 92;
    const listH = 10 * rowH;
    const panel = this.add.rectangle(W / 2, listY + listH / 2, 624, listH + 32, 0x0b1628, 0.9);
    panel.setStrokeStyle(2, 0x22d3ee, 1);

    const rows: Phaser.GameObjects.GameObject[] = [];
    const clearRows = (): void => {
      for (const o of rows) o.destroy();
      rows.length = 0;
    };

    const render = (board: BoardEntry[], online: boolean, at: number): void => {
      clearRows();
      const me = getSession()?.username ?? null;
      if (board.length === 0) {
        const t = this.add
          .text(W / 2, listY + 120, online ? 'Belum ada skor.\nMain dulu! 🎮' : 'Belum ada progres di HP ini.\nMain 1 level dulu! 🎮', {
            fontSize: '20px', color: P.dim, align: 'center', lineSpacing: 8,
          })
          .setOrigin(0.5, 0);
        rows.push(t);
      }
      board.slice(0, 10).forEach((p, i) => {
        const y = listY + 16 + i * rowH + rowH / 2;
        const isMe = me !== null && p.name === me;
        const bg = this.add.rectangle(W / 2, y, 580, rowH - 10, isMe ? 0x14532d : 0x103049, 0.95);
        bg.setStrokeStyle(2, i < 3 ? 0xf59e0b : isMe ? 0x4ade80 : 0x334155, 1);
        const rank = this.add
          .text(W / 2 - 252, y, MEDALS[i] ?? `${i + 1}`, { fontSize: '20px', color: i < 3 ? '#fde68a' : '#94a3b8', fontStyle: 'bold' })
          .setOrigin(0.5);
        const nm = this.add
          .text(W / 2 - 200, y - 14, p.name.slice(0, 14), { fontSize: '24px', color: '#f8fafc', fontStyle: 'bold' })
          .setOrigin(0, 0.5);
        const kl = this.add
          .text(W / 2 - 200, y + 18, (p.fullname ?? '').slice(0, 20), { fontSize: '16px', color: '#67e8f9' })
          .setOrigin(0, 0.5);
        const st = this.add
          .text(W / 2 + 252, y - 12, `★ ${p.stars}`, { fontSize: '24px', color: '#facc15', fontStyle: 'bold' })
          .setOrigin(1, 0.5);
        const lv = this.add
          .text(W / 2 + 252, y + 18, `${p.levels} level`, { fontSize: '16px', color: P.dim })
          .setOrigin(1, 0.5);
        rows.push(bg, rank, nm, kl, st, lv);
      });
      try {
        const when = new Date(at).toLocaleTimeString('id-ID');
        statusTx.setText(online ? `Papan kelas • ${board.length} murid • ${when}` : 'Mode offline — progres HP ini • join WiFi kelas buat papan kelas');
      } catch {
        statusTx.setText(online ? 'Papan kelas' : 'Mode offline — progres HP ini');
      }
    };

    let alive = true;
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => { alive = false; });
    const load = (): void => {
      statusTx.setText('Memuat...');
      void fetchBoard().then((r) => {
        if (!alive) return;
        try { render(r.board, r.online, r.at); } catch { /* abaikan */ }
      });
    };
    load();

    // tombol refresh
    const rBg = this.add.rectangle(W / 2, 1160, 420, 64, 0x22d3ee, 1);
    rBg.setStrokeStyle(2, 0xa5f3fc, 1);
    const rTx = this.add
      .text(W / 2, 1160, 'REFRESH', { fontSize: '24px', color: '#04121a', fontStyle: 'bold' })
      .setOrigin(0.5);
    const rZ = this.add.zone(W / 2, 1160, 440, 84).setInteractive({ useHandCursor: true });
    rZ.on('pointerdown', () => { sfxClick(); load(); });
    void rBg; void rTx;

    bindKeys(this, {
      ESC: () => this.scene.start('MainMenu'),
      R: () => load(),
    });
  }
}
