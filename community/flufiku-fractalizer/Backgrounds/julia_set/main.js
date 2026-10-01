let size;
let width;
let height;

export function draw(ctx, iterations) {
    size = Math.min(ctx.canvas.width, ctx.canvas.height);
    width = ctx.canvas.width;
    height = ctx.canvas.height;

    const c = { x: -0.7, y: 0.27015 }; // Constant for the Julia set



    for (let px = 0; px < width; px++) {
        for (let py = 0; py < height; py++) {
            const x0 = scale(px, 0, width, -1.5, 1.5);
            const y0 = scale(py, 0, height, -1.5, 1.5);
            let x = x0;
            let y = y0;
            let iteration = 0;

            while (x * x + y * y <= 4 && iteration < iterations * 1000) {
                const xtemp = x * x - y * y + c.x;
                y = 2 * x * y + c.y;
                x = xtemp;
                iteration++;
            }

            if (iteration > 10) {
                const color = getColor(iteration, iterations * 1000);
                plot(ctx, px, py, color);
            }
        }
    }
}

function scale(value, minInput, maxInput, minOutput, maxOutput) {
    return ((value - minInput) / (maxInput - minInput)) * (maxOutput - minOutput) + minOutput;
}

function getColor(iteration, maxIteration) {
    const ratio = 30 * iteration / maxIteration;
    const color = Math.min(Math.floor(255 * ratio), 255);
    return `rgb(${255 - color}, ${255 - color}, ${255 - color})`;
}

function plot(ctx, x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 1, 1);
}