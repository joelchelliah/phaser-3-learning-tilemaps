/// <reference path="../../phaser.d.ts"/>

import 'phaser'
import { Game } from 'phaser'

import DungeonScene from './dungeon-scene'

const config: GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 800,
  height: 600,
  render: { pixelArt: true, antialias: false, autoResize: false },
  backgroundColor: '#000',
  scene: DungeonScene,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
    },
  },
}

const game: Game = new Phaser.Game(config)
