import Phaser from 'phaser';
import './style.css';
import { applyThemeBody, getTheme } from './theme';
import { MainMenuScene } from './scenes/MainMenuScene';
import { CourseScene } from './scenes/CourseScene';
import { TdeTopikScene } from './scenes/TdeTopik';
import { AljTopikScene } from './scenes/AljTopik';
import { QuizScene } from './scenes/QuizScene';
import { SortirScene } from './scenes/SortirScene';
import { MatchScene } from './scenes/MatchScene';
import { LatihanScene } from './scenes/LatihanScene';
import { AtomScene } from './scenes/AtomScene';
import { ListrikScene } from './scenes/ListrikScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { AljabarScene } from './scenes/AljabarScene';
import { StatScene } from './scenes/StatScene';
import { ACScene } from './scenes/ACScene';
import { BiasScene } from './scenes/BiasScene';
import { DigiScene } from './scenes/DigiScene';
import { ProgScene } from './scenes/ProgScene';
import { LeaderboardScene } from './scenes/LeaderboardScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-root',
  width: 720,
  height: 1280,
  backgroundColor: '#050914',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [MainMenuScene, CourseScene, TdeTopikScene, AljTopikScene, QuizScene, SortirScene, MatchScene, LatihanScene, AtomScene, ListrikScene, MenuScene, GameScene, AljabarScene, StatScene, ACScene, BiasScene, DigiScene, ProgScene, LeaderboardScene],
};

applyThemeBody(getTheme());

function start(): void {
  new Phaser.Game(config);
}

// Tunggu font display ke-load biar judul canvas langsung rapi.
const fontsReady = (document as Document).fonts?.ready;
if (fontsReady !== undefined && typeof (fontsReady as Promise<unknown>).then === 'function') {
  (fontsReady as Promise<unknown>).then(
    () => start(),
    () => start()
  );
} else {
  start();
}
