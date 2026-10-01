let size;
let width;
let height;

export function draw(ctx, iterations) {
    size = Math.min(ctx.canvas.width, ctx.canvas.height);
    width = ctx.canvas.width;
    height = ctx.canvas.height;

    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;

    let ratio = width / height;
    
    let xMin = 3.2 - 0.5*ratio;
    let xMax = 3.2 + 0.5*ratio;
    let yMin = 0;
    let yMax = 1;
    
    if (xMax > 4) {
        let range = xMax - xMin;
        xMax = 4;
        xMin = 4 - range;
    }

    for (let x = xMin; x <= xMax; x += 0.001) {
        let y = Math.random();
        for (let i = 0; i < iterations*100; i++) {
            y = x * y * (1 - y);
            if (i > iterations*80) {
                draw_pixel(ctx, x, y, xMin, xMax, yMin, yMax);
            }
        }
    }
}

function draw_pixel(ctx, x, y, xMin, xMax, yMin, yMax) {
    const px = pw((x - xMin) / (xMax - xMin));
    const py = ph(1 - (y - yMin) / (yMax - yMin));
    ctx.fillRect(px, py, 1, 1);
}

function pw(percent) {
    return width * percent;
}

function ph(percent) {
    return height * percent;
}