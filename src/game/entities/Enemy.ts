export interface EnemyStats {
  health: number;
  speed: number;
  damage: number;
  fireInterval: number;
  burstCount: number;
  burstDelay: number;
}

export class Enemy {
  x: number;
  y: number;

  radius = 14;

  health: number;
  maxHealth: number;

  speed: number;
  damage: number;

  fireInterval: number;

  burstCount: number;
  burstDelay: number;

  lastShotTime = 0;

  burstShotsRemaining = 0;
  nextBurstShotTime = 0;

  spawnTime = 0;
  spawnDuration = 450;

  // ============================================
  // SHOOT DELAY
  // ============================================
  //
  // Enemies cannot fire until this many ms
  // have passed since their spawnTime.
  // ============================================

  private readonly shootDelay = 1500;

  private lastX: number;
  private lastY: number;

  private stuckTimer = 0;

  constructor(x: number, y: number, stats: EnemyStats) {
    this.x = x;
    this.y = y;

    this.health = stats.health;
    this.maxHealth = stats.health;

    this.speed = stats.speed;
    this.damage = stats.damage;

    this.fireInterval = stats.fireInterval;

    this.burstCount = stats.burstCount;
    this.burstDelay = stats.burstDelay;

    this.lastX = x;
    this.lastY = y;
  }

  update(
    delta: number,
    playerX: number,
    playerY: number,
    canMove: (x: number, y: number, radius: number) => boolean,
    currentTime: number
  ): void {
    // Spawn animation
    if (currentTime - this.spawnTime < this.spawnDuration) {
      return;
    }

    const dx = playerX - this.x;
    const dy = playerY - this.y;

    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= 1) {
      return;
    }

    const dirX = dx / distance;
    const dirY = dy / distance;

    const movement = this.speed * delta;

    // Try direct movement
    const newX = this.x + dirX * movement;
    const newY = this.y + dirY * movement;

    if (canMove(newX, newY, this.radius)) {
      this.x = newX;
      this.y = newY;
    } else {
      // Try X
      const xOnly = this.x + dirX * movement;

      if (canMove(xOnly, this.y, this.radius)) {
        this.x = xOnly;
      }

      // Try Y
      const yOnly = this.y + dirY * movement;

      if (canMove(this.x, yOnly, this.radius)) {
        this.y = yOnly;
      }
    }

    // Stuck detection
    const movedX = Math.abs(this.x - this.lastX);
    const movedY = Math.abs(this.y - this.lastY);

    if (movedX < 0.1 && movedY < 0.1) {
      this.stuckTimer += delta;
    } else {
      this.stuckTimer = 0;
    }

    this.lastX = this.x;
    this.lastY = this.y;

    // Try to escape obstacles
    if (this.stuckTimer >= 0.25) {
      this.tryUnstuck(dirX, dirY, movement, canMove);
      this.stuckTimer = 0;
    }
  }

  private tryUnstuck(
    dirX: number,
    dirY: number,
    movement: number,
    canMove: (x: number, y: number, radius: number) => boolean
  ): void {
    const sideX = -dirY;
    const sideY = dirX;

    const directions = [
      {
        x: sideX,
        y: sideY,
      },
      {
        x: -sideX,
        y: -sideY,
      },
      {
        x: sideX + dirX,
        y: sideY + dirY,
      },
      {
        x: -sideX + dirX,
        y: -sideY + dirY,
      },
    ];

    for (const direction of directions) {
      const length = Math.sqrt(
        direction.x * direction.x + direction.y * direction.y
      );

      if (length === 0) {
        continue;
      }

      const nx = direction.x / length;
      const ny = direction.y / length;

      const newX = this.x + nx * movement * 3;
      const newY = this.y + ny * movement * 3;

      if (canMove(newX, newY, this.radius)) {
        this.x = newX;
        this.y = newY;

        return;
      }
    }
  }

  beginBurst(currentTime: number): void {
    this.burstShotsRemaining = this.burstCount;
    this.nextBurstShotTime = currentTime;
  }

  canFire(currentTime: number): boolean {
    // ==========================================
    // SPAWN PROTECTION
    // ==========================================
    //
    // Enemy cannot fire until shootDelay ms
    // have passed since it spawned.
    // ==========================================

    if (currentTime - this.spawnTime < this.shootDelay) {
      return false;
    }

    if (this.burstShotsRemaining > 0) {
      if (currentTime >= this.nextBurstShotTime) {
        this.burstShotsRemaining--;

        this.nextBurstShotTime = currentTime + this.burstDelay;

        return true;
      }

      return false;
    }

    if (currentTime - this.lastShotTime >= this.fireInterval) {
      this.lastShotTime = currentTime;

      this.beginBurst(currentTime);

      return true;
    }

    return false;
  }

  takeDamage(amount: number): boolean {
    this.health -= amount;

    if (this.health <= 0) {
      this.health = 0;
      return true;
    }

    return false;
  }

  setSpawnTime(time: number): void {
    this.spawnTime = time;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    ctx.translate(Math.round(this.x), Math.round(this.y));

    // ==========================================
    // CLAMP ELAPSED
    // ==========================================
    //
    // Staggered spawns can set spawnTime in the
    // future, which would otherwise make this
    // negative and pass a negative radius to
    // ctx.arc().
    // ==========================================

    const elapsed = Math.max(0, performance.now() - this.spawnTime);

    // Spawn effect
    if (elapsed < this.spawnDuration) {
      const progress = elapsed / this.spawnDuration;

      ctx.globalAlpha = 1 - progress;

      ctx.beginPath();

      ctx.arc(0, 0, 12 + progress * 32, 0, Math.PI * 2);

      ctx.strokeStyle = "#00ffe1";
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.beginPath();

      ctx.arc(0, 0, 5 + progress * 18, 0, Math.PI * 2);

      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.restore();

      return;
    }

    ctx.globalAlpha = 1;

    // Body
    ctx.fillStyle = "#ff315c";

    ctx.fillRect(-this.radius, -this.radius, this.radius * 2, this.radius * 2);

    // Core
    ctx.fillStyle = "#ffffff";

    ctx.fillRect(-4, -4, 8, 8);

    // Health bar
    const health = this.health / this.maxHealth;

    ctx.fillStyle = "#111111";

    ctx.fillRect(-18, -25, 36, 5);

    ctx.fillStyle = "#00ff88";

    ctx.fillRect(-18, -25, 36 * Math.max(0, health), 5);

    ctx.restore();
  }
}
