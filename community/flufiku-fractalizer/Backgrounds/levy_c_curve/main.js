let size;
let width;
let height;

export function draw(ctx, iterations) {
    size = Math.min(ctx.canvas.width, ctx.canvas.height);
    width = ctx.canvas.width;
    height = ctx.canvas.height;

    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;

    const p1 = { x: 0.25, y: 0.5 };
    const p2 = { x: 0.75, y: 0.5 };

    draw_recursive(ctx, p1, p2, iterations);
}

function draw_recursive(ctx, point1, point2, depth) {
    if (depth === 0) {
        draw_line(ctx, point1, point2);
        return;
    }

    const midX = (point1.x + point2.x) / 2 + (point2.y - point1.y) / 2;
    const midY = (point1.y + point2.y) / 2 - (point2.x - point1.x) / 2;

    const midPoint = { x: midX, y: midY };

    draw_recursive(ctx, point1, midPoint, depth - 1);
    draw_recursive(ctx, midPoint, point2, depth - 1);
}

function draw_line(ctx, point1, point2) {
    ctx.beginPath();
    ctx.moveTo(pw(point1.x), ph(point1.y));
    ctx.lineTo(pw(point2.x), ph(point2.y));
    ctx.stroke();
}

function pw(percent) {
    return width / 2 - size / 2 + size * percent;
}

function ph(percent) {
    return height / 2 - size / 2 + size * percent;
}











