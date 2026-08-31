export type PickupType = "health" | "ammo";

export class Pickup {
  x: number;
  y: number;

  type: PickupType;

  amount: number;

  radius = 12;

  alive = true;

  private pulse = 0;

  constructor(x: number, y: number, type: PickupType, amount: number) {
    this.x = x;
    this.y = y;

    this.type = type;

    this.amount = amount;
  }

  update(delta: number): void {
    this.pulse += delta * 5;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const scale = 1 + Math.sin(this.pulse) * 0.08;

    ctx.save();

    ctx.translate(this.x, this.y);

    ctx.scale(scale, scale);

    if (this.type === "health") {
      ctx.fillStyle = "#00ff88";

      ctx.fillRect(-10, -10, 20, 20);

      ctx.fillStyle = "#ffffff";

      ctx.fillRect(-3, -7, 6, 14);

      ctx.fillRect(-7, -3, 14, 6);
    } else {
      ctx.fillStyle = "#ffc400";

      ctx.fillRect(-9, -11, 18, 22);

      ctx.fillStyle = "#111";

      ctx.fillRect(-4, -6, 8, 12);
    }

    ctx.restore();
  }
}
