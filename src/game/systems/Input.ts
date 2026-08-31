export class Input {
  private keys = new Set<string>();

  private mouseDown = false;

  mouseX = 0;
  mouseY = 0;

  constructor(private canvas: HTMLCanvasElement) {
    window.addEventListener("keydown", (event) => {
      this.keys.add(event.code);

      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(
          event.code
        )
      ) {
        event.preventDefault();
      }
    });

    window.addEventListener("keyup", (event) => {
      this.keys.delete(event.code);
    });

    canvas.addEventListener("mousedown", (event) => {
      if (event.button === 0) {
        this.mouseDown = true;
      }
    });

    window.addEventListener("mouseup", (event) => {
      if (event.button === 0) {
        this.mouseDown = false;
      }
    });

    canvas.addEventListener("mousemove", (event) => {
      const rect = canvas.getBoundingClientRect();

      this.mouseX = ((event.clientX - rect.left) / rect.width) * canvas.width;

      this.mouseY = ((event.clientY - rect.top) / rect.height) * canvas.height;
    });

    window.addEventListener("blur", () => {
      this.keys.clear();
      this.mouseDown = false;
    });
  }

  isKeyDown(code: string): boolean {
    return this.keys.has(code);
  }

  isMouseDown(): boolean {
    return this.mouseDown;
  }
}
