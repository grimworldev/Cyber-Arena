export class Mouse {
    public x = 0;
    public y = 0;

    public isDown = false;

    constructor(
        private canvas: HTMLCanvasElement
    ) {
        canvas.addEventListener(
            'mousemove',
            (event) => {
                const rect =
                    canvas.getBoundingClientRect();

                this.x =
                    event.clientX -
                    rect.left;

                this.y =
                    event.clientY -
                    rect.top;
            }
        );

        canvas.addEventListener(
            'mousedown',
            (event) => {
                if (
                    event.button === 0
                ) {
                    this.isDown = true;
                }
            }
        );

        canvas.addEventListener(
            'mouseup',
            (event) => {
                if (
                    event.button === 0
                ) {
                    this.isDown = false;
                }
            }
        );

        canvas.addEventListener(
            'mouseleave',
            () => {
                this.isDown = false;
            }
        );

        window.addEventListener(
            'mouseup',
            () => {
                this.isDown = false;
            }
        );
    }
}