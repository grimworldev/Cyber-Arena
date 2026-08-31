export interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MapTheme {
  name: string;
  background: string;
  grid: string;
  obstacleFill: string;
  obstacleStroke: string;
  obstacleLine: string;
  border: string;

  // ============================================
  // OPTIONAL SVG TEXTURES
  // ============================================
  //
  // If provided, these are drawn instead of the
  // procedural rectangle look. Auto-resolved from
  // src/game/assets by naming convention:
  //   "<slugified-theme-name>-floor.svg"
  //   "<slugified-theme-name>-obstacle.svg"
  // e.g. theme "Cyber Arena" ->
  //   cyber-arena-floor.svg
  //   cyber-arena-obstacle.svg
  //
  // You can still hardcode these per-theme if you
  // want to override the naming convention for a
  // specific theme.
  // ============================================

  obstacleImageSrc?: string;
  backgroundImageSrc?: string;
}

// ================================================
// AUTO-LOADED SVG ASSETS
// ================================================
//
// Grabs every svg under src/game/assets eagerly as
// a URL string, keyed by its relative path (e.g.
// "../assets/cyber-arena-floor.svg"). Adjust the
// glob path below if your assets folder lives
// somewhere else relative to this file.
//
// NOTE: requires Vite 5+. On Vite 4 or earlier,
// use `{ eager: true, as: "url" }` instead of the
// `query`/`import` options.
// ================================================

const themeSvgs = import.meta.glob<string>("../assets/*.svg", {
  eager: true,
  query: "?url",
  import: "default",
});

function slugify(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-");
}

function svgFor(
  themeName: string,
  suffix: "floor" | "obstacle"
): string | undefined {
  const path = `../assets/${slugify(themeName)}-${suffix}.svg`;

  return themeSvgs[path];
}

export class GameMap {
  readonly width = 1600;
  readonly height = 1000;

  obstacles: Obstacle[] = [];

  private seed = Math.random();

  // ============================================
  // LOADED IMAGES CACHE
  // ============================================
  //
  // Images load asynchronously. We cache by src
  // so we don't recreate an Image() every frame,
  // and we track whether each one is ready.
  // ============================================

  private imageCache = new Map<string, HTMLImageElement>();

  // ============================================
  // THEMES (10 total)
  // ============================================

  private readonly themes: MapTheme[] = [
    {
      name: "Cyber Arena",
      background: "#080b12",
      grid: "#111927",
      obstacleFill: "#202b3e",
      obstacleStroke: "#3a5279",
      obstacleLine: "#263c68",
      border: "#00ffe1",
    },
    {
      name: "Lava Core",
      background: "#180705",
      grid: "#2a0e08",
      obstacleFill: "#3a1408",
      obstacleStroke: "#ff5522",
      obstacleLine: "#7a2a10",
      border: "#ff6a00",
    },
    {
      name: "Winter Outpost",
      background: "#0b1420",
      grid: "#16222f",
      obstacleFill: "#3a4a5c",
      obstacleStroke: "#8fd3ff",
      obstacleLine: "#26404f",
      border: "#eafcff",
    },
    {
      name: "Warehouse",
      background: "#141210",
      grid: "#1e1a16",
      obstacleFill: "#3d3020",
      obstacleStroke: "#c9a227",
      obstacleLine: "#2b2318",
      border: "#ffcc00",
    },
    {
      name: "Toxic Wasteland",
      background: "#0a140a",
      grid: "#0f1f0f",
      obstacleFill: "#1f3d1f",
      obstacleStroke: "#7cff3a",
      obstacleLine: "#173017",
      border: "#b6ff3a",
    },
    {
      name: "Desert Ruins",
      background: "#1c150a",
      grid: "#2a2010",
      obstacleFill: "#5a4322",
      obstacleStroke: "#e0b458",
      obstacleLine: "#3d2e16",
      border: "#f2c96d",
    },
    {
      name: "Overgrown Jungle",
      background: "#0a1408",
      grid: "#122010",
      obstacleFill: "#1f3018",
      obstacleStroke: "#4caf50",
      obstacleLine: "#16240f",
      border: "#8bff6a",
    },
    {
      name: "Deep Space Station",
      background: "#05060d",
      grid: "#0e1020",
      obstacleFill: "#1a1c33",
      obstacleStroke: "#7a5cff",
      obstacleLine: "#12142a",
      border: "#a58bff",
    },
    {
      name: "Volcanic Ash",
      background: "#100b0b",
      grid: "#1c1414",
      obstacleFill: "#2e2222",
      obstacleStroke: "#ff8a3d",
      obstacleLine: "#241818",
      border: "#ffb066",
    },
    {
      name: "Neon Grid",
      background: "#0a0014",
      grid: "#1a0a2e",
      obstacleFill: "#22103d",
      obstacleStroke: "#ff2ee6",
      obstacleLine: "#180a2a",
      border: "#2effe0",
    },
  ];

  private currentTheme: MapTheme = this.themes[0];

  private lastThemeIndex = -1;

  get theme(): MapTheme {
    return this.currentTheme;
  }

  get themeName(): string {
    return this.currentTheme.name;
  }

  generate(): void {
    this.obstacles = [];

    // ==========================================
    // NEW SEED PER GENERATION
    // ==========================================

    this.seed = Math.random();

    // ==========================================
    // RANDOM THEME (no immediate repeat)
    // ==========================================

    let themeIndex = Math.floor(Math.random() * this.themes.length);

    if (this.themes.length > 1) {
      while (themeIndex === this.lastThemeIndex) {
        themeIndex = Math.floor(Math.random() * this.themes.length);
      }
    }

    this.lastThemeIndex = themeIndex;

    this.currentTheme = this.themes[themeIndex];

    // ==========================================
    // AUTO-WIRE SVGS BY NAMING CONVENTION
    // ==========================================
    //
    // Only fills in the src if the theme doesn't
    // already have one explicitly set above.
    // ==========================================

    this.currentTheme.backgroundImageSrc ??= svgFor(
      this.currentTheme.name,
      "floor"
    );

    this.currentTheme.obstacleImageSrc ??= svgFor(
      this.currentTheme.name,
      "obstacle"
    );

    // ==========================================
    // PRELOAD THEME IMAGES
    // ==========================================

    this.preloadImage(this.currentTheme.obstacleImageSrc);
    this.preloadImage(this.currentTheme.backgroundImageSrc);

    const random = this.createRandom();

    const targetCount = 18;

    const maxAttemptsPerObstacle = 40;

    // ==========================================
    // PADDING BETWEEN OBSTACLES
    // ==========================================
    //
    // Minimum gap enforced between any two
    // obstacles, so boxes never touch/overlap
    // and there's always room to walk between
    // them.
    // ==========================================

    const padding = 24;

    const centerX = this.width / 2;
    const centerY = this.height / 2;

    let placed = 0;

    let totalAttempts = 0;

    const maxTotalAttempts = targetCount * maxAttemptsPerObstacle;

    while (placed < targetCount && totalAttempts < maxTotalAttempts) {
      totalAttempts++;

      const width = 70 + Math.floor(random() * 170);

      const height = 70 + Math.floor(random() * 170);

      const x = 80 + Math.floor(random() * (this.width - width - 160));

      const y = 80 + Math.floor(random() * (this.height - height - 160));

      // Keep center area relatively clear
      const obstacleCenterX = x + width / 2;

      const obstacleCenterY = y + height / 2;

      const distanceFromCenter = Math.sqrt(
        Math.pow(obstacleCenterX - centerX, 2) +
          Math.pow(obstacleCenterY - centerY, 2)
      );

      if (distanceFromCenter < 230) {
        continue;
      }

      const candidate: Obstacle = { x, y, width, height };

      if (this.overlapsAny(candidate, padding)) {
        continue;
      }

      this.obstacles.push(candidate);

      placed++;
    }
  }

  // ============================================
  // OVERLAP CHECK
  // ============================================
  //
  // Checks candidate against every already-
  // placed obstacle, expanded by `padding` on
  // all sides, so obstacles keep a minimum gap
  // rather than just not intersecting exactly.
  // ============================================

  private overlapsAny(candidate: Obstacle, padding: number): boolean {
    for (const existing of this.obstacles) {
      const expanded: Obstacle = {
        x: existing.x - padding,
        y: existing.y - padding,
        width: existing.width + padding * 2,
        height: existing.height + padding * 2,
      };

      const overlaps =
        candidate.x < expanded.x + expanded.width &&
        candidate.x + candidate.width > expanded.x &&
        candidate.y < expanded.y + expanded.height &&
        candidate.y + candidate.height > expanded.y;

      if (overlaps) {
        return true;
      }
    }

    return false;
  }

  isBlocked(x: number, y: number, radius: number): boolean {
    // ==========================================
    // WORLD BOUNDARY
    // ==========================================

    if (
      x - radius < 0 ||
      y - radius < 0 ||
      x + radius > this.width ||
      y + radius > this.height
    ) {
      return true;
    }

    // ==========================================
    // OBSTACLES
    // ==========================================

    for (const obstacle of this.obstacles) {
      if (
        x + radius > obstacle.x &&
        x - radius < obstacle.x + obstacle.width &&
        y + radius > obstacle.y &&
        y - radius < obstacle.y + obstacle.height
      ) {
        return true;
      }
    }

    return false;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const theme = this.currentTheme;

    // ==========================================
    // BACKGROUND
    // ==========================================

    const bgImage = theme.backgroundImageSrc
      ? this.getLoadedImage(theme.backgroundImageSrc)
      : null;

    if (bgImage) {
      // Tile the background image across the world
      const tileSize = 128;

      for (let x = 0; x < this.width; x += tileSize) {
        for (let y = 0; y < this.height; y += tileSize) {
          ctx.drawImage(bgImage, x, y, tileSize, tileSize);
        }
      }
    } else {
      ctx.fillStyle = theme.background;

      ctx.fillRect(0, 0, this.width, this.height);
    }

    // ==========================================
    // GRID
    // ==========================================

    ctx.strokeStyle = theme.grid;

    ctx.lineWidth = 1;

    const gridSize = 64;

    for (let x = 0; x <= this.width; x += gridSize) {
      ctx.beginPath();

      ctx.moveTo(x, 0);

      ctx.lineTo(x, this.height);

      ctx.stroke();
    }

    for (let y = 0; y <= this.height; y += gridSize) {
      ctx.beginPath();

      ctx.moveTo(0, y);

      ctx.lineTo(this.width, y);

      ctx.stroke();
    }

    // ==========================================
    // OBSTACLES
    // ==========================================

    const obstacleImage = theme.obstacleImageSrc
      ? this.getLoadedImage(theme.obstacleImageSrc)
      : null;

    for (const obstacle of this.obstacles) {
      if (obstacleImage) {
        // ======================================
        // SVG / IMAGE OBSTACLE
        // ======================================

        ctx.drawImage(
          obstacleImage,
          obstacle.x,
          obstacle.y,
          obstacle.width,
          obstacle.height
        );

        continue;
      }

      // ========================================
      // PROCEDURAL FALLBACK
      // ========================================

      ctx.fillStyle = theme.obstacleFill;

      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);

      ctx.strokeStyle = theme.obstacleStroke;

      ctx.lineWidth = 2;

      ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);

      // Detail lines
      ctx.strokeStyle = theme.obstacleLine;

      ctx.lineWidth = 1;

      for (let x = obstacle.x + 15; x < obstacle.x + obstacle.width; x += 30) {
        ctx.beginPath();

        ctx.moveTo(x, obstacle.y);

        ctx.lineTo(x, obstacle.y + obstacle.height);

        ctx.stroke();
      }
    }

    // ==========================================
    // WORLD BORDER
    // ==========================================

    ctx.strokeStyle = theme.border;

    ctx.lineWidth = 5;

    ctx.strokeRect(2, 2, this.width - 4, this.height - 4);
  }

  // ============================================
  // IMAGE LOADING HELPERS
  // ============================================

  private preloadImage(src: string | undefined): void {
    if (!src) {
      return;
    }

    if (this.imageCache.has(src)) {
      return;
    }

    const image = new Image();

    image.src = src;

    this.imageCache.set(src, image);
  }

  private getLoadedImage(src: string): HTMLImageElement | null {
    const image = this.imageCache.get(src);

    if (!image) {
      return null;
    }

    // Only use it once it has actually finished
    // loading — otherwise drawImage draws
    // nothing (or throws in some browsers).

    if (!image.complete || image.naturalWidth === 0) {
      return null;
    }

    return image;
  }

  private createRandom(): () => number {
    let seed = Math.floor(this.seed * 2147483647);

    return () => {
      seed = (seed * 16807) % 2147483647;

      return (seed - 1) / 2147483646;
    };
  }
}
