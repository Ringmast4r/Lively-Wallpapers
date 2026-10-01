let size;
let width;
let height;

export function draw(ctx, Iterations) {
    size = Math.min(ctx.canvas.width, ctx.canvas.height);
    width = ctx.canvas.width;
    height = ctx.canvas.height;
    

    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;

    const p1 = { x: 0.2, y: 0.2};
    const p2 = { x: 0.8, y: 0.2};
    const p3 = { x: 0.8, y: 0.8};
    const p4 = { x: 0.2, y: 0.8};

    draw_recursive(ctx, p1, p2, Iterations);
    draw_recursive(ctx, p2, p3, Iterations);
    draw_recursive(ctx, p3, p4, Iterations);
    draw_recursive(ctx, p4, p1, Iterations);
}

function draw_recursive(ctx, point1, point2, depth) {
    if (depth === 0) {
        draw_line(ctx, point1, point2);
        return;
    }

    const length = Math.sqrt((point2.x - point1.x) ** 2 + (point2.y - point1.y) ** 2);
    const angle = Math.atan2(point2.y - point1.y, point2.x - point1.x);

    const p1 = { x: point1.x, y: point1.y };
    const p2 = { x: p1.x + Math.cos(angle) * length / 4, y: p1.y + Math.sin(angle) * length / 4 };
    const p3 = { x: p2.x + Math.cos(angle-Math.PI/2) * length / 4, y: p2.y + Math.sin(angle-Math.PI/2) * length / 4 };
    const p4 = { x: p3.x + Math.cos(angle) * length / 4, y: p3.y + Math.sin(angle) * length / 4 };
    const p5 = { x: p4.x + Math.cos(angle+Math.PI/2) * length / 4, y: p4.y + Math.sin(angle+Math.PI/2) * length / 4 };
    const p6 = { x: p5.x + Math.cos(angle+Math.PI/2) * length / 4, y: p5.y + Math.sin(angle+Math.PI/2) * length / 4 };
    const p7 = { x: p6.x + Math.cos(angle) * length / 4, y: p6.y + Math.sin(angle) * length / 4 };
    const p8 = { x: p7.x + Math.cos(angle-Math.PI/2) * length / 4, y: p7.y + Math.sin(angle-Math.PI/2) * length / 4 };
    const p9 = { x: p8.x + Math.cos(angle) * length / 4, y: p8.y + Math.sin(angle) * length / 4 };

    draw_recursive(ctx, p1, p2, depth - 1);
    draw_recursive(ctx, p2, p3, depth - 1);
    draw_recursive(ctx, p3, p4, depth - 1);
    draw_recursive(ctx, p4, p5, depth - 1);
    draw_recursive(ctx, p5, p6, depth - 1);
    draw_recursive(ctx, p6, p7, depth - 1);
    draw_recursive(ctx, p7, p8, depth - 1);
    draw_recursive(ctx, p8, p9, depth - 1);
}

function draw_line(ctx, point1, point2) {
    ctx.beginPath();
    ctx.moveTo(pw(point1.x), ph(point1.y));
    ctx.lineTo(pw(point2.x), ph(point2.y));
    ctx.stroke();
}

function pw(percent) {
    return width/2 - size/2 + size * percent;
}

function ph(percent) {
    return height/2 - size/2 + size * percent;
}