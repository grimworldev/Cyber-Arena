interface Particle {
  x: number;
  y: number;

  velocityX: number;
  velocityY: number;

  life: number;
  maxLife: number;

  size: number;
}

export class SpawnEffect {
  private particles: Particle[] = [];

  private elapsed = 0;

  private readonly duration = 0.8;

  private readonly x: number;
  private readonly y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;

    this.createParticles();
  }

  private createParticles() {
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;

      const speed = 50 + Math.random() * 160;

      this.particles.push({
        x: this.x,
        y: this.y,

        velocityX: Math.cos(angle) * speed,

        velocityY: Math.sin(angle) * speed,

        life: 0.4 + Math.random() * 0.4,

        maxLife: 0.8,

        size: 2 + Math.random() * 5,
      });
    }
  }

  update(deltaTime: number) {
    this.elapsed += deltaTime;

    for (const particle of this.particles) {
      particle.x += particle.velocityX * deltaTime;

      particle.y += particle.velocityY * deltaTime;

      particle.life -= deltaTime;
    }
  }

  isFinished() {
    return this.elapsed >= this.duration;
  }

  draw(ctx: CanvasRenderingContext2D) {
    /*
     * Ring
     */

    const progress = Math.min(1, this.elapsed / this.duration);

    ctx.beginPath();

    ctx.arc(this.x, this.y, progress * 45, 0, Math.PI * 2);

    ctx.strokeStyle = "#4f6fff";

    ctx.lineWidth = 3;

    ctx.stroke();

    /*
     * Particles
     */

    for (const particle of this.particles) {
      if (particle.life <= 0) {
        continue;
      }

      ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife);

      ctx.fillStyle = "#70a1ff";

      ctx.fillRect(
        particle.x - particle.size / 2,

        particle.y - particle.size / 2,

        particle.size,

        particle.size
      );
    }

    ctx.globalAlpha = 1;
  }
}
