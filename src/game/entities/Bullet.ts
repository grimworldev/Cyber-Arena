export type BulletOwner = "player" | "enemy";

export class Bullet {
  x: number;
  y: number;

  vx: number;
  vy: number;

  speed: number;

  damage: number;

  radius: number;

  owner: BulletOwner;

  alive = true;

  constructor(
    x: number,
    y: number,
    angle: number,
    owner: BulletOwner,
    damage: number,
    speed = 700
  ) {
    this.x = x;
    this.y = y;

    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;

    this.speed = speed;

    this.damage = damage;

    this.radius = owner === "player" ? 4 : 5;

    this.owner = owner;
  }

  update(delta: number): void {
    this.x += this.vx * delta;
    this.y += this.vy * delta;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = this.owner === "player" ? "#ffffff" : "#ff315c";

    ctx.fillRect(
      Math.round(this.x - this.radius),
      Math.round(this.y - this.radius),
      this.radius * 2,
      this.radius * 2
    );
  }
}
