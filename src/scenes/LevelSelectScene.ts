import * as Phaser from 'phaser';
import {
  COLORS,
  FONT_FAMILY,
  GAME_WIDTH,
  SCENE_KEYS,
  TOTAL_LEVEL_SLOTS
} from '../utils/constants';
import { drawGlassPanel, drawLabBackground, showToast } from '../utils/helpers';
import { PremiumButton } from '../ui/Button';
import { levelManager } from '../systems/LevelManager';

/** Level select: 20-slot grid driven by LevelDefinition + LevelManager. */
export class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.LevelSelect);
  }

  create(): void {
    drawLabBackground(this);
    const cx = GAME_WIDTH / 2;

    new PremiumButton(this, 120, 90, '‹ Back', () => {
      this.scene.start(SCENE_KEYS.MainMenu);
    }, { variant: 'ghost', width: 168, height: 88 });

    this.add
      .text(cx, 84, 'SELECT LEVEL', {
        fontFamily: FONT_FAMILY,
        fontSize: '44px',
        fontStyle: 'bold',
        color: '#eaf6ff',
        letterSpacing: 4
      } as Phaser.Types.GameObjects.Text.TextStyle)
      .setOrigin(0.5);
    this.add
      .text(cx, 132, `${levelManager.completedCount()} completed  •  tap an unlocked lab to play`, {
        fontFamily: FONT_FAMILY,
        fontSize: '25px',
        color: '#8aa0b8'
      })
      .setOrigin(0.5);

    const panel = this.add.graphics();
    drawGlassPanel(panel, 32, 176, GAME_WIDTH - 64, 920, 28);

    // 4 columns × 5 rows = 20 slots.
    const cols = 4;
    const cellW = (GAME_WIDTH - 64 - 48) / cols;
    const cellH = (920 - 48) / 5;
    for (let slot = 1; slot <= TOTAL_LEVEL_SLOTS; slot++) {
      const col = (slot - 1) % cols;
      const row = Math.floor((slot - 1) / cols);
      const x = 32 + 24 + cellW * col + cellW / 2;
      const y = 176 + 24 + cellH * row + cellH / 2;
      this.drawSlot(x, y, cellW - 18, cellH - 18, slot);
    }

    new PremiumButton(this, cx, 1170, '▶  Play Level 1', () => {
      this.scene.start(SCENE_KEYS.Game, { levelId: 1 });
    }, { width: 480 });

    this.add
      .text(cx, 1236, 'Levels 6–20 arrive in Milestone 8 — grid is ready for them.', {
        fontFamily: FONT_FAMILY,
        fontSize: '22px',
        color: '#5b7190'
      })
      .setOrigin(0.5);
  }

  private drawSlot(x: number, y: number, w: number, h: number, slot: number): void {
    const def = levelManager.getLevel(slot);
    const unlocked = levelManager.isUnlocked(slot) && def !== undefined;
    const done = levelManager.isCompleted(slot);

    const g = this.add.graphics();
    if (unlocked) {
      g.fillStyle(done ? 0x0d3a24 : 0x0e1e3a, 0.95);
      g.fillRoundedRect(x - w / 2, y - h / 2, w, h, 20);
      g.lineStyle(2.5, done ? COLORS.neonGreen : COLORS.cyan, 1);
      g.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 20);
    } else {
      g.fillStyle(0x080f1f, 0.85);
      g.fillRoundedRect(x - w / 2, y - h / 2, w, h, 20);
      g.lineStyle(2, 0x1c2f4d, 1);
      g.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 20);
    }

    if (unlocked && def !== undefined) {
      this.add
        .text(x, y - 28, String(slot).padStart(2, '0'), {
          fontFamily: FONT_FAMILY,
          fontSize: '44px',
          fontStyle: 'bold',
          color: '#eaf6ff'
        })
        .setOrigin(0.5);
      this.add
        .text(x, y + 22, done ? '★ DONE' : def.difficulty.toUpperCase(), {
          fontFamily: FONT_FAMILY,
          fontSize: '21px',
          fontStyle: 'bold',
          color: done ? '#4ade80' : '#9be9ff'
        })
        .setOrigin(0.5);
      const zone = this.add.zone(x, y, w, h).setInteractive({ useHandCursor: true });
      zone.on('pointerup', () => {
        this.scene.start(SCENE_KEYS.Game, { levelId: slot });
      });
    } else {
      // Locked: padlock drawn procedurally (body + shackle).
      const lg = this.add.graphics();
      lg.fillStyle(0x2b3d5c, 1);
      lg.fillRoundedRect(x - 20, y - 8, 40, 32, 8);
      lg.lineStyle(6, 0x2b3d5c, 1);
      lg.strokeCircle(x, y - 8, 16);
      lg.lineStyle(6, 0x0b1a33, 1);
      lg.strokeCircle(x, y - 8, 16);
      this.add
        .text(x, y + 34, slot <= 5 ? 'SOON' : 'LOCKED', {
          fontFamily: FONT_FAMILY,
          fontSize: '20px',
          fontStyle: 'bold',
          color: '#5b7190',
          letterSpacing: 2
        } as Phaser.Types.GameObjects.Text.TextStyle)
        .setOrigin(0.5);
      const zone = this.add.zone(x, y, w, h).setInteractive({ useHandCursor: true });
      zone.on('pointerup', () => {
        showToast(this, slot <= 5 ? 'Finish the previous lab to unlock this one.' : 'Locked — more labs land in Milestone 8.');
      });
    }
  }
}
