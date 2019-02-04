
import { Physics, Tilemaps, Input, Scene } from 'phaser'

import Player from './player'
import Marker from './marker'

type MapAndLayers = { 
  map: Tilemaps.Tilemap, 
  groundLayer: Tilemaps.DynamicTilemapLayer
}

export default class PlatformerScene extends Scene {
  private shiftKey: Input.Keyboard.Key
  
  private map: Tilemaps.Tilemap
  private groundLayer: Tilemaps.DynamicTilemapLayer
  private spikeGroup: Physics.Arcade.StaticGroup

  private marker: Marker
  private player: Player

  private isPlayerDead: boolean = false
  private debugEnabled: boolean = false

  preload(): void {
    const assetsPath = '../dynamic-maps/assets'
    const spriteImage = `${assetsPath}/spritesheets/0x72-industrial-player-32px-extruded.png`
    const frameConfig = { frameWidth: 32, frameHeight: 32, margin: 1, spacing: 2 }

    this.load.spritesheet('player', spriteImage, frameConfig)
    this.load.image('spike', `${assetsPath}/images/0x72-industrial-spike.png`)
    this.load.image('tiles', `${assetsPath}/tilesets/0x72-industrial-tileset-32px-extruded.png`)
    this.load.tilemapTiledJSON('map', `${assetsPath}/tilemaps/platformer.json`)
  }

  create(): void {
    const mapAndLayers = this.createMap()

    this.isPlayerDead = false
    this.player = this.createPlayer(mapAndLayers)

    this.map = mapAndLayers.map
    this.groundLayer = mapAndLayers.groundLayer

    this.spikeGroup = this.physics.add.staticGroup()
    this.groundLayer.forEachTile(tile => {
      if(tile.index === 77) {
        const spike = this.spikeGroup.create(tile.getCenterX(), tile.getCenterY(), 'spike')

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

  createPlayer({map, groundLayer}: MapAndLayers): Player {
    const {x, y}: any = map.findObject('Objects', obj => obj.name === 'Spawn Point')
    const player = new Player(this, x, y)

    this.physics.add.collider(player.sprite, groundLayer)
    return player
  }
  
  createMap(): MapAndLayers {
    const map = this.make.tilemap({ key: 'map' })
    const tiles = map.addTilesetImage('0x72-industrial-tileset-32px-extruded', 'tiles')

    map.createDynamicLayer('Background', tiles, 0, 0)
    const groundLayer = map.createDynamicLayer('Ground', tiles, 0, 0)
    map.createDynamicLayer('Foreground', tiles, 0 ,0)
    
    groundLayer.setCollisionByProperty({ collides: true })

    return { map, groundLayer }
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
