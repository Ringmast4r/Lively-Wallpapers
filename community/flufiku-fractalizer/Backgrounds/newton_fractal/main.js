let size;
let width;
let height;

export function draw(ctx, iterations) {
    size = Math.min(ctx.canvas.width, ctx.canvas.height);
    width = ctx.canvas.width;
    height = ctx.canvas.height;

    const roots = [
        { x: 1, y: 0 },
        { x: -0.5, y: Math.sqrt(3) / 2 },
        { x: -0.5, y: -Math.sqrt(3) / 2 }
    ];

    const colors = [
        'red',
        'green',
        'blue'
    ];

    for (let px = 0; px < width; px++) {
        for (let py = 0; py < height; py++) {
            const zx = scale(px, 0, width, -2.5, 1);
            const zy = scale(py, 0, height, -2, 1);
            let z = { x: zx, y: zy };

            for (let iteration = 0; iteration < iterations*20; iteration++) {
                z = subtract(z, divide(functionZ(z), derivativeZ(z)));

                const tolerance = 0.000001;
                for (let i = 0; i < roots.length; i++) {
                    const difference = subtract(z, roots[i]);
                    if (Math.abs(difference.x) < tolerance && Math.abs(difference.y) < tolerance) {
                        plot(ctx, px, py, colors[i]);
                        break;
                    }
                }
            }

            plot(ctx, px, py, 'black');
        }
        console.log(px);
    }
}

function scale(value, minInput, maxInput, minOutput, maxOutput) {
    return ((value - minInput) / (maxInput - minInput)) * (maxOutput - minOutput) + minOutput;
}

function functionZ(z) {
    return subtract(power(z, 3), { x: 1, y: 0 });
}

function derivativeZ(z) {
    return multiply({ x: 3, y: 0 }, multiply(z, z));
}

function power(z, exponent) {
    const polar = toPolar(z);
    const magnitude = Math.pow(polar.magnitude, exponent);
    const angle = polar.angle * exponent;
    return fromPolar(magnitude, angle);
}

function toPolar(z) {
    const magnitude = Math.sqrt(z.x * z.x + z.y * z.y);
    const angle = Math.atan2(z.y, z.x);
    return { magnitude, angle };
}

function fromPolar(magnitude, angle) {
    const x = magnitude * Math.cos(angle);
    const y = magnitude * Math.sin(angle);
    return { x, y };
}

function subtract(a, b) {
    return { x: a.x - b.x, y: a.y - b.y };
}

function multiply(a, b) {
    return { x: a.x * b.x - a.y * b.y, y: a.x * b.y + a.y * b.x };
}

function divide(a, b) {
    const denominator = b.x * b.x + b.y * b.y;
    return { x: (a.x * b.x + a.y * b.y) / denominator, y: (a.y * b.x - a.x * b.y) / denominator };
}

function plot(ctx, x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 1, 1);
}