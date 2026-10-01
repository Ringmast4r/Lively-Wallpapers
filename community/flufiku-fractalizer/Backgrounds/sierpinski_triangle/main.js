let size;
let width;
let height;

export function draw(ctx, Iterations) {
    size = Math.min(ctx.canvas.width, ctx.canvas.height);
    width = ctx.canvas.width;
    height = ctx.canvas.height;

    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.moveTo(pw(0.5), ph(0));
    ctx.lineTo(pw(0), ph(1));
    ctx.lineTo(pw(1), ph(1));
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'white';

    draw_recursive(ctx, {x: 0.5, y: 0}, {x: 0, y: 1}, {x: 1, y: 1}, Iterations);

}

function draw_recursive(ctx, point1, point2, point3, depth) {
    if (depth == 0) {
        return;
    }
    
    let mid_left = {x: (point1.x + point2.x) / 2, y: (point1.y + point2.y) / 2};
    let mid_right = {x: (point1.x + point3.x) / 2, y: (point1.y + point3.y) / 2};
    let mid_bottom = {x: (point2.x + point3.x) / 2, y: (point2.y + point3.y) / 2};
    
    draw_triangle(ctx, mid_left, mid_right, mid_bottom);

    draw_recursive(ctx, point1, mid_left, mid_right, depth - 1);
    draw_recursive(ctx, mid_left, point2, mid_bottom, depth - 1);
    draw_recursive(ctx, mid_right, mid_bottom, point3, depth - 1);
}

function draw_triangle(ctx, point1, point2, point3) {
    ctx.beginPath();
    ctx.moveTo(pw(point1.x), ph(point1.y));
    ctx.lineTo(pw(point2.x), ph(point2.y));
    ctx.lineTo(pw(point3.x), ph(point3.y));
    ctx.closePath();
    ctx.fill();
}

function pw(percent) {
    return width/2 - size/2 + size * percent;
}

function ph(percent) {
    return height/2 - size/2 + size * percent;
}

