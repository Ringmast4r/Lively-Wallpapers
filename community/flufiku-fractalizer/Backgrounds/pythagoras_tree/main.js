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
    const length = 1 / 6;
    const angle = 3 * Math.PI / 2;

    draw_recursive(ctx, startX, startY, length, angle, iterations);
}

function draw_recursive(ctx, x, y, length, angle, depth) {
    if (depth === 0) {
        return;
    }

    const draw_x = x + length / 2 * Math.cos(angle);
    const draw_y = y + length / 2 * Math.sin(angle);

    draw_square(ctx, draw_x, draw_y, length, angle);

    const new_x = x + length * Math.cos(angle);
    const new_y = y + length * Math.sin(angle);

    const new_x1 = new_x + Math.sqrt(2) / 4 * length * Math.cos(angle + Math.PI / 4);
    const new_y1 = new_y + Math.sqrt(2) / 4 * length * Math.sin(angle + Math.PI / 4);
    const new_x2 = new_x + Math.sqrt(2) / 4 * length * Math.cos(angle - Math.PI / 4);
    const new_y2 = new_y + Math.sqrt(2) / 4 * length * Math.sin(angle - Math.PI / 4);

    draw_recursive(ctx, new_x1, new_y1, length / Math.sqrt(2), angle + Math.PI / 4, depth - 1);
    draw_recursive(ctx, new_x2, new_y2, length / Math.sqrt(2), angle - Math.PI / 4, depth - 1);
}

function draw_square(ctx, x, y, length, angle) {
    ctx.save();
    ctx.translate(pw(x), ph(y));
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.rect(-length / 2 * size, -length / 2 * size, length * size, length * size);
    ctx.stroke();
    ctx.restore();
}

function pw(percent) {
    return width / 2 - size / 2 + size * percent;
}

function ph(percent) {
    return height / 2 - size / 2 + size * percent;
}

