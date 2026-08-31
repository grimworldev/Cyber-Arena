import { Enemy, type EnemyStats } from "../entities/Enemy";
import { GameMap } from "../world/Map";

export class EnemySpawner {
  constructor(private map: GameMap) {}

  createWave(wave: number): Enemy[] {
    const enemies: Enemy[] = [];

    // Enemy count
    const count = 10 + (wave - 1) * 3;

    // Enemy stats
    const health = 30 + (wave - 1) * 12;
    const speed = Math.min(90 + (wave - 1) * 8, 150);

    let damage = wave >= 5 ? 5 : wave;

    // Fire settings
    let fireInterval = 1000;
    let burstCount = 1;
    let burstDelay = 100;

    if (wave === 1) {
      fireInterval = 1000;
      burstCount = 1;
      burstDelay = 100;
    } else if (wave === 2) {
      fireInterval = 3000;
      burstCount = 2;
      burstDelay = 150;
    } else if (wave === 3 || wave === 4) {
      fireInterval = 5000;
      burstCount = 5;
      burstDelay = 150;
    } else {
      fireInterval = 5000;
      burstCount = 5;
      burstDelay = 100;
    }

    const stats: EnemyStats = {
      health,
      speed,
      damage,
      fireInterval,
      burstCount,
      burstDelay,
    };

    for (let i = 0; i < count; i++) {
      const position = this.findSpawnPosition();

      const enemy = new Enemy(
        position.x,
        position.y,
        stats
      );

      enemies.push(enemy);
    }

    return enemies;
  }

  private findSpawnPosition(): { x: number; y: number } {
    for (let attempt = 0; attempt < 100; attempt++) {
      const x = 80 + Math.random() * (this.map.width - 160);
      const y = 80 + Math.random() * (this.map.height - 160);

      if (!this.map.isBlocked(x, y, 30)) {
        return { x, y };
      }
    }

    return {
      x: this.map.width - 100,
      y: 100,
    };
  }
}