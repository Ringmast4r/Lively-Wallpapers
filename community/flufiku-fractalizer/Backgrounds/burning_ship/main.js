let size;
let width;
let height;

export function draw(ctx, iterations) {
    size = Math.min(ctx.canvas.width, ctx.canvas.height);
    width = ctx.canvas.width;
    height = ctx.canvas.height;

    const minX = -2.5;
    const maxX = 1.5;
    const minY = -2.0;
    const maxY = 1.0;

    for (let px = 0; px < width; px++) {
        for (let py = 0; py < height; py++) {
            const x0 = scale(px, 0, width, minX, maxX);
            const y0 = scale(py, 0, height, minY, maxY);
            let x = 0.0;
            let y = 0.0;
            let iteration = 0;

            while (x * x + y * y <= 4 && iteration < iterations * 10) {
                const xtemp = x * x - y * y + x0;
                y = Math.abs(2 * x * y) + y0;
                x = Math.abs(xtemp);
                iteration++;
            }

            const color = getColor(iteration, iterations * 10);
            plot(ctx, px, py, color);
        }
    }
}

function scale(value, minInput, maxInput, minOutput, maxOutput) {
    return ((value - minInput) / (maxInput - minInput)) * (maxOutput - minOutput) + minOutput;
}

function getColor(iteration, maxIteration) {
    const ratio = iteration / maxIteration;
    const color = Math.floor(255 * ratio);
    return `rgb(${255 - color}, ${255 - color}, ${255 - color})`;
}

function plot(ctx, x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 1, 1);
}
















//hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh