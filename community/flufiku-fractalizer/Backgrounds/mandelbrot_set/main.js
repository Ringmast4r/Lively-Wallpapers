let size;
let width;
let height;

export function draw(ctx, iterations) {
    size = Math.min(ctx.canvas.width, ctx.canvas.height);
    width = ctx.canvas.width;
    height = ctx.canvas.height;

    let width_pad = 0;
    let height_pad = 0;

    if (width/2.47 > height/2.24) {
        width_pad = width - height*2.47/2.24;
    }
    else {
        height_pad = height - width*2.24/2.47;
    }

    for (let px = width_pad/2; px < width-width_pad/2; px++) {
        for (let py = height_pad/2; py < height-height_pad/2; py++) {
            const x0 = scale(px, width_pad/2, width-width_pad/2, -2.00, 0.47);
            const y0 = scale(py, height_pad/2, height-height_pad/2, -1.12, 1.12);
            let x = 0.0;
            let y = 0.0;
            let iteration = 0;


            
            while (x * x + y * y <= 4 && iteration < iterations*1000) {
                const xtemp = x * x - y * y + x0;
                y = 2 * x * y + y0;
                x = xtemp;
                iteration++;
            }
            
            if (iteration > 10) {
                const color = getColor(iteration, iterations*1000);
                plot(ctx, px, py, color);
            }
        }
    }
}

function scale(value, minInput, maxInput, minOutput, maxOutput) {
    return ((value - minInput) / (maxInput - minInput)) * (maxOutput - minOutput) + minOutput;
}

function getColor(iteration, maxIteration) {
    const ratio = 30*iteration / maxIteration;
    const color = Math.min(Math.floor(255 * ratio), 255);
    return `rgb(${255-color}, ${255-color}, ${255-color})`;
}

function plot(ctx, x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 1, 1);
}







