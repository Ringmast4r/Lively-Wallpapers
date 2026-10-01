let size;
let width;
let height;

export function draw(ctx, iterations) {
    size = Math.min(ctx.canvas.width, ctx.canvas.height);
    width = ctx.canvas.width;
    height = ctx.canvas.height;


    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;

    let r = (2 * Math.sqrt(3) - 3) / 2;

    let c0 = new Circle(new Img(0.5, 0.5), -0.5);
    let c1 = new Circle(new Img(0.5 + Math.cos(270/360*Math.PI*2)*0.5*(1-(r/0.5)), 0.5 + Math.sin(270/360*Math.PI*2)*0.5*(1-(r/0.5))), r);
    let c2 = new Circle(new Img(0.5 + Math.cos(30/360*Math.PI*2)*0.5*(1-(r/0.5)), 0.5 + Math.sin(30/360*Math.PI*2)*0.5*(1-(r/0.5))), r);
    let c3 = new Circle(new Img(0.5 + Math.cos(150/360*Math.PI*2)*0.5*(1-(r/0.5)), 0.5 + Math.sin(150/360*Math.PI*2)*0.5*(1-(r/0.5))), r);

    c0.draw(ctx, size);
    c1.draw(ctx, size);
    c2.draw(ctx, size);
    c3.draw(ctx, size);


    draw_recursive_thrice(ctx, c0, c2, c3, c1, iterations);
    draw_recursive(ctx, c1, c2, c3, c0, iterations);
}

function draw_recursive(ctx, c1, c2, c3, c4, depth) {
    if (depth == 0) {
        return;
    }

    let k_root = 2 * Math.sqrt(c1.k * c2.k + c2.k * c3.k + c3.k * c1.k);
    let k_same = c1.k + c2.k + c3.k;
    let k_1 = k_same + k_root;
    let k_2 = k_same - k_root;

    let r;

    if (k_1 == c4.k) {
        r = 1/k_2;
    }
    else {
        r = 1/k_1;
    }



    let c_root = Img.mul(Img.root(Img.add(Img.add(Img.mul(Img.mul(new Img(c1.k, 0), new Img(c2.k, 0)), Img.mul(c1.c, c2.c)), Img.mul(Img.mul(new Img(c2.k, 0), new Img(c3.k, 0)), Img.mul(c2.c, c3.c))), Img.mul(Img.mul(new Img(c1.k, 0), new Img(c3.k, 0)), Img.mul(c1.c, c3.c))), 2), new Img(2, 0));
    let c_same = Img.add(Img.add(Img.mul(c1.c, new Img(c1.k, 0)), Img.mul(c2.c, new Img(c2.k, 0))), Img.mul(c3.c, new Img(c3.k, 0)));
    let c_1 = Img.div(Img.add(c_root, c_same), new Img(1/r, 0))
    let c_2 = Img.div(Img.sub(c_root, c_same), new Img(1/r, 0))

    let c_1temp = new Circle(c_1, r);
    let c_2temp = new Circle(c_2, r);

    let c;

    if (validateCirclePositions(c1, c_1temp)) {
        c = c_1;
    } else {
        c = c_2;
    }


    let c_new = new Circle(c, r);
    c_new.draw(ctx, size);


    draw_recursive(ctx, c1, c2, c_new, c3, depth - 1);
    draw_recursive(ctx, c1, c3, c_new, c2, depth - 1);
    draw_recursive(ctx, c2, c3, c_new, c1, depth - 1);
}



function draw_recursive_thrice(ctx, c1, c2, c3, c4, depth) {
    if (depth == 0) {
        return;
    }

    let k_root = 2 * Math.sqrt(c1.k * c2.k + c2.k * c3.k + c3.k * c1.k);
    let k_same = c1.k + c2.k + c3.k;
    let k_1 = k_same + k_root;
    let k_2 = k_same - k_root;

    let r;

    if (k_1 == c4.k) {
        r = 1/k_2;
    }
    else {
        r = 1/k_1;
    }

    let c_root = Img.mul(Img.root(Img.add(Img.add(Img.mul(Img.mul(new Img(c1.k, 0), new Img(c2.k, 0)), Img.mul(c1.c, c2.c)), Img.mul(Img.mul(new Img(c2.k, 0), new Img(c3.k, 0)), Img.mul(c2.c, c3.c))), Img.mul(Img.mul(new Img(c1.k, 0), new Img(c3.k, 0)), Img.mul(c1.c, c3.c))), 2), new Img(2, 0));
    let c_same = Img.add(Img.add(Img.mul(c1.c, new Img(c1.k, 0)), Img.mul(c2.c, new Img(c2.k, 0))), Img.mul(c3.c, new Img(c3.k, 0)));
    let c_1 = Img.div(Img.add(c_root, c_same), new Img(1/r, 0))
    let c_2 = Img.div(Img.sub(c_root, c_same), new Img(1/r, 0))

    let c_1temp = new Circle(c_1, r);
    let c_2temp = new Circle(c_2, r);

    let c;

    if (validateCirclePositions(c1, c_1temp)) {
        c = c_1;
    } else {
        c = c_2;
    }


    let c_new = new Circle(c, r);
    c_new.draw(ctx, size);

    let angle1 = 120 * Math.PI / 180;
    let angle2 = 240 * Math.PI / 180;

    let cosAngle1 = Math.cos(angle1);
    let sinAngle1 = Math.sin(angle1);
    let cosAngle2 = Math.cos(angle2);
    let sinAngle2 = Math.sin(angle2);

    let rotatedCenter1 = new Img(
        cosAngle1 * (c_new.c.real - 0.5) - sinAngle1 * (c_new.c.imaginary - 0.5) + 0.5,
        sinAngle1 * (c_new.c.real - 0.5) + cosAngle1 * (c_new.c.imaginary - 0.5) + 0.5
    );

    let rotatedCenter2 = new Img(
        cosAngle2 * (c_new.c.real - 0.5) - sinAngle2 * (c_new.c.imaginary - 0.5) + 0.5,
        sinAngle2 * (c_new.c.real - 0.5) + cosAngle2 * (c_new.c.imaginary - 0.5) + 0.5
    );

    let c_rotated1 = new Circle(rotatedCenter1, c_new.r);
    let c_rotated2 = new Circle(rotatedCenter2, c_new.r);
    c_rotated1.draw(ctx, size);
    c_rotated2.draw(ctx, size);

    draw_recursive_thrice(ctx, c1, c2, c_new, c3, depth - 1);
    draw_recursive_thrice(ctx, c1, c3, c_new, c2, depth - 1);
    draw_recursive_thrice(ctx, c2, c3, c_new, c1, depth - 1);
}




function pw(percent) {
    return width/2 - size/2 + size * percent;
}

function ph(percent) {
    return height/2 - size/2 + size * percent;
}


function validateCirclePositions(c1, c2) {
    const distance = Math.sqrt((c1.c.real - c2.c.real) ** 2 + (c1.c.imaginary - c2.c.imaginary) ** 2);
    const radiiSum = Math.abs(c1.r) + Math.abs(c2.r);
    return Math.abs(distance - radiiSum) < 1;
}


class Img {
    constructor(real, imaginary) {
        this.real = real;
        this.imaginary = imaginary;
    }

    static add(a, b) {
        return new Img(a.real + b.real, a.imaginary + b.imaginary);
    }

    static sub(a, b) {
        return new Img(a.real - b.real, a.imaginary - b.imaginary);
    }

    static mul(a, b) {
        const real = a.real * b.real - a.imaginary * b.imaginary;
        const imaginary = a.real * b.imaginary + a.imaginary * b.real;
        return new Img(real, imaginary);
    }

    static div(a, b) {
        const denominator = b.real ** 2 + b.imaginary ** 2;
        const real = (a.real * b.real + a.imaginary * b.imaginary) / denominator;
        const imaginary = (a.imaginary * b.real - a.real * b.imaginary) / denominator;
        return new Img(real, imaginary);
    }

    static pow(a, exponent) {
        const polar = a.toPolar();
        const magnitude = polar.magnitude ** exponent;
        const angle = polar.angle * exponent;
        return Img.fromPolar(magnitude, angle);
    }

    static root(a, n) {
        const polar = a.toPolar();
        const magnitude = Math.pow(polar.magnitude, 1 / n);
        const angle = polar.angle / n;
        return Img.fromPolar(magnitude, angle);
    }

    toPolar() {
        const magnitude = Math.sqrt(this.real ** 2 + this.imaginary ** 2);
        const angle = Math.atan2(this.imaginary, this.real);
        return { magnitude, angle };
    }

    static fromPolar(magnitude, angle) {
        const real = magnitude * Math.cos(angle);
        const imaginary = magnitude * Math.sin(angle);
        return new Img(real, imaginary);
    }

    toString() {
        return `x: ${this.real}, y: ${this.imaginary}`;
    }
}


class Circle {
    constructor(center, radius) {
        this.c = center;
        this.r = radius;
        this.k = 1/this.r;
    }

    draw(ctx, size)
    {
        ctx.beginPath();
        ctx.arc(pw(this.c.real), ph(this.c.imaginary), Math.abs(this.r) * size, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.closePath();
    }

    toString() {
        return `Center: ${this.center.toString()}, Radius: ${this.radius}`;
    }
}