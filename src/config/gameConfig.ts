import * as Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, SCENE_KEYS } from '../utils/constants';
import { BootScene } from '../scenes/BootScene';
import { MainMenuScene } from '../scenes/MainMenuScene';
import { LevelSelectScene } from '../scenes/LevelSelectScene';
import { GameScene } from '../scenes/GameScene';
import { ResultScene } from '../scenes/ResultScene';

/**
 * Portrait-first responsive config.
 * FIXED 720×1280 + FIT + autoCenter = identical layout on
 * 360×640 / 390×844 / 412×915 / 768×1024, letterboxed safely on
 * landscape desktop (1280×720). No overflow, no tiny controls:
 * buttons are ≥88 game-units tall (≈44 CSS px minimum).
 */
export function createGameConfig(): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent: 'game-root',
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: '#050914',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    render: {
      antialias: true,
      roundPixels: false
    },
    fps: {
      target: 60,
      smoothStep: true
    },
    scene: [BootScene, MainMenuScene, LevelSelectScene, GameScene, ResultScene],
    disableContextMenu: true
  };
}

export { SCENE_KEYS };
