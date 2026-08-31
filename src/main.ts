import "./style.css";
import { Game } from "./game/Game";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("App element not found.");
}

app.innerHTML = `
  <main id="game-wrapper">
    <div id="game-container">
      <canvas id="game-canvas" width="1280" height="800"></canvas>

      <div id="hud">
        <div class="hud-top">
          <div class="wave">
            WAVE <span id="wave-value">1</span>
          </div>

          <div class="enemies">
            ENEMIES <span id="enemy-value">0</span>
          </div>

          <div class="mapname">
            MAP <span id="map-value">Cyber Arena</span>
          </div>
        </div>

        <div class="hud-bottom">
          <div class="health-container">
            <div class="health-label">
              HP
              <span id="health-value">100</span>
            </div>

            <div class="health-bar">
              <div id="health-fill"></div>
            </div>
          </div>

          <div class="ammo-container">
            <div id="ammo-value">30 / 360</div>
            <div id="reload-value"></div>
          </div>
        </div>
      </div>

      <!-- ================================== -->
      <!-- START SCREEN                        -->
      <!-- ================================== -->

      <div id="start-screen" class="overlay active">
        <div class="overlay-panel">
          <div class="overlay-title">CYBER ARENA</div>

          <div class="overlay-subtitle">
            Top-down pixel shooter — survive the waves
          </div>

          <div class="overlay-controls">
            <div>WASD / ARROWS — Move</div>
            <div>MOUSE — Aim</div>
            <div>LEFT CLICK — Shoot</div>
            <div>R — Reload</div>
          </div>

          <button id="start-button" class="overlay-button">
            START GAME
          </button>
        </div>
      </div>

      <!-- ================================== -->
      <!-- DEATH SCREEN                        -->
      <!-- ================================== -->

      <div id="death-screen" class="overlay">
        <div class="overlay-panel">
          <div class="overlay-title death-title">SYSTEM FAILURE</div>

          <div class="overlay-subtitle">
            You reached WAVE <span id="death-wave-value">1</span>
          </div>

          <div class="overlay-buttons">
            <button id="btn-continue" class="overlay-button">
              CONTINUE
            </button>

            <button id="btn-restart" class="overlay-button overlay-button-secondary">
              RESTART
            </button>
          </div>
        </div>
      </div>
    </div>
  </main>
`;

const canvas = document.querySelector<HTMLCanvasElement>("#game-canvas");

if (!canvas) {
  throw new Error("Game canvas not found.");
}

/*
 * Game wires up its own Start Game button and
 * Continue/Restart buttons internally, and only
 * begins the game loop once "Start Game" is
 * clicked — so we don't call game.start() here.
 */

new Game(canvas);
