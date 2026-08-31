import { Input } from "../systems/Input";

export class Player {
  x: number;
  y: number;

  angle = 0;

  radius = 14;

  speed = 280;

  maxHealth = 100;
  health = 100;

  magazineSize = 30;
  magazine = 30;

  reserveAmmo = 360;
  maxReserveAmmo = 800;

  fireRate = 100;
  lastShotTime = 0;

  isReloading = false;

  reloadDuration = 1500;
  reloadStartTime = 0;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  update(
    delta: number,
    input: Input,
    currentTime: number,
    worldWidth: number,
    worldHeight: number,
    canMove: (x: number, y: number, radius: number) => boolean
  ): void {
    // ==========================================
    // RELOAD
    // ==========================================

    if (this.isReloading) {
      if (currentTime - this.reloadStartTime >= this.reloadDuration) {
        this.finishReload();
      }
    }

    // ==========================================
    // MOVEMENT INPUT
    // ==========================================

    let dx = 0;
    let dy = 0;

    if (input.isKeyDown("KeyW") || input.isKeyDown("ArrowUp")) {
      dy--;
    }

    if (input.isKeyDown("KeyS") || input.isKeyDown("ArrowDown")) {
      dy++;
    }

    if (input.isKeyDown("KeyA") || input.isKeyDown("ArrowLeft")) {
      dx--;
    }

    if (input.isKeyDown("KeyD") || input.isKeyDown("ArrowRight")) {
      dx++;
    }

    // ==========================================
    // NORMALIZE MOVEMENT
    // ==========================================

    if (dx !== 0 || dy !== 0) {
      const length = Math.sqrt(dx * dx + dy * dy);

      dx /= length;
      dy /= length;

      const movement = this.speed * delta;

      const moveX = dx * movement;
      const moveY = dy * movement;

      // ========================================
      // COLLISION - X AXIS
      // ========================================

      const nextX = this.x + moveX;

      if (canMove(nextX, this.y, this.radius)) {
        this.x = nextX;
      }

      // ========================================
      // COLLISION - Y AXIS
      // ========================================

      const nextY = this.y + moveY;

      if (canMove(this.x, nextY, this.radius)) {
        this.y = nextY;
      }
    }

    // ==========================================
    // WORLD BOUNDARY
    // ==========================================

    this.x = Math.max(this.radius, Math.min(worldWidth - this.radius, this.x));

    this.y = Math.max(this.radius, Math.min(worldHeight - this.radius, this.y));

    // ==========================================
    // AIM
    // ==========================================

    const mouseX = input.mouseX;
    const mouseY = input.mouseY;

    const aimX = mouseX - this.x;
    const aimY = mouseY - this.y;

    this.angle = Math.atan2(aimY, aimX);

    // ==========================================
    // SHOOT
    // ==========================================

    if (!this.isReloading && input.isMouseDown()) {
      this.shoot(currentTime);
    }

    // ==========================================
    // AUTO RELOAD
    // ==========================================

    if (this.magazine <= 0 && this.reserveAmmo > 0 && !this.isReloading) {
      this.startReload(currentTime);
    }
  }

  shoot(currentTime: number): boolean {
    if (this.isReloading) {
      return false;
    }

    if (this.magazine <= 0) {
      return false;
    }

    if (currentTime - this.lastShotTime < this.fireRate) {
      return false;
    }

    this.magazine--;

    this.lastShotTime = currentTime;

    return true;
  }

  startReload(currentTime: number): void {
    if (this.isReloading) {
      return;
    }

    if (this.magazine >= this.magazineSize) {
      return;
    }

    if (this.reserveAmmo <= 0) {
      return;
    }

    this.isReloading = true;

    this.reloadStartTime = currentTime;
  }

  finishReload(): void {
    const needed = this.magazineSize - this.magazine;

    const amount = Math.min(needed, this.reserveAmmo);

    this.magazine += amount;

    this.reserveAmmo -= amount;

    this.isReloading = false;
  }

  takeDamage(amount: number): void {
    if (this.health <= 0) {
      return;
    }

    this.health -= amount;

    this.health = Math.max(0, this.health);
  }

  heal(amount: number): void {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  addAmmo(amount: number): void {
    this.reserveAmmo = Math.min(this.maxReserveAmmo, this.reserveAmmo + amount);
  }

  reset(x: number, y: number): void {
    this.x = x;
    this.y = y;

    this.angle = 0;

    this.health = this.maxHealth;

    this.magazine = this.magazineSize;

    this.reserveAmmo = 360;

    this.isReloading = false;

    this.reloadStartTime = 0;

    this.lastShotTime = 0;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    ctx.translate(Math.round(this.x), Math.round(this.y));

    ctx.rotate(this.angle);

    // ========================================
    // PLAYER BODY
    // ========================================

    ctx.fillStyle = "#00ffe1";

    ctx.fillRect(-this.radius, -this.radius, this.radius * 2, this.radius * 2);

    // ========================================
    // PLAYER CORE
    // ========================================

    ctx.fillStyle = "#ffffff";

    ctx.fillRect(-5, -5, 10, 10);

    // ========================================
    // GUN
    // ========================================

    ctx.fillStyle = "#ffffff";

    ctx.fillRect(7, -4, 22, 8);

    ctx.restore();
  }
}
