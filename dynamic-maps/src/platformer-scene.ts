
import Player from './player'

export default class PlatformerScene extends Phaser.Scene {

  constructor() {
    super({ key: 'PlatformerScene' })
  }

  preload(): void {
    const assetsPath = '../dynamic-maps/assets'
    const spriteImage = `${assetsPath}/spritesheets/0x72-industrial-player-32px-extruded.png`
    const frameConfig = { frameWidth: 32, frameHeight: 32, margin: 1, spacing: 2 }

    this.load.spritesheet('player', spriteImage, frameConfig)
    this.load.image('tiles', `${assetsPath}/tilesets/0x72-industrial-tileset-32px-extruded.png`)
    this.load.tilemapTiledJSON('map', `${assetsPath}/tilemaps/platformer.json`)
  }

  controls
  marker
  shiftKey
  map
  groundLayer: Phaser.Tilemaps.DynamicTilemapLayer
  spikeGroup: Phaser.Physics.Arcade.StaticGroup
  player: Player
  debugEnabled: boolean = false

  create(): void {
    this.map = this.make.tilemap({ key: 'map' })
    const tiles = this.map.addTilesetImage('0x72-industrial-tileset-32px-extruded', 'tiles')

    this.map.createDynamicLayer('Background', tiles)
    this.groundLayer = this.map.createDynamicLayer('Ground', tiles)
    this.map.createDynamicLayer('Foreground', tiles)

    // Instantiate a player instance at the location of the "Spawn Point" object in the Tiled map.
    // Note: instead of storing the player in a global variable, it's stored as a property of the
    // scene.
    const spawnPoint = this.map.findObject('Objects', obj => obj.name === 'Spawn Point')
    this.player = new Player(this, spawnPoint.x, spawnPoint.y)
    
    // Collide the player against the ground layer - here we are grabbing the sprite property from
    // the player (since the Player class is not a Phaser.Sprite).
    this.groundLayer.setCollisionByProperty({ collides: true })
    this.physics.add.collider(this.player.sprite, this.groundLayer)

    this.cameras.main.startFollow(this.player.sprite)
    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels)
    
    // Create a physics group - useful for colliding the player against all the spikes
    this.spikeGroup = this.physics.add.staticGroup()

    // Loop over each Tile and replace spikes (tile index 77) with custom sprites
    this.groundLayer.forEachTile(tile => {
      if(tile.index === 77) {
        // A sprite has its origin at the center, so place the sprite at the center of the tile
        const x = tile.getCenterX()
        const y = tile.getCenterY()
        const spike = this.spikeGroup.create(x, y, 'spike')

        // The map has spike tiles that have been rotated in Tiled ("z" key), so parse out that angle
        // to the correct body placement
        spike.rotation = tile.rotation
        if (spike.angle === 0) spike.body.setSize(32, 6).setOffset(0, 26)
        else if (spike.angle === -90) spike.body.setSize(6, 32).setOffset(26, 0)
        else if (spike.angle === 90) spike.body.setSize(6, 32).setOffset(0, 0)

        // And lastly, remove the spike tile from the layer
        this.groundLayer.removeTileAt(tile.x, tile.y)
      }
    })

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

    this.setUpMarkerGraphics(this)
    this.setUpHelpfulText(this)
  }

  setUpMarkerGraphics({add}): void {
    // Create a simple graphic that can be used to show which tile the mouse is over
    this.marker = add.graphics()
    this.marker.lineStyle(5, 0xffffff, 1)
    this.marker.strokeRect(0, 0, this.map.tileWidth, this.map.tileHeight)
    this.marker.lineStyle(3, 0xff4f99, 1)
    this.marker.strokeRect(0, 0, this.map.tileWidth, this.map.tileHeight)
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
    // Convert the mouse position to world position within the camera
    const { x, y }: any = this.input.activePointer.positionToCamera(this.cameras.main)

    this.updateMarker(x, y)
    this.drawTiles(x, y)

    // Allow the player to respond to key presses and move itself
    this.player.update()

    if (this.player.sprite.y > this.groundLayer.height) {
      this.player.destroy()
      this.scene.restart()
    }
  }

  updateMarker(x: number, y: number): void {
    // Place the marker in world space, but snap it to the tile grid. If we convert world -> tile and
    // then tile -> world, we end up with the position of the tile under the pointer
    const { x: pointerX, y: pointerY } = this.groundLayer.worldToTileXY(x, y)
    const { x: snappedX, y: snappedY } = this.groundLayer.tileToWorldXY(pointerX, pointerY)
    this.marker.setPosition(snappedX, snappedY)
  }

  drawTiles(x: number, y: number): void {
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
}
