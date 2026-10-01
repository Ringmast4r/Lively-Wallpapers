let size;
let width;
let height;

export function draw(ctx, iterations) {
    size = Math.min(ctx.canvas.width, ctx.canvas.height);
    width = ctx.canvas.width;
    height = ctx.canvas.height;

    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;

    const startX = 0.5;
    const startY = 1;
    const length = 0.2;
    const angle = -Math.PI / 2;

    draw_recursive(ctx, startX, startY, length, angle, iterations);
}

function draw_recursive(ctx, x, y, length, angle, depth) {
    if (depth === 0) {
        return;
    }

    const x1 = x + length * Math.cos(angle);
    const y1 = y + length * Math.sin(angle);

    draw_line(ctx, x, y, x1, y1);

    const newLength = length * 0.75;
    const angle1 = angle + 2 * Math.PI / 13;
    const angle2 = angle - 2 * Math.PI / 13;

    draw_recursive(ctx, x1, y1, newLength, angle1, depth - 1);
    draw_recursive(ctx, x1, y1, newLength, angle2, depth - 1);
}

function draw_line(ctx, x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(pw(x1), ph(y1));
    ctx.lineTo(pw(x2), ph(y2));
    ctx.stroke();
}

function pw(percent) {
    return width / 2 - size / 2 + size * percent;
}

function ph(percent) {
    return height / 2 - size / 2 + size * percent;
}