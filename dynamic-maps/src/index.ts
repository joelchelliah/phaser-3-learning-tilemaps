/// <reference path="../../phaser.d.ts"/>

import 'phaser'
import { Game } from 'phaser'

import PlatformerScene from './platformer-scene'

const config: GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 800,
  height: 600,
  render: { pixelArt: true, antialias: false, autoResize: false },
  backgroundColor: '#1d212d',
  scene: PlatformerScene,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 1000 },
    },
  },
}

const game: Game = new Phaser.Game(config)
