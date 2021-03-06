import { Scene, Physics } from 'phaser'

export default class Player {
  private scene: Scene
  private keys: any
  public sprite: Physics.Arcade.Sprite

  constructor(scene: Scene, x: number, y: number) {
    this.scene = scene

    this.createAnimations()
    this.createSprite(x, y)
    this.setUpKeyboardControls()

    this.sprite.body.enable = true
  }

  freeze() {
    this.sprite.body.enable = false
  }

  update() {
    const {keys, sprite } = this
    const onGround = sprite.body.blocked.down
    const acceleration = onGround ? 600 : 200

    // Apply horizontal acceleration when left/a or right/d are applied
    if (keys.left.isDown || keys.a.isDown) {
      sprite.setAccelerationX(-acceleration)
      // No need to have a separate set of graphics for running to the 
      // left & to the right. Instead we can just mirror the sprite.
      sprite.setFlipX(true)
    } else if (keys.right.isDown || keys.d.isDown) {
      sprite.setAccelerationX(acceleration)
      sprite.setFlipX(false)
    } else {
      sprite.setAccelerationX(0)
    }

    // Only allow the player to jump if they are on the ground
    if (onGround && (keys.up.isDown || keys.w.isDown)) {
      sprite.setVelocityY(-500)
    }

    // Update the animation/texture based on the state of the player
    if (onGround) {
      if (sprite.body.velocity.x !== 0) sprite.anims.play('player-run', true)
      else sprite.anims.play('player-idle', true)
    } else {
      sprite.anims.stop()
      sprite.setTexture('player', 10)
    }
  }

  destroy() {
    this.sprite.destroy()
  }

  private createAnimations(): void {
    // Create the animations we need from the player spritesheet
    const anims = this.scene.anims
    anims.create({
      key: 'player-idle',
      frames: anims.generateFrameNumbers('player', { start: 0, end: 3 }),
      frameRate: 3,
      repeat: -1,
    })
    anims.create({
      key: 'player-run',
      frames: anims.generateFrameNumbers('player', { start: 8, end: 15 }),
      frameRate: 12,
      repeat: -1,
    })
  }

  private createSprite(x: number, y:number): void {
    // Create the physics-based sprite that we will move around and animate
    this.sprite = this.scene.physics.add
      .sprite(x, y, 'player', 0)
      .setDrag(1000, 0)
      .setMaxVelocity(300, 400)
      .setSize(18, 24)
      .setOffset(7, 9)
  }

  private setUpKeyboardControls(): void {
    // Track arrow keys & WASD
    const { LEFT, RIGHT, UP, W, A, D } = Phaser.Input.Keyboard.KeyCodes
    this.keys = this.scene.input.keyboard.addKeys({
      left: LEFT,
      right: RIGHT,
      up: UP,
      w: W,
      a: A,
      d: D,
    })
  }
}
