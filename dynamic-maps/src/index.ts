/// <reference path="../../phaser.d.ts"/>

import 'phaser'
import { Game } from 'phaser'

const config: GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 800,
  height: 600,
  render: { pixelArt: true, antialias: false, autoResize: false },
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
  backgroundColor: '#aa2b53',
}

const game: Game = new Phaser.Game(config)
let controls
let marker
let shiftKey
let groundLayer

function preload(): void {
}

function create(): void {

}

function update(): void {

}
