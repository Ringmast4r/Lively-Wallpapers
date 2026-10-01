let size;
let width;
let height;

export function draw(ctx, Iterations) {
    size = Math.min(ctx.canvas.width, ctx.canvas.height);
    width = ctx.canvas.width;
    height = ctx.canvas.height;

    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;

    const p1 = { x: 0.5, y: 0.5 - Math.sqrt(3) / 2 / 2 };
    const p2 = { x: 0.0, y: 0.5 + Math.sqrt(3) / 2 / 2};
    const p3 = { x: 1.0, y: 0.5 + Math.sqrt(3) / 2 / 2};

    draw_recursive(ctx, p1, p2, Iterations);
    draw_recursive(ctx, p2, p3, Iterations);
    draw_recursive(ctx, p3, p1, Iterations);
}

function draw_recursive(ctx, point1, point2, depth) {
    if (depth === 0) {
        draw_line(ctx, point1, point2);
        return;
    }

    const dx = (point2.x - point1.x) / 3;
    const dy = (point2.y - point1.y) / 3;

    const a = { x: point1.x, y: point1.y };
    const b = { x: point1.x + dx, y: point1.y + dy };
    const c = {
        x: (point1.x + point2.x) / 2 - (Math.sqrt(3) * (point1.y - point2.y)) / 6,
        y: (point1.y + point2.y) / 2 + (Math.sqrt(3) * (point1.x - point2.x)) / 6
    };
    const d = { x: point1.x + 2 * dx, y: point1.y + 2 * dy };

    draw_recursive(ctx, a, b, depth - 1);
    draw_recursive(ctx, b, c, depth - 1);
    draw_recursive(ctx, c, d, depth - 1);
    draw_recursive(ctx, d, point2, depth - 1);
}

function draw_line(ctx, point1, point2) {
    ctx.beginPath();
    ctx.moveTo(pw(point1.x), ph(point1.y));
    ctx.lineTo(pw(point2.x), ph(point2.y));
    ctx.stroke();
}

function pw(percent) {
    return width/2 - size/2 + size * percent;
}

function ph(percent) {
    return height/2 - size/2 + size * percent;
}

