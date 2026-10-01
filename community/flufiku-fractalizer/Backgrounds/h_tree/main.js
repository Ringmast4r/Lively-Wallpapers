let size;
let width;
let height;

export function draw(ctx, iterations) {
    size = Math.min(ctx.canvas.width, ctx.canvas.height);
    width = ctx.canvas.width;
    height = ctx.canvas.height;

    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;


    const startX = 0.25;
    const startY = 0.5;
    const endX = 0.75;
    const endY = 0.5;
    const length = 0.5;


    const angle = 0;

    draw_recursive(ctx, startX, startY, endX, endY, length, angle, iterations);
}

function draw_recursive(ctx, startX, startY, endX, endY, length, angle, depth) {
    if (depth === 0) {
        return;
    }
    draw_line(ctx, startX, startY, endX, endY);

    const new_length = length / Math.sqrt(2);
    const new_angle = angle + Math.PI / 2;

    const new_x1 = startX + new_length * Math.cos(new_angle) / 2;
    const new_y1 = startY + new_length * Math.sin(new_angle) / 2;
    const new_x2 = endX + new_length * Math.cos(new_angle) / 2;
    const new_y2 = endY + new_length * Math.sin(new_angle) / 2;
    const new_x3 = startX - new_length * Math.cos(new_angle) / 2;
    const new_y3 = startY - new_length * Math.sin(new_angle) / 2;
    const new_x4 = endX - new_length * Math.cos(new_angle) / 2;
    const new_y4 = endY - new_length * Math.sin(new_angle) / 2;

    draw_recursive(ctx, new_x1, new_y1, new_x3, new_y3, new_length, new_angle, depth - 1);
    draw_recursive(ctx, new_x2, new_y2, new_x4, new_y4, new_length, new_angle, depth - 1);

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