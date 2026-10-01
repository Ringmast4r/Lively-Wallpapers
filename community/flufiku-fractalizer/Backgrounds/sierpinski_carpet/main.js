let size;
let width;
let height;

export function draw(ctx, Iterations) {
    size = Math.min(ctx.canvas.width, ctx.canvas.height);
    width = ctx.canvas.width;
    height = ctx.canvas.height;

    ctx.fillStyle = 'black';
    ctx.fillRect(pw(0), ph(0), size, size);
    ctx.fillStyle = 'white';

    draw_recursive(ctx, {x: 0, y: 0}, 1, Iterations);

}

function draw_recursive(ctx, topleft, size_square, depth) {
    if (depth == 0) {
        return;
    }
    
    draw_square(ctx, {x: topleft.x+size_square/3, y: topleft.y+size_square/3}, size_square/3, size);

    draw_recursive(ctx, {x: topleft.x, y: topleft.y}, size_square/3, depth - 1);
    draw_recursive(ctx, {x: topleft.x+size_square/3, y: topleft.y}, size_square/3, depth - 1);
    draw_recursive(ctx, {x: topleft.x+2*size_square/3, y: topleft.y}, size_square/3, depth - 1);
    draw_recursive(ctx, {x: topleft.x, y: topleft.y+size_square/3}, size_square/3, depth - 1);
    draw_recursive(ctx, {x: topleft.x+2*size_square/3, y: topleft.y+size_square/3}, size_square/3, depth - 1);
    draw_recursive(ctx, {x: topleft.x, y: topleft.y+2*size_square/3}, size_square/3, depth - 1);
    draw_recursive(ctx, {x: topleft.x+size_square/3, y: topleft.y+2*size_square/3}, size_square/3, depth - 1);
    draw_recursive(ctx, {x: topleft.x+2*size_square/3, y: topleft.y+2*size_square/3}, size_square/3, depth - 1);
}

function draw_square(ctx, topleft, size_square, size_canvas) {
    ctx.fillRect(pw(topleft.x), ph(topleft.y), size_canvas*size_square, size_canvas*size_square);
}

function pw(percent) {
    return width/2 - size/2 + size * percent;
}

function ph(percent) {
    return height/2 - size/2 + size * percent;
}

