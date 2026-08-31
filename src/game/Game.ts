import { Player } from "./entities/Player";
import { Enemy } from "./entities/Enemy";
import { Bullet } from "./entities/Bullet";
import { Pickup } from "./entities/Pickup";
import type { PickupType } from "./entities/Pickup";

import { Input } from "./systems/Input";
import { EnemySpawner } from "./systems/EnemySpawner";

import { GameMap } from "./world/Map";

export class Game {
  // ============================================
  // CANVAS
  // ============================================

  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  // ============================================
  // SCREEN RESOLUTION
  // ============================================

  readonly screenWidth = 1280;
  readonly screenHeight = 800;

  // ============================================
  // WORLD
  // ============================================

  private map: GameMap;

  private readonly worldWidth = 1600;
  private readonly worldHeight = 1000;

  // ============================================
  // SYSTEMS
  // ============================================

  private input: Input;
  private spawner: EnemySpawner;

  // ============================================
  // ENTITIES
  // ============================================

  private player: Player;

  private enemies: Enemy[] = [];

  private bullets: Bullet[] = [];

  private pickups: Pickup[] = [];

  // ============================================
  // CAMERA
  // ============================================

  private cameraX = 0;
  private cameraY = 0;

  // ============================================
  // WAVE
  // ============================================

  private wave = 1;

  private waveTransition = false;

  private waveTransitionTimer = 0;

  private readonly waveTransitionDuration = 1.5;

  // ============================================
  // PLAYER DEATH
  // ============================================

  private playerDead = false;

  // ============================================
  // GAME LOOP
  // ============================================

  private running = false;

  private lastTime = 0;

  private accumulator = 0;

  /**
   * Fixed 60 FPS update.
   *
   * 1 / 60 = 0.016666...
   */
  private readonly fixedDelta = 1 / 60;

  // ============================================
  // CONSTRUCTOR
  // ============================================

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    // ==========================================
    // CANVAS RESOLUTION
    // ==========================================

    this.canvas.width = this.screenWidth;
    this.canvas.height = this.screenHeight;

    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Unable to create 2D canvas context.");
    }

    this.ctx = context;

    // Pixel-art rendering
    this.ctx.imageSmoothingEnabled = false;

    // ==========================================
    // INPUT
    // ==========================================

    this.input = new Input(this.canvas);

    // ==========================================
    // MAP
    // ==========================================

    this.map = new GameMap();

    this.map.generate();

    // ==========================================
    // PLAYER
    // ==========================================

    this.player = new Player(this.worldWidth / 2, this.worldHeight / 2);

    // ==========================================
    // ENEMY SPAWNER
    // ==========================================

    this.spawner = new EnemySpawner(this.map);

    // ==========================================
    // CAMERA
    // ==========================================

    this.updateCamera();

    // ==========================================
    // FIRST WAVE
    // ==========================================

    this.startWave();

    // ==========================================
    // INITIAL HUD
    // ==========================================

    this.updateHUD();

    // ==========================================
    // START / DEATH SCREEN BUTTONS
    // ==========================================

    this.setupStartScreen();

    this.setupDeathScreenButtons();
  }

  // ============================================
  // START SCREEN
  // ============================================

  private setupStartScreen(): void {
    const startButton = document.querySelector("#start-button");

    const startScreen = document.querySelector("#start-screen");

    if (!startButton || !startScreen) {
      return;
    }

    startButton.addEventListener("click", () => {
      startScreen.classList.remove("active");

      this.start();
    });
  }

  // ============================================
  // DEATH SCREEN BUTTONS
  // ============================================

  private setupDeathScreenButtons(): void {
    const continueButton = document.querySelector("#btn-continue");

    const restartButton = document.querySelector("#btn-restart");

    if (continueButton) {
      continueButton.addEventListener("click", () => this.continueRun());
    }

    if (restartButton) {
      restartButton.addEventListener("click", () => this.restartRun());
    }
  }

  // ============================================
  // START
  // ============================================

  start(): void {
    if (this.running) {
      return;
    }

    this.running = true;

    this.lastTime = performance.now();

    this.accumulator = 0;

    requestAnimationFrame(this.gameLoop);
  }

  // ============================================
  // GAME LOOP
  // ============================================

  private gameLoop = (currentTime: number): void => {
    if (!this.running) {
      return;
    }

    let frameDelta = (currentTime - this.lastTime) / 1000;

    this.lastTime = currentTime;

    /*
     * Prevent a huge update if the browser
     * tab was inactive.
     */
    frameDelta = Math.min(frameDelta, 0.1);

    this.accumulator += frameDelta;

    // ==========================================
    // FIXED 60 FPS UPDATE
    // ==========================================

    while (this.accumulator >= this.fixedDelta) {
      this.update(this.fixedDelta, currentTime);

      this.accumulator -= this.fixedDelta;
    }

    // ==========================================
    // RENDER
    // ==========================================

    this.render();

    // ==========================================
    // NEXT FRAME
    // ==========================================

    requestAnimationFrame(this.gameLoop);
  };

  // ============================================
  // UPDATE
  // ============================================

  private update(delta: number, currentTime: number): void {
    // ==========================================
    // PLAYER DEAD
    // ==========================================
    //
    // Gameplay pauses on death. The player must
    // click Continue or Restart on the death
    // screen (handled via button listeners, not
    // here) to resume.
    // ==========================================

    if (this.playerDead) {
      return;
    }

    // ==========================================
    // CAMERA
    // ==========================================

    this.updateCamera();

    // ==========================================
    // PLAYER
    // ==========================================

    this.updatePlayer(delta, currentTime);

    // ==========================================
    // ENEMIES
    // ==========================================

    this.updateEnemies(delta, currentTime);

    // ==========================================
    // BULLETS
    // ==========================================

    this.updateBullets(delta);

    // ==========================================
    // PICKUPS
    // ==========================================

    this.updatePickups(delta);

    // ==========================================
    // WAVE
    // ==========================================

    this.updateWave(delta);

    // ==========================================
    // CAMERA
    // ==========================================

    this.updateCamera();

    // ==========================================
    // HUD
    // ==========================================

    this.updateHUD();
  }

  // ============================================
  // PLAYER
  // ============================================

  private updatePlayer(delta: number, currentTime: number): void {
    // ==========================================
    // SCREEN → WORLD MOUSE
    // ==========================================

    const worldMouseX = this.input.mouseX + this.cameraX;

    const worldMouseY = this.input.mouseY + this.cameraY;

    // ==========================================
    // PLAYER ROTATION
    // ==========================================

    this.player.angle = Math.atan2(
      worldMouseY - this.player.y,
      worldMouseX - this.player.x
    );

    // ==========================================
    // IMPORTANT
    // ==========================================
    //
    // Player.update() also reads mouseX/mouseY
    // for rotation.
    //
    // We temporarily give Player WORLD mouse
    // coordinates, then restore the original
    // screen coordinates.
    //
    // This avoids permanently changing Input.
    // ==========================================

    const screenMouseX = this.input.mouseX;

    const screenMouseY = this.input.mouseY;

    this.input.mouseX = worldMouseX;

    this.input.mouseY = worldMouseY;

    // ==========================================
    // OLD MAGAZINE
    // ==========================================

    const oldMagazine = this.player.magazine;

    // ==========================================
    // PLAYER UPDATE
    // ==========================================

    this.player.update(
      delta,
      this.input,
      currentTime,
      this.worldWidth,
      this.worldHeight,
      (x, y, radius) => !this.map.isBlocked(x, y, radius)
    );

    // ==========================================
    // RESTORE SCREEN MOUSE
    // ==========================================

    this.input.mouseX = screenMouseX;

    this.input.mouseY = screenMouseY;

    // ==========================================
    // PLAYER FIRED
    // ==========================================

    if (this.player.magazine < oldMagazine) {
      this.createPlayerBullet();
    }

    // ==========================================
    // MANUAL RELOAD
    // ==========================================

    if (this.input.isKeyDown("KeyR")) {
      this.player.startReload(currentTime);
    }

    // ==========================================
    // PLAYER DEATH
    // ==========================================

    if (this.player.health <= 0) {
      this.killPlayer();
    }
  }

  // ============================================
  // PLAYER BULLET
  // ============================================

  private createPlayerBullet(): void {
    const angle = this.player.angle;

    const offset = 28;

    const bulletX = this.player.x + Math.cos(angle) * offset;

    const bulletY = this.player.y + Math.sin(angle) * offset;

    const bullet = new Bullet(bulletX, bulletY, angle, "player", 20, 850);

    this.bullets.push(bullet);
  }

  // ============================================
  // ENEMIES
  // ============================================

  private updateEnemies(delta: number, currentTime: number): void {
    for (const enemy of this.enemies) {
      if (enemy.health <= 0) {
        continue;
      }

      // ========================================
      // MOVEMENT
      // ========================================

      enemy.update(
        delta,
        this.player.x,
        this.player.y,
        (x, y, radius) => !this.map.isBlocked(x, y, radius),
        currentTime
      );

      // ========================================
      // SHOOTING
      // ========================================

      if (this.enemyHasLineOfSight(enemy)) {
        if (enemy.canFire(currentTime)) {
          this.createEnemyBullet(enemy);
        }
      }

      // ========================================
      // CONTACT DAMAGE
      // ========================================

      const dx = this.player.x - enemy.x;

      const dy = this.player.y - enemy.y;

      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < this.player.radius + enemy.radius) {
        /*
         * Contact damage.
         *
         * This is kept relatively low because
         * the enemy should primarily attack
         * using projectiles.
         */

        this.player.takeDamage(enemy.damage * delta * 2);
      }
    }
  }

  // ============================================
  // ENEMY LINE OF SIGHT
  // ============================================

  private enemyHasLineOfSight(enemy: Enemy): boolean {
    const dx = this.player.x - enemy.x;

    const dy = this.player.y - enemy.y;

    const distance = Math.sqrt(dx * dx + dy * dy);

    /*
     * Enemy does not need to shoot from
     * extremely far away.
     */

    const maxDistance = 900;

    if (distance > maxDistance) {
      return false;
    }

    const steps = Math.ceil(distance / 20);

    for (let i = 1; i < steps; i++) {
      const progress = i / steps;

      const x = enemy.x + dx * progress;

      const y = enemy.y + dy * progress;

      if (this.map.isBlocked(x, y, 3)) {
        return false;
      }
    }

    return true;
  }

  // ============================================
  // ENEMY BULLET
  // ============================================

  private createEnemyBullet(enemy: Enemy): void {
    const angle = Math.atan2(this.player.y - enemy.y, this.player.x - enemy.x);

    const offset = 22;

    const bulletX = enemy.x + Math.cos(angle) * offset;

    const bulletY = enemy.y + Math.sin(angle) * offset;

    /*
     * Enemy bullets are intentionally slower
     * than the player's gun (850) so they can
     * actually be dodged.
     */

    const bulletSpeed = 200;

    const bullet = new Bullet(
      bulletX,
      bulletY,
      angle,
      "enemy",
      enemy.damage,
      bulletSpeed
    );

    this.bullets.push(bullet);
  }

  // ============================================
  // BULLETS
  // ============================================

  private updateBullets(delta: number): void {
    for (const bullet of this.bullets) {
      if (!bullet.alive) {
        continue;
      }

      /*
       * Bullet movement is based on the same
       * fixed delta as everything else.
       *
       * This means bullets are not slowed
       * simply because the browser's render
       * frame rate changes.
       */

      bullet.update(delta);

      // ========================================
      // WORLD BOUNDARY
      // ========================================

      if (
        bullet.x < 0 ||
        bullet.y < 0 ||
        bullet.x > this.worldWidth ||
        bullet.y > this.worldHeight
      ) {
        bullet.alive = false;

        continue;
      }

      // ========================================
      // MAP COLLISION
      // ========================================

      if (this.map.isBlocked(bullet.x, bullet.y, bullet.radius)) {
        bullet.alive = false;

        continue;
      }

      // ========================================
      // PLAYER BULLET
      // ========================================

      if (bullet.owner === "player") {
        for (const enemy of this.enemies) {
          if (enemy.health <= 0) {
            continue;
          }

          const dx = enemy.x - bullet.x;

          const dy = enemy.y - bullet.y;

          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < enemy.radius + bullet.radius) {
            const dead = enemy.takeDamage(bullet.damage);

            bullet.alive = false;

            if (dead) {
              this.handleEnemyDeath(enemy);
            }

            break;
          }
        }
      }

      // ========================================
      // ENEMY BULLET
      // ========================================
      else if (bullet.owner === "enemy") {
        const dx = this.player.x - bullet.x;

        const dy = this.player.y - bullet.y;

        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.player.radius + bullet.radius) {
          this.player.takeDamage(bullet.damage);

          bullet.alive = false;

          if (this.player.health <= 0) {
            this.killPlayer();
          }
        }
      }
    }

    // ========================================
    // REMOVE DEAD BULLETS
    // ========================================

    this.bullets = this.bullets.filter((bullet) => bullet.alive);
  }

  // ============================================
  // ENEMY DEATH
  // ============================================

  private handleEnemyDeath(enemy: Enemy): void {
    // ==========================================
    // 20% DROP CHANCE
    // ==========================================

    if (Math.random() <= 0.2) {
      this.createRandomPickup(enemy.x, enemy.y);
    }
  }

  // ============================================
  // PICKUP
  // ============================================

  private createRandomPickup(x: number, y: number): void {
    const type: PickupType = Math.random() < 0.5 ? "health" : "ammo";

    if (type === "health") {
      this.pickups.push(new Pickup(x, y, "health", 30));

      return;
    }

    // ========================================
    // AMMO DROP
    // ========================================

    const amounts = [30, 60, 90, 120];

    const amount = amounts[Math.floor(Math.random() * amounts.length)];

    this.pickups.push(new Pickup(x, y, "ammo", amount));
  }

  // ============================================
  // PICKUPS
  // ============================================

  private updatePickups(delta: number): void {
    for (const pickup of this.pickups) {
      if (!pickup.alive) {
        continue;
      }

      pickup.update(delta);

      const dx = this.player.x - pickup.x;

      const dy = this.player.y - pickup.y;

      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < this.player.radius + pickup.radius) {
        // ======================================
        // HEALTH
        // ======================================

        if (pickup.type === "health") {
          this.player.heal(pickup.amount);
        }

        // ======================================
        // AMMO
        // ======================================
        else {
          this.player.addAmmo(pickup.amount);
        }

        pickup.alive = false;
      }
    }

    this.pickups = this.pickups.filter((pickup) => pickup.alive);
  }

  // ============================================
  // START WAVE
  // ============================================

  private startWave(): void {
    // ==========================================
    // REGENERATE MAP
    // ==========================================
    //
    // New obstacle layout + random theme every
    // wave, so the player can't rely on a
    // memorized map.
    // ==========================================

    this.map.generate();

    this.ensurePlayerSafe();

    this.enemies = this.spawner.createWave(this.wave);

    const baseSpawnTime = performance.now();

    const spawnStagger = 250;

    this.enemies.forEach((enemy, index) => {
      const jitter = Math.random() * 100;

      enemy.setSpawnTime(baseSpawnTime + index * spawnStagger + jitter);
    });

    this.waveTransition = false;

    this.waveTransitionTimer = 0;
  }

  // ============================================
  // ENSURE PLAYER SAFE
  // ============================================
  //
  // The map regenerates every wave with new
  // obstacles. If the player happens to be
  // standing where a new obstacle spawned,
  // push them to a nearby clear spot instead
  // of leaving them stuck inside a wall.
  // ============================================

  private ensurePlayerSafe(): void {
    if (!this.map.isBlocked(this.player.x, this.player.y, this.player.radius)) {
      return;
    }

    // Try world center first — map generation
    // always keeps the center area clear.
    const centerX = this.worldWidth / 2;
    const centerY = this.worldHeight / 2;

    if (!this.map.isBlocked(centerX, centerY, this.player.radius)) {
      this.player.x = centerX;
      this.player.y = centerY;
      return;
    }

    // Fallback: search outward in a ring for
    // any open spot.
    for (let attempt = 0; attempt < 200; attempt++) {
      const x = 80 + Math.random() * (this.worldWidth - 160);
      const y = 80 + Math.random() * (this.worldHeight - 160);

      if (!this.map.isBlocked(x, y, this.player.radius)) {
        this.player.x = x;
        this.player.y = y;
        return;
      }
    }
  }

  // ============================================
  // WAVE UPDATE
  // ============================================

  private updateWave(delta: number): void {
    // ==========================================
    // REMOVE DEAD ENEMIES
    // ==========================================

    this.enemies = this.enemies.filter((enemy) => enemy.health > 0);

    // ==========================================
    // NEXT WAVE TRANSITION
    // ==========================================

    if (this.waveTransition) {
      this.waveTransitionTimer -= delta;

      if (this.waveTransitionTimer <= 0) {
        this.wave++;

        this.startWave();
      }

      return;
    }

    // ==========================================
    // WAVE CLEARED
    // ==========================================

    if (this.enemies.length === 0) {
      /*
       * No "Wave Clear" message.
       *
       * Just use the short transition before
       * starting the next wave.
       */

      this.waveTransition = true;

      this.waveTransitionTimer = this.waveTransitionDuration;
    }
  }

  // ============================================
  // PLAYER DEATH
  // ============================================

  private killPlayer(): void {
    if (this.playerDead) {
      return;
    }

    this.playerDead = true;

    // ==========================================
    // CLEAR COMBAT
    // ==========================================

    this.bullets = [];

    this.enemies = [];

    this.pickups = [];

    this.updateHUD();
  }

  // ============================================
  // CONTINUE RUN
  // ============================================
  //
  // Respawns the player at full health/ammo but
  // KEEPS the current wave number. Generates a
  // fresh map, same as any new wave would.
  // ============================================

  private continueRun(): void {
    if (!this.playerDead) {
      return;
    }

    this.player.reset(this.worldWidth / 2, this.worldHeight / 2);

    this.playerDead = false;

    this.bullets = [];

    this.pickups = [];

    this.updateCamera();

    this.startWave();

    this.updateHUD();
  }

  // ============================================
  // RESTART RUN
  // ============================================
  //
  // Full reset back to wave 1, as if starting a
  // brand new game.
  // ============================================

  private restartRun(): void {
    if (!this.playerDead) {
      return;
    }

    this.wave = 1;

    this.player.reset(this.worldWidth / 2, this.worldHeight / 2);

    this.playerDead = false;

    this.bullets = [];

    this.pickups = [];

    this.updateCamera();

    this.startWave();

    this.updateHUD();
  }

  // ============================================
  // CAMERA
  // ============================================

  private updateCamera(): void {
    // ==========================================
    // CENTER ON PLAYER
    // ==========================================

    this.cameraX = this.player.x - this.screenWidth / 2;

    this.cameraY = this.player.y - this.screenHeight / 2;

    // ==========================================
    // CAMERA X BOUNDARY
    // ==========================================

    this.cameraX = Math.max(
      0,
      Math.min(this.worldWidth - this.screenWidth, this.cameraX)
    );

    // ==========================================
    // CAMERA Y BOUNDARY
    // ==========================================

    this.cameraY = Math.max(
      0,
      Math.min(this.worldHeight - this.screenHeight, this.cameraY)
    );
  }

  // ============================================
  // RENDER
  // ============================================

  private render(): void {
    const ctx = this.ctx;

    // ==========================================
    // CLEAR
    // ==========================================

    ctx.clearRect(0, 0, this.screenWidth, this.screenHeight);

    // ==========================================
    // WORLD CAMERA
    // ==========================================

    ctx.save();

    ctx.translate(-Math.round(this.cameraX), -Math.round(this.cameraY));

    // ==========================================
    // MAP
    // ==========================================

    this.map.draw(ctx);

    // ==========================================
    // PICKUPS
    // ==========================================

    for (const pickup of this.pickups) {
      pickup.draw(ctx);
    }

    // ==========================================
    // BULLETS
    // ==========================================

    for (const bullet of this.bullets) {
      bullet.draw(ctx);
    }

    // ==========================================
    // ENEMIES
    // ==========================================

    for (const enemy of this.enemies) {
      enemy.draw(ctx);
    }

    // ==========================================
    // PLAYER
    // ==========================================

    if (!this.playerDead) {
      this.player.draw(ctx);
    }

    ctx.restore();
  }

  // ============================================
  // HUD
  // ============================================

  private updateHUD(): void {
    // ==========================================
    // WAVE
    // ==========================================

    const waveElement = document.querySelector("#wave-value");

    if (waveElement) {
      waveElement.textContent = String(this.wave);
    }

    // ==========================================
    // ENEMIES
    // ==========================================

    const enemyElement = document.querySelector("#enemy-value");

    if (enemyElement) {
      enemyElement.textContent = String(this.enemies.length);
    }

    // ==========================================
    // MAP NAME
    // ==========================================

    const mapElement = document.querySelector("#map-value");

    if (mapElement) {
      mapElement.textContent = this.map.themeName;
    }

    // ==========================================
    // HEALTH NUMBER
    // ==========================================

    const healthElement = document.querySelector("#health-value");

    if (healthElement) {
      healthElement.textContent = String(Math.ceil(this.player.health));
    }

    // ==========================================
    // HEALTH BAR
    // ==========================================

    const healthFill = document.querySelector(
      "#health-fill"
    ) as HTMLElement | null;

    if (healthFill) {
      const percentage = Math.max(0, Math.min(100, this.player.health));

      healthFill.style.width = `${percentage}%`;
    }

    // ==========================================
    // AMMO
    // ==========================================

    const ammoElement = document.querySelector("#ammo-value");

    if (ammoElement) {
      ammoElement.textContent = `${this.player.magazine} / ${this.player.reserveAmmo}`;
    }

    // ==========================================
    // RELOAD
    // ==========================================

    const reloadElement = document.querySelector("#reload-value");

    if (reloadElement) {
      if (this.player.isReloading) {
        const elapsed = performance.now() - this.player.reloadStartTime;

        const progress = Math.min(
          100,
          (elapsed / this.player.reloadDuration) * 100
        );

        reloadElement.textContent = `RELOADING ${Math.floor(progress)}%`;
      } else {
        reloadElement.textContent = "";
      }
    }

    // ==========================================
    // DEATH SCREEN
    // ==========================================

    const deathScreen = document.querySelector("#death-screen");

    if (deathScreen) {
      if (this.playerDead) {
        deathScreen.classList.add("active");
      } else {
        deathScreen.classList.remove("active");
      }
    }

    // ==========================================
    // DEATH SCREEN WAVE REACHED
    // ==========================================

    const deathWaveElement = document.querySelector("#death-wave-value");

    if (deathWaveElement) {
      deathWaveElement.textContent = String(this.wave);
    }
  }

  // ============================================
  // STOP
  // ============================================

  stop(): void {
    this.running = false;
  }

  // ============================================
  // DESTROY
  // ============================================

  destroy(): void {
    this.running = false;
  }
}
