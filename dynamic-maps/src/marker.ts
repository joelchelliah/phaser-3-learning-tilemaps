import { Scene, Tilemaps, GameObjects } from 'phaser'

/**
 * A class that visualizes the mouse position within a tilemap. Call its update method from the
 * scene's update and call its destroy method when you're done with it.
 */

export default class Marker {
    private scene: Scene
    private graphics: GameObjects.Graphics
    private map: Tilemaps.Tilemap

  constructor(scene: Scene, map: Tilemaps.Tilemap) {
    this.map = map
    this.scene = scene

    this.graphics = this.scene.add.graphics()
    this.graphics.lineStyle(5, 0xffffff, 1)
    this.graphics.strokeRect(0, 0, map.tileWidth, map.tileHeight)
    this.graphics.lineStyle(3, 0xff4f78, 1)
    this.graphics.strokeRect(0, 0, map.tileWidth, map.tileHeight)
  }

  update(x: number, y: number): void {
    // Place the marker in world space, but snap it to the tile grid. If we convert world -> tile and
    // then tile -> world, we end up with the position of the tile under the pointer
    const { x: pointerX, y: pointerY } = this.map.worldToTileXY(x, y)
    const { x: snappedX, y: snappedY } = this.map.tileToWorldXY(pointerX, pointerY)

    this.graphics.setPosition(snappedX, snappedY)
  }

  destroy() {
    this.graphics.destroy()
  }
}
