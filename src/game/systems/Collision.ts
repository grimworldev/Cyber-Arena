import type { Obstacle as Wall } from '../world/Map';

export interface Rectangle {
    x: number;
    y: number;
    width: number;
    height: number;
}

export function checkWallCollision(
    rect: Rectangle,
    walls: Wall[]
): boolean {
    for (
        const wall of walls
    ) {
        if (
            rectanglesOverlap(
                rect,
                wall
            )
        ) {
            return true;
        }
    }

    return false;
}

export function rectanglesOverlap(
    a: Rectangle,
    b: Rectangle
): boolean {
    return (
        a.x <
            b.x + b.width &&
        a.x + a.width >
            b.x &&
        a.y <
            b.y + b.height &&
        a.y + a.height >
            b.y
    );
}

export function circleRectangleCollision(
    circleX: number,
    circleY: number,
    radius: number,
    rect: Rectangle
): boolean {
    const closestX =
        Math.max(
            rect.x,
            Math.min(
                circleX,
                rect.x +
                    rect.width
            )
        );

    const closestY =
        Math.max(
            rect.y,
            Math.min(
                circleY,
                rect.y +
                    rect.height
            )
        );

    const dx =
        circleX - closestX;

    const dy =
        circleY - closestY;

    return (
        dx * dx +
            dy * dy <=
        radius * radius
    );
}