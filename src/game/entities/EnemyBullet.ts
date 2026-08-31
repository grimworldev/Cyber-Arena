import { checkWallCollision } from "../systems/Collision";

import type { Wall } from "../world/Map";

export class EnemyBullet {
  private x: number;
  private y: number;

  private readonly speed = 400;

  private readonly radius = 5;

  private readonly damage: number;

  private velocityX: number;
  private velocityY: number;

  private alive = true;

  constructor(x: number, y: number, rotation: number, damage: number) {
    this.x = x + Math.cos(rotation) * 25;

    this.y = y + Math.sin(rotation) * 25;

    this.velocityX = Math.cos(rotation) * this.speed;

    this.velocityY = Math.sin(rotation) * this.speed;

    this.damage = damage;
  }

  update(deltaTime: number, walls: Wall[]) {
    if (!this.alive) {
      return;
    }

    this.x += this.velocityX * deltaTime;

    this.y += this.velocityY * deltaTime;

    const bounds = {
      x: this.x - this.radius,

      y: this.y - this.radius,

      width: this.radius * 2,

      height: this.radius * 2,
    };

    if (checkWallCollision(bounds, walls)) {
      this.alive = false;
    }

    if (this.x < 0 || this.y < 0 || this.x > 1600 || this.y > 1600) {
      this.alive = false;
    }
  }

  getDamage() {
    return this.damage;
  }

  getPosition() {
    return {
      x: this.x,
      y: this.y,
    };
  }

  isAlive() {
    return this.alive;
  }

  destroy() {
    this.alive = false;
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (!this.alive) {
      return;
    }

    ctx.fillStyle = "#ff3355";

    ctx.fillRect(
      this.x - this.radius,

      this.y - this.radius,

      this.radius * 2,

      this.radius * 2
    );
  }
}
