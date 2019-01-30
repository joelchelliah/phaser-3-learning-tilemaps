/// <reference path="../../phaser.d.ts"/>

import 'phaser'

const config: GameConfig = {
  width: 171,
  height: 160,
  type: Phaser.AUTO,
  parent: 'game-container',
  physics: {
      default: 'arcade',
      arcade: {
          gravity: { y: 300 },
          debug: false,
      },
  },
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
  backgroundColor: '#aa2b53',
  zoom: 4, // Since we're working with 16x16 pixel tiles, let's scale up the canvas by 4x
  render: { pixelArt: true, antialias: false, autoResize: false },
}

const game = new Phaser.Game(config)

function preload() {
  // "this" === Phaser.Scene
  // this.load.image('repeating-background', '../assets/images/escheresque_dark.png')
  this.load.image('mario-tiles', '../static-maps/assets/tilesets/super-mario-tiles.png')
}

function create() {
  const { width, height } = this.sys.game.config
  const level = [
    [  0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0 ],
    [  0,   1,   2,   3,   0,   0,   0,   1,   2,   3,   0 ],
    [  0,   5,   6,   7,   0,   0,   0,   5,   6,   7,   0 ],
    [  0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0 ],
    [  0,   0,   0,  14,  13,  14,   0,   0,   0,   0,   0 ],
    [  0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0 ],
    [  0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0 ],
    [  0,   0,  14,  14,  14,  14,  14,   0,   0,   0,  15 ],
    [  0,   0,   0,   0,   0,   0,   0,   0,   0,  15,  15 ],
    [ 35,  36,  37,   0,   0,   0,   0,   0,  15,  15,  15 ],
    [ 39,  39,  39,  39,  39,  39,  39,  39,  39,  39,  39 ],
  ]
  const map = this.make.tilemap({ data: level, tileWidth: 16, tileHeight: 16 })
  const tiles = map.addTilesetImage('mario-tiles')
  const layer = map.createStaticLayer(0, tiles, 0, 0)
}

function update(time, delta) {
  // We aren't using this in the current example, but here is where you can run logic that you need
  // to check over time, e.g. updating a player sprite's position based on keyboard input
}
