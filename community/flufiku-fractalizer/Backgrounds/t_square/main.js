let size;
let width;
let height;

export function draw(ctx, Iterations) {
    size = Math.min(ctx.canvas.width, ctx.canvas.height);
    width = ctx.canvas.width;
    height = ctx.canvas.height;

    ctx.fillStyle = 'black';

    draw_recursive(ctx, 0.5, 0.5, 0.5, Iterations);
}

function draw_recursive(ctx, centerx, centery, length, depth) {
    if (depth == 0) {
        return;
    }
    
    draw_square(ctx, centerx, centery, length);

    draw_recursive(ctx, centerx - length/2, centery - length/2, length/2, depth - 1);
    draw_recursive(ctx, centerx - length/2, centery + length/2, length/2, depth - 1);
    draw_recursive(ctx, centerx + length/2, centery - length/2, length/2, depth - 1);
    draw_recursive(ctx, centerx + length/2, centery + length/2, length/2, depth - 1);
    
}

function draw_square(ctx, centerx, centery, square_size) {
    ctx.rect(pw(centerx - square_size/2), ph(centery - square_size/2), size * square_size, size * square_size);
    ctx.fill();

    
}

function pw(percent) {
    return width/2 - size/2 + size * percent;
}

function ph(percent) {
    return height/2 - size/2 + size * percent;
}

