let size;
let width;
let height;

export function draw(ctx, iterations) {
    size = Math.min(ctx.canvas.width, ctx.canvas.height);
    width = ctx.canvas.width;
    height = ctx.canvas.height;

    ctx.fillStyle = 'green';

    let x = 0.0;
    let y = 0.0;

    for (let t = 0; t < iterations*20000; t++) {
        let r = Math.random();

        console.log(r);

        let nextX, nextY;

        if (r < 0.01) {
            nextX = 0.0;
            nextY = 0.16 * y;
        } else if (r < 0.86) {
            nextX = 0.85 * x + 0.04 * y;
            nextY = -0.04 * x + 0.85 * y + 1.6;
        } else if (r < 0.93) {
            nextX = 0.2 * x - 0.26 * y;
            nextY = 0.23 * x + 0.22 * y + 1.6;
        } else {
            nextX = -0.15 * x + 0.28 * y;
            nextY = 0.26 * x + 0.24 * y + 0.44;
        }

        draw_pixel(ctx, nextX/10+0.5, 1-nextY/10);
        x = nextX;
        y = nextY;
    }
}

function draw_pixel(ctx, x, y) {
    ctx.fillRect(pw(x), ph(y), 1, 1);
    console.log(x, y);
}

function pw(percent) {
    return width/2 - size/2 + size * percent;
}

function ph(percent) {
    return height/2 - size/2 + size * percent;
}












//hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh