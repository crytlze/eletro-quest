import * as Phaser from 'phaser';
import { FONT_FAMILY, GAME_HEIGHT, GAME_WIDTH, SCENE_KEYS } from '../utils/constants';
import { drawGlassPanel, drawLabBackground } from '../utils/helpers';
import { PremiumButton } from '../ui/Button';
import { levelManager } from '../systems/LevelManager';

interface ResultSceneData {
  levelId?: number;
  stars?: number;
  preview?: boolean;
}

/** Result shell: success modal + stars + next/replay. Real scoring lands in Milestone 4. */
export class ResultScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.Result);
  }

  create(data: ResultSceneData): void {
    drawLabBackground(this);
    const levelId = data.levelId ?? 1;
    const stars = data.stars ?? 3;
    const cx = GAME_WIDTH / 2;

    // Dim + modal.
    this.add.rectangle(cx, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x02040a, 0.6);
    const panel = this.add.graphics();
    drawGlassPanel(panel, cx - 310, 330, 620, 620, 32);
    const modal = this.add.container(0, 14, [panel]);
    modal.setAlpha(0);
    this.tweens.add({ targets: modal, alpha: 1, y: 0, duration: 300, ease: 'Back.easeOut' });

    const bolt = this.add.graphics();
    bolt.fillStyle(0x4ade80, 1);
    bolt.fillCircle(cx, 420, 56);
    bolt.fillStyle(0x052e16, 1);
    bolt.fillTriangle(cx - 12, 392, cx - 12, 428, cx + 8, 428);
    bolt.fillTriangle(cx - 8, 452, cx - 8, 416, cx + 14, 416);

    this.add
      .text(cx, 520, 'CIRCUIT COMPLETE!', {
        fontFamily: FONT_FAMILY,
        fontSize: '52px',
        fontStyle: 'bold',
        color: '#eaf6ff',
        letterSpacing: 2
      } as Phaser.Types.GameObjects.Text.TextStyle)
      .setOrigin(0.5)
      .setShadow(0, 0, '#4ade80', 20, true, true);
    this.add
      .text(cx, 572, data.preview === true ? 'Preview — real scoring lands in Milestone 4' : 'Excellent!', {
        fontFamily: FONT_FAMILY,
        fontSize: '28px',
        color: '#8aa0b8'
      })
      .setOrigin(0.5);

    const starStr = '★'.repeat(stars) + '☆'.repeat(Math.max(0, 3 - stars));
    const starText = this.add
      .text(cx, 660, starStr.split('').join(' '), {
        fontFamily: FONT_FAMILY,
        fontSize: '72px',
        color: '#fbbf24'
      })
      .setOrigin(0.5)
      .setScale(0.6);
    this.tweens.add({ targets: starText, scale: 1, duration: 450, ease: 'Back.easeOut', delay: 200 });

    const nextId = levelId + 1;
    const hasNext = levelManager.getLevel(nextId) !== undefined;
    new PremiumButton(this, cx, 790, hasNext ? `Next: Level ${nextId} →` : 'Back to Levels', () => {
      if (hasNext) this.scene.start(SCENE_KEYS.Game, { levelId: nextId });
      else this.scene.start(SCENE_KEYS.LevelSelect);
    }, { variant: 'success', width: 500 });
    new PremiumButton(this, cx, 900, '↻ Replay', () => {
      this.scene.start(SCENE_KEYS.Game, { levelId });
    }, { variant: 'secondary', width: 500 });
  }
}
