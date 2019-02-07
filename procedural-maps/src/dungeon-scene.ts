import {
  Scene, Tilemaps, 
} from 'phaser'
// Dungeon imported through CDN. See index.html
//import Dungeon from '@mikewesthad/dungeon'

import Player from './player'
import TILES from './tile-mapping'
import TilemapVisibility from './tilemap-visibility'

export default class DungeonScene extends Scene {
  private map: Tilemaps.Tilemap
  private groundLayer: Tilemaps.DynamicTilemapLayer
  private stuffLayer: Tilemaps.DynamicTilemapLayer
  private shadowLayer: Tilemaps.DynamicTilemapLayer

  private player: Player
  private dungeon: any // Dungeon
  private tilemapVisibility: TilemapVisibility

  private debugEnabled: boolean = false
  private hasPlayerReachedStairs: boolean = false
  private level: number

  public constructor(config) {
    super(config)
    this.level = 0
  }

  public preload(): void {
    const assetsPath = '../procedural-maps/assets'
    const spriteImage = `${assetsPath}/spritesheets/buch-characters-64px-extruded.png`
    const frameConfig = { frameWidth: 64, frameHeight: 64, margin: 1, spacing: 2 }

    this.load.image('tiles', `${assetsPath}/tilesets/buch-tileset-48px-extruded.png`)
    this.load.spritesheet('characters', spriteImage, frameConfig)
  }

  public create(): void {
    this.level++
    this.hasPlayerReachedStairs = false
    
    // Generate a random world
    // @ts-ignore Dungeon imported through CDN. See index.html
    this.dungeon = new Dungeon({
      width: 50,
      height: 50,
      doorPadding: 2,
      rooms: {
        width: { min: 7, max: 15, onlyOdd: true },
        height: { min: 7, max: 15, onlyOdd: true },
        maxArea: 200,
        maxRooms: 10,
      },
    })

    // this.dungeon.drawToConsole()

    const html = this.dungeon.drawToHtml({
      empty: ' ',
      wall: '📦',
      floor: '☁️',
      door: '🚪',
      floorAttributes: { style: 'opacity: 0.25' },
      containerAttributes: { class: 'dungeon', style: 'line-height: 1' },
    })
    
    // Append the element to an existing element on the page
    document.body.appendChild(html)
    
    // Create a blank tilemap with dimensions matching the dungeon
    this.map = this.make.tilemap({
      tileWidth: 48,
      tileHeight: 48,
      width: this.dungeon.width,
      height: this.dungeon.height,
    })
    const tileset = this.map.addTilesetImage('tiles', null, 48, 48, 1, 2) // 1px margin, 2px spacing
    this.groundLayer = this.map.createBlankDynamicLayer('Ground', tileset).fill(TILES.BLANK) // Wall & floor
    this.stuffLayer = this.map.createBlankDynamicLayer('Stuff', tileset) // Chest, stairs, etc.
    this.shadowLayer = this.map.createBlankDynamicLayer('Shadow', tileset).fill(TILES.BLANK) // Fog
    this.tilemapVisibility = new TilemapVisibility(this.shadowLayer)

    // Use the array of rooms generated to place tiles in the map
    // Note: using an arrow function here so that "this" still refers to our scene
    this.dungeon.rooms.forEach(room => {
      // These room properties are all in grid units (not pixels units)
      const { x, y, width, height, left, right, top, bottom } = room

      // Fill the room (minus the walls) with mostly clean floor tiles (90% of the time), but
      // occasionally place a dirty tile (10% of the time).
      this.groundLayer.weightedRandomize(
        x + 1, y + 1, width - 2, height - 2, // <-- The region we want to randomize
        [
          { index: 6, weight: 9 }, // 9/10 times, use index 6
          { index: [7, 8, 26], weight: 1 }, // 1/10 times, randomly pick 7, 8 or 26
        ]
      )

      // Place the room corners tiles
      this.groundLayer.putTileAt(3, left, top)
      this.groundLayer.putTileAt(4, right, top)
      this.groundLayer.putTileAt(23, right, bottom)
      this.groundLayer.putTileAt(22, left, bottom)

      // Place the non-corner wall tiles using fill with x, y, width, height parameters
      this.groundLayer.fill(39, left + 1, top, width - 2, 1) // Top
      this.groundLayer.fill(1, left + 1, bottom, width - 2, 1) // Bottom
      this.groundLayer.fill(21, left, top + 1, 1, height - 2) // Left
      this.groundLayer.fill(19, right, top + 1, 1, height - 2) // Right

      // Dungeons have rooms that are connected with doors. Each door has an x & y relative to the
      // room's location. Each direction has a different door to tile mapping.
      var doors = room.getDoorLocations() // → Returns an array of {x, y} objects
      for (var i = 0; i < doors.length; i++) {
        if (doors[i].y === 0) {
          this.groundLayer.putTilesAt(TILES.DOOR.TOP, x + doors[i].x - 1, y + doors[i].y)
        } else if (doors[i].y === room.height - 1) {
          this.groundLayer.putTilesAt(TILES.DOOR.BOTTOM, x + doors[i].x - 1, y + doors[i].y)
        } else if (doors[i].x === 0) {
          this.groundLayer.putTilesAt(TILES.DOOR.LEFT, x + doors[i].x, y + doors[i].y - 1)
        } else if (doors[i].x === room.width - 1) {
          this.groundLayer.putTilesAt(TILES.DOOR.RIGHT, x + doors[i].x, y + doors[i].y - 1)
        }
      }
    })

    // Separate out the rooms into:
    //  - The starting room (index = 0)
    //  - A random room to be designated as the end room (with stairs and nothing else)
    //  - An array of 90% of the remaining rooms, for placing random stuff (leaving 10% empty)
    const rooms = this.dungeon.rooms.slice()
    const startRoom: any = rooms.shift()
    const endRoom: any = Phaser.Utils.Array.RemoveRandomElement(rooms)
    const otherRooms = Phaser.Utils.Array.Shuffle(rooms).slice(0, rooms.length * 0.9)

    // Place the stairs
    this.stuffLayer.putTileAt(TILES.STAIRS, endRoom.centerX, endRoom.centerY)

    // Place stuff in the 90% "otherRooms"
    otherRooms.forEach(room => {
      var rand = Math.random()
      if (rand <= 0.25) {
        // 25% chance of chest
        this.stuffLayer.putTileAt(TILES.CHEST, room.centerX, room.centerY)
      } else if (rand <= 0.5) {
        // 50% chance of a pot anywhere in the room... except don't block a door!
        const x = Phaser.Math.Between(room.left + 2, room.right - 2)
        const y = Phaser.Math.Between(room.top + 2, room.bottom - 2)
        this.stuffLayer.weightedRandomize(x, y, 1, 1, TILES.POT)
      } else {
        // 25% of either 2 or 4 towers, depending on the room size
        if (room.height >= 9) {
          this.stuffLayer.putTilesAt(TILES.TOWER, room.centerX - 1, room.centerY + 1)
          this.stuffLayer.putTilesAt(TILES.TOWER, room.centerX + 1, room.centerY + 1)
          this.stuffLayer.putTilesAt(TILES.TOWER, room.centerX - 1, room.centerY - 2)
          this.stuffLayer.putTilesAt(TILES.TOWER, room.centerX + 1, room.centerY - 2)
        } else {
          this.stuffLayer.putTilesAt(TILES.TOWER, room.centerX - 1, room.centerY - 1)
          this.stuffLayer.putTilesAt(TILES.TOWER, room.centerX + 1, room.centerY - 1)
        }
      }
    })

    // Not exactly correct for the tileset since there are more possible floor tiles, but this will
    // do for the example.
    this.groundLayer.setCollisionByExclusion([-1, 6, 7, 8, 26])
    this.stuffLayer.setCollisionByExclusion([-1, 6, 7, 8, 26])

    this.stuffLayer.setTileIndexCallback(TILES.STAIRS, () => {
      this.stuffLayer.setTileIndexCallback(TILES.STAIRS, null, this)
      this.hasPlayerReachedStairs = true
      this.player.freeze()
      const cam = this.cameras.main
      cam.fade(250, 0, 0, 0)
      cam.once('camerafadeoutcomplete', () => {
        this.player.destroy()
        this.scene.restart()
      })
    }, this)

    // Place the player in the start room.
    const { x, y } = this.map.tileToWorldXY(startRoom.centerX, startRoom.centerY)
    this.player = new Player(this, x, y)

    // Watch the player and layer for collisions, for the duration of the scene:
    this.physics.add.collider(this.player.sprite, this.groundLayer)
    this.physics.add.collider(this.player.sprite, this.stuffLayer)

    const camera = this.cameras.main
    camera.startFollow(this.player.sprite)
    camera.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels)

    // Help text that has a "fixed" position on the screen
    this.add
      .text(16, 16, `Find the stairs. Go deeper.\nCurrent level: ${this.level}`, {
        font: '18px monospace',
        fill: '#000000',
        padding: { x: 20, y: 10 },
        backgroundColor: '#ffffff',
      })
      .setScrollFactor(0)
  }

  public update(time, delta): void {
    this.player.update()

    // Find the player's room using another helper method from the dungeon that converts from
    // dungeon XY (in grid units) to the corresponding room instance
    const { x, y } = this.groundLayer.worldToTileXY(this.player.sprite.x, this.player.sprite.y)
    const playerRoom = this.dungeon.getRoomAt(x, y)

    this.tilemapVisibility.setActiveRoom(playerRoom)
  }
}
