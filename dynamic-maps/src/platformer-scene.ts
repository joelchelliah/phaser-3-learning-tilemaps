
import Player from './player'
import Marker from './marker'
import { Physics, Tilemaps } from 'phaser'

export default class PlatformerScene extends Phaser.Scene {

  constructor() {
    super({ key: 'PlatformerScene' })
  }

  preload(): void {
    const assetsPath = '../dynamic-maps/assets'
    const spriteImage = `${assetsPath}/spritesheets/0x72-industrial-player-32px-extruded.png`
    const frameConfig = { frameWidth: 32, frameHeight: 32, margin: 1, spacing: 2 }

    this.load.spritesheet('player', spriteImage, frameConfig)
    this.load.image('spike', `${assetsPath}/images/0x72-industrial-spike.png`)
    this.load.image('tiles', `${assetsPath}/tilesets/0x72-industrial-tileset-32px-extruded.png`)
    this.load.tilemapTiledJSON('map', `${assetsPath}/tilemaps/platformer.json`)
  }

  controls
  shiftKey
  map: Tilemaps.Tilemap
  groundLayer: Tilemaps.DynamicTilemapLayer
  spikeGroup: Physics.Arcade.StaticGroup

  marker: Marker
  player: Player

  isPlayerDead: boolean = false
  debugEnabled: boolean = false

  create(): void {
    this.map = this.make.tilemap({ key: 'map' })
    const tiles = this.map.addTilesetImage('0x72-industrial-tileset-32px-extruded', 'tiles')

    this.map.createDynamicLayer('Background', tiles, 0, 0)
    this.groundLayer = this.map.createDynamicLayer('Ground', tiles, 0, 0)
    this.map.createDynamicLayer('Foreground', tiles,0 ,0)

    // Instantiate a player instance at the location of the "Spawn Point" object in the Tiled map.
    // Note: instead of storing the player in a global variable, it's stored as a property of the
    // scene.
    const spawnPoint: any = this.map.findObject('Objects', obj => obj.name === 'Spawn Point')
    console.log('creating player!')
    this.player = new Player(this, spawnPoint.x, spawnPoint.y)
    
    // Collide the player against the ground layer - here we are grabbing the sprite property from
    // the player (since the Player class is not a Phaser.Sprite).
    this.groundLayer.setCollisionByProperty({ collides: true })
    this.physics.add.collider(this.player.sprite, this.groundLayer)

    // The map contains a row of spikes. The spike only take a small sliver of the tile graphic, so
    // if we let arcade physics treat the spikes as colliding, the player will collide while the
    // sprite is hovering over the spikes. We'll remove the spike tiles and turn them into sprites
    // so that we give them a more fitting hitbox.
    this.spikeGroup = this.physics.add.staticGroup()
    this.groundLayer.forEachTile(tile => {
      if(tile.index === 77) {
        // A sprite has its origin at the center, so place the sprite at the center of the tile
        const spike = this.spikeGroup.create(tile.getCenterX(), tile.getCenterY(), 'spike')

        // The map has spike tiles that have been rotated in Tiled ("z" key), so parse out that angle
        // to the correct body placement
        spike.rotation = tile.rotation
        if (spike.angle === 0) spike.body.setSize(32, 6).setOffset(0, 26)
        else if (spike.angle === -90) spike.body.setSize(6, 32).setOffset(26, 0)
        else if (spike.angle === 90) spike.body.setSize(6, 32).setOffset(0, 0)

        this.groundLayer.removeTileAt(tile.x, tile.y)
      }
    })

    this.cameras.main.startFollow(this.player.sprite)
    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels)

    if (this.debugEnabled) {
      const graphicsDebug = this.add
        .graphics()
        .setAlpha(0.5)
        .setDepth(20)

        this.groundLayer.renderDebug(graphicsDebug, {
          tileColor: null, // Color of non-colliding tiles
          collidingTileColor: new Phaser.Display.Color(243, 134, 48, 255), // Color of colliding tiles
          faceColor: new Phaser.Display.Color(40, 39, 37, 255), // Color of colliding face edges
        })
    }

    this.shiftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT)
    console.log('creating marker!')
    console.log('marker :', this.marker)
    this.marker = new Marker(this, this.map)
    console.log('marker :', this.marker)

    this.setUpHelpfulText(this)
  }

  setUpHelpfulText({add}): void {
    // Help text that has a "fixed" position on the screen
    add.text(16, 16, 'Arrow keys to scroll\nLeft-click to draw tiles\nShift + left-click to erase', {
      font: '18px monospace',
      fill: '#000000',
      padding: { x: 20, y: 10 },
      backgroundColor: '#ffffff',
    }).setScrollFactor(0)
  }

  update(time, delta): void {
    if (this.isPlayerDead) return

    // Convert the mouse position to world position within the camera
    const { x, y }: any = this.input.activePointer.positionToCamera(this.cameras.main)

    this.player.update()
    this.marker.update(x, y)
    this.drawTile(x, y)
    this.handlePlayerDeath()
  }

  drawTile(x: number, y: number): void {
    // Draw tiles (only within the groundLayer)
    const pointer = this.input.activePointer

    if (pointer.isDown) {
      if (this.shiftKey.isDown) this.groundLayer.removeTileAtWorldXY(x, y)
      else {
        const tile = this.groundLayer.putTileAtWorldXY(6, x, y)
        tile.setCollision(true)
      }
    }
  }

  handlePlayerDeath(): void {
    // @ts-ignore: Whining about ArcadeColliderType
    const isPlayerOnSpikes = this.physics.world.overlap(this.player.sprite, this.spikeGroup)
    const isPlayerBelowScreen = this.player.sprite.y > this.groundLayer.height

    if (isPlayerOnSpikes || isPlayerBelowScreen) {
      // Flag that the player is dead so that we can stop update from running in the future
      this.isPlayerDead = true

      // Freeze the player to leave them on screen while fading but remove the marker immediately
      this.player.freeze()
      this.marker.destroy()

      const cam = this.cameras.main
      cam.shake(100, 0.05)
      cam.fade(250, 0, 0, 0)
      cam.once('camerafadeoutcomplete', () => {
        this.player.destroy()
        this.scene.restart()
      })
    }
  }
}
