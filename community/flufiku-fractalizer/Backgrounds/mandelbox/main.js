let size;
let width;
let height;

export function draw(ctx, iterations) {
    size = Math.min(ctx.canvas.width, ctx.canvas.height);
    width = ctx.canvas.width;
    height = ctx.canvas.height;

    const scale = -2.0;
    const escapeRadius = 2.0;
    const minX = -1.5;
    const maxX = 1.5;
    const minY = -1.5;
    const maxY = 1.5;


    let width_pad = 0;
    let height_pad = 0;

    if (width > height) {
        width_pad = width - height;
    }
    else {
        height_pad = height - width;
    }


    for (let px = width_pad/2; px < width-width_pad/2; px++) {
        for (let py = height_pad/2; py < height-height_pad/2; py++) {
            const x0 = scaleValue(px, width_pad/2, width-width_pad/2, minX, maxX);
            const y0 = scaleValue(py, height_pad/2, height-height_pad/2, minY, maxY);
            let z = { x: x0, y: y0 };
            let iteration = 0;

            while (iteration < iterations * 100) {
                z = mandelboxTransform(z, scale);
                if (magnitude(z) > escapeRadius) break;
                iteration++;
            }

            const color = getColor(iteration, iterations * 100);
            plot(ctx, px, py, color);
        }
    }
}

function scaleValue(value, minInput, maxInput, minOutput, maxOutput) {
    return ((value - minInput) / (maxInput - minInput)) * (maxOutput - minOutput) + minOutput;
}

function mandelboxTransform(z, scale) {
    let x = z.x;
    let y = z.y;

    if (x > 1) x = 2 - x;
    else if (x < -1) x = -2 - x;

    if (y > 1) y = 2 - y;
    else if (y < -1) y = -2 - y;

    const r2 = x * x + y * y;
    if (r2 < 0.25) {
        x *= 4;
        y *= 4;
    } else if (r2 < 1) {
        x /= r2;
        y /= r2;
    }

    return {
        x: scale * x + z.x,
        y: scale * y + z.y
    };
}

function magnitude(z) {
    return Math.sqrt(z.x * z.x + z.y * z.y);
}

function getColor(iteration, maxIteration) {
    const ratio = iteration / maxIteration;
    const color = Math.floor(255 * ratio);
    return `rgb(${255-color}, ${255-color}, ${255-color})`;
}

function plot(ctx, x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 1, 1);
}