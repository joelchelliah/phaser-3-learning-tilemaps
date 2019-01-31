/// <reference path="../../phaser.d.ts"/>

import 'phaser'
import { level as arrayMap } from './maps/arrayMap'
import { Scene, Tilemaps, Cameras } from 'phaser'

const marioConfig = {
  width: 16 * 10,
  height: 16 * 9,
  zoom: 4,
  render: { pixelArt: true, antialias: false, autoResize: false },
}

const catastrophiConfig = {
  width: 800,
  height: 600,
  render: { pixelArt: true, antialias: false, autoResize: false },
}

const config: GameConfig = {
  // ...marioConfig,
  ...catastrophiConfig,
  type: Phaser.AUTO,
  parent: 'game-container',
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
  backgroundColor: '#aa2b53',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
    },
  },
}

const game = new Phaser.Game(config)
const assetsPath = '../static-maps/assets'

let controls
let debugEnabled = false
let player
let cursors

function preload() {
  this.load.image('mario-tiles', `${assetsPath}/tilesets/super-mario-tiles.png`)
  this.load.tilemapTiledJSON('mario-map', `${assetsPath}/tilemaps/mario-map1.json`)

  this.load.image('cata-tiles', `${assetsPath}/tilesets/catastrophi_tiles_16_blue.png`)
  this.load.tilemapCSV('cata-map', `${assetsPath}/tilemaps/catastrophi_level3.csv`)

  this.load.image('town-tiles', `${assetsPath}/tilesets/tuxmon-sample-32px-extruded.png`)
  this.load.tilemapTiledJSON('town-map', `${assetsPath}/tilemaps/tuxemon-town.json`)

  this.load.atlas('atlas', `${assetsPath}/atlas/atlas.png`, `${assetsPath}/atlas/atlas.json`)
}

function create() {
  const { width, height } = this.sys.game.config

  // const map = createWorldFromArrayMap(this)
  //const map = createWorldFromCsvMap(this)
  const { map, worldLayer } = createWorldFromTiledJSON(this)
  const { widthInPixels, heightInPixels } = map

  createPlayer(this, map, worldLayer)
  addArrowsDescription(this)
  handleDebug(this, worldLayer)

  // Phaser supports multiple cameras, but you can access the default camera like this:
  const camera: Cameras.Scene2D.Camera = this.cameras.main
  camera.startFollow(player)
  camera.setBounds(0, 0, widthInPixels, heightInPixels)

  // Set up the arrows to control the camera
  cursors = this.input.keyboard.createCursorKeys()
  
}

// Help text that has a "fixed" position on the screen
function addArrowsDescription(scene: Scene) {
  const style = {
    font: '18px monospace',
    fill: '#eeddff',
    padding: { x: 2, y: 2 },
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  }

  scene.add.text(16, 16, 'Arrow keys to move\nPress "D" to show hitboxes', style)
    .setScrollFactor(0)
    .setDepth(30)
}

// Create a static tile layer from an array map
function createWorldFromArrayMap(scene: Scene): Tilemaps.Tilemap {
  const map = scene.make.tilemap({ data: arrayMap, tileWidth: 16, tileHeight: 16 })
  const tiles = map.addTilesetImage('mario-tiles')
  const layer = map.createStaticLayer(0, tiles, 0, 0)  // layer index, tileset, x, y

  return map
}

// Create a static tile layer from a CSV map
function createWorldFromCsvMap(scene: Scene): Tilemaps.Tilemap {
  const map = scene.make.tilemap({ key: 'cata-map', tileWidth: 16, tileHeight: 16 })
  const tiles = map.addTilesetImage('cata-tiles')
  const layer = map.createStaticLayer(0, tiles, 0, 0)  // layer index, tileset, x, y

  return map
}

// Create a static tile layer from a JSON map created in Tiled
function createWorldFromTiledJSON(scene: Scene): {map: Tilemaps.Tilemap, worldLayer: Tilemaps.StaticTilemapLayer } {
  const debugGraphics = scene.add.graphics().setAlpha(0.75).setDepth(20)
  // const map = scene.make.tilemap({ key: 'mario-map' })
  // const tiles = map.addTilesetImage('super-mario-tiles', 'mario-tiles')
  // const layer = map.createStaticLayer(0, tiles, 0, 0)  // layer index, tileset, x, y

  const map = scene.make.tilemap({ key: 'town-map' })
  const tiles = map.addTilesetImage('tuxmon-sample-32px-extruded', 'town-tiles')
  const layer = map.createStaticLayer(0, tiles, 0, 0)  // layer index, tileset, x, y

  const belowLayer = map.createStaticLayer('Below Player', tiles, 0, 0)
  const worldLayer = map.createStaticLayer('World', tiles, 0, 0)
  const aboveLayer = map.createStaticLayer('Above Player', tiles, 0, 0)

  worldLayer.setCollisionByProperty({ collides: true })
  aboveLayer.setDepth(10)

  return { map, worldLayer }
}

function createPlayer(scene: Scene, map: Tilemaps.Tilemap, worldLayer: Tilemaps.StaticTilemapLayer) {
  // Object layers in Tiled let you embed extra info into a map - like a spawn point or custom
  // collision shapes. In the tmx file, there's an object layer with a point named "Spawn Point"
  const spawnPoint: any = map.findObject('Objects', obj => obj.name === 'Spawn Point')
  player = scene.physics.add
    .sprite(spawnPoint.x, spawnPoint.y, 'atlas', 'misa-front')
    .setSize(30, 40)
    .setOffset(0, 24)

  scene.physics.add.collider(player, worldLayer)

  const anims = scene.anims
  anims.create({
    key: 'misa-left-walk',
    frames: anims.generateFrameNames('atlas', { prefix: 'misa-left-walk.', start: 0, end: 3, zeroPad: 3 }),
    frameRate: 10,
    repeat: -1,
  })
  anims.create({
    key: 'misa-right-walk',
    frames: anims.generateFrameNames('atlas', { prefix: 'misa-right-walk.', start: 0, end: 3, zeroPad: 3 }),
    frameRate: 10,
    repeat: -1,
  })
  anims.create({
    key: 'misa-front-walk',
    frames: anims.generateFrameNames('atlas', { prefix: 'misa-front-walk.', start: 0, end: 3, zeroPad: 3 }),
    frameRate: 10,
    repeat: -1,
  })
  anims.create({
    key: 'misa-back-walk',
    frames: anims.generateFrameNames('atlas', { prefix: 'misa-back-walk.', start: 0, end: 3, zeroPad: 3 }),
    frameRate: 10,
    repeat: -1,
  })
}

function handleInput(scene: Scene, worldLayer: Tilemaps.StaticTilemapLayer) {
}

function handleDebug(scene: Scene, worldLayer: Tilemaps.StaticTilemapLayer) {
  scene.input.keyboard.on('keydown_D', event => {
    scene.children.list.forEach(c => {if (c.type === 'Graphics') c.destroy()})

    if (debugEnabled) {
      debugEnabled = false
    } else {
      debugEnabled = true
      scene.physics.world.createDebugGraphic()

      // Create worldLayer collision graphic above the player, but below the help text
    const graphicsDebug = scene.add
      .graphics()
      .setAlpha(0.75)
      .setDepth(20)
      worldLayer.renderDebug(graphicsDebug, {
        tileColor: null, // Color of non-colliding tiles
        collidingTileColor: new Phaser.Display.Color(243, 134, 48, 255), // Color of colliding tiles
        faceColor: new Phaser.Display.Color(40, 39, 37, 255), // Color of colliding face edges
      })
    }
  })
}

function update(time, delta) {
  const speed = 175
  const prevVelocity = player.body.velocity.clone()

  // Stop any previous movement from the last frame
  player.body.setVelocity(0)

  // Horizontal movement
  if (cursors.left.isDown) {
    player.body.setVelocityX(-speed)
  } else if (cursors.right.isDown) {
    player.body.setVelocityX(speed)
  }

  // Vertical movement
  if (cursors.up.isDown) {
    player.body.setVelocityY(-speed)
  } else if (cursors.down.isDown) {
    player.body.setVelocityY(speed)
  }

  // Normalize and scale the velocity so that player can't move faster along a diagonal
  player.body.velocity.normalize().scale(speed)

  // Update the animation last and give left/right animations precedence over up/down animations
  if (cursors.left.isDown) {
    player.anims.play('misa-left-walk', true)
  } else if (cursors.right.isDown) {
    player.anims.play('misa-right-walk', true)
  } else if (cursors.up.isDown) {
    player.anims.play('misa-back-walk', true)
  } else if (cursors.down.isDown) {
    player.anims.play('misa-front-walk', true)
  } else {
    player.anims.stop()

    // If we were moving, pick and idle frame to use
    if (prevVelocity.x < 0) player.setTexture('atlas', 'misa-left')
    else if (prevVelocity.x > 0) player.setTexture('atlas', 'misa-right')
    else if (prevVelocity.y < 0) player.setTexture('atlas', 'misa-back')
    else if (prevVelocity.y > 0) player.setTexture('atlas', 'misa-front')
  }
}
