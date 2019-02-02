/// <reference path="../../phaser.d.ts"/>

import 'phaser'
import { Game } from 'phaser'

const config: GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 800,
  height: 600,
  render: { pixelArt: true, antialias: false, autoResize: false },
  backgroundColor: '#1d212d',
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
}

const assetsPath = '../dynamic-maps/assets'
const game: Game = new Phaser.Game(config)
let controls
let marker
let shiftKey
let map
let groundLayer

function preload(): void {
  this.load.image('tiles', `${assetsPath}/tilesets/0x72-industrial-tileset-32px-extruded.png`)
  this.load.tilemapTiledJSON('map', `${assetsPath}/tilemaps/platformer.json`)
}

function create(): void {
  map = this.make.tilemap({ key: 'map' })
  const tiles = map.addTilesetImage('0x72-industrial-tileset-32px-extruded', 'tiles')

  map.createDynamicLayer('Background', tiles)
  groundLayer = map.createDynamicLayer('Ground', tiles)
  map.createDynamicLayer('Foreground', tiles)

  // Put tile index 1 at tile grid location (20, 10) within layer
  // groundLayer.putTileAt(1, 20, 10)

  // Put tile index 2 at world pixel location (200, 50) within layer
  // (This uses the main camera's coordinate system by default)
  // groundLayer.putTileAtWorldXY(2, 200, 50)

  shiftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT)

  setupCameraControls(this)
  setUpMarkerGraphics(this)
  setUpHelpfulText(this)
}

function setupCameraControls({input, cameras}): void {
  // Set up arrows to control camera
  const cursors = input.keyboard.createCursorKeys()

  controls = new Phaser.Cameras.Controls.FixedKeyControl({
    camera: cameras.main,
    left: cursors.left,
    right: cursors.right,
    up: cursors.up,
    down: cursors.down,
    speed: 0.5,
  })

  // Limit the camera to the map size
  cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels)
}

function setUpMarkerGraphics({add}): void {
  // Create a simple graphic that can be used to show which tile the mouse is over
  marker = add.graphics()
  marker.lineStyle(5, 0xffffff, 1)
  marker.strokeRect(0, 0, map.tileWidth, map.tileHeight)
  marker.lineStyle(3, 0xff4f99, 1)
  marker.strokeRect(0, 0, map.tileWidth, map.tileHeight)
}

function setUpHelpfulText({add}): void {
  // Help text that has a "fixed" position on the screen
  add.text(16, 16, 'Arrow keys to scroll\nLeft-click to draw tiles\nShift + left-click to erase', {
    font: '18px monospace',
    fill: '#000000',
    padding: { x: 20, y: 10 },
    backgroundColor: '#ffffff',
  }).setScrollFactor(0)
}

function update(time, delta): void {
  const { input, cameras } = this
  // Convert the mouse position to world position within the camera
  const { x, y } = input.activePointer.positionToCamera(cameras.main)

  controls.update(delta)

  // Place the marker in world space, but snap it to the tile grid. If we convert world -> tile and
  // then tile -> world, we end up with the position of the tile under the pointer
  const { x: pointerX, y: pointerY } = groundLayer.worldToTileXY(x, y)
  const { x: snappedX, y: snappedY } = groundLayer.tileToWorldXY(pointerX, pointerY)
  marker.setPosition(snappedX, snappedY)

  // Draw tiles (only within the groundLayer)
  if (input.manager.activePointer.isDown) {
    if (shiftKey.isDown) groundLayer.removeTileAtWorldXY(x, y)
    else groundLayer.putTileAtWorldXY(353, x, y)
  }
}
