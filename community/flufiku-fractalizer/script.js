let Iterations = 3;
let DropdownType = 18;

let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");

draw_fractal();

window.addEventListener('resize', draw_fractal);

function livelyPropertyListener(name, val)
{    
    switch(name) {
        case "DropdownType":
            DropdownType = val;
            break;
        case "SliderIterations":
            Iterations = val;
            break;
    }

    draw_fractal();
}

function resizeCanvas(canvas, ctx) {
    const devicePixelRatio = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * devicePixelRatio;
    canvas.height = window.innerHeight * devicePixelRatio;

    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;

    ctx.scale(devicePixelRatio, devicePixelRatio);
}

async function draw_fractal()
{
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");

    resizeCanvas(canvas, ctx);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (DropdownType == 0) {
        const module = await import('./Backgrounds/sierpinski_triangle/main.js');
        module.draw(ctx, Iterations);
    }

    else if (DropdownType == 1) {
        const module = await import('./Backgrounds/sierpinski_carpet/main.js');
        module.draw(ctx, Iterations);
    }

    else if (DropdownType == 2) {
        const module = await import('./Backgrounds/apollonian_gasket/main.js');
        module.draw(ctx, Iterations);
    }

    else if (DropdownType == 3) {
        const module = await import('./Backgrounds/koch_snowflake/main.js');
        module.draw(ctx, Iterations);
    }

    else if (DropdownType == 4) {
        const module = await import('./Backgrounds/koch_antisnowflake/main.js');
        module.draw(ctx, Iterations);
    }

    else if (DropdownType == 5) {
        const module = await import('./Backgrounds/dragon_curve/main.js');
        module.draw(ctx, Iterations);
    }

    else if (DropdownType == 6) {
        const module = await import('./Backgrounds/fractal_tree/main.js');
        module.draw(ctx, Iterations);
    }

    else if (DropdownType == 7) {
        const module = await import('./Backgrounds/h_tree/main.js');
        module.draw(ctx, Iterations);
    }

    else if (DropdownType == 8) {
        const module = await import('./Backgrounds/pythagoras_tree/main.js');
        module.draw(ctx, Iterations);
    }

    else if (DropdownType == 9) {
        const module = await import('./Backgrounds/barnsley_fern/main.js');
        module.draw(ctx, Iterations);
    }

    else if (DropdownType == 10) {
        const module = await import('./Backgrounds/t_square/main.js');
        module.draw(ctx, Iterations);
    }

    else if (DropdownType == 11) {
        const module = await import('./Backgrounds/minkowski_island/main.js');
        module.draw(ctx, Iterations);
    }

    else if (DropdownType == 12) {
        const module = await import('./Backgrounds/levy_c_curve/main.js');
        module.draw(ctx, Iterations);
    }

    else if (DropdownType == 13) {
        const module = await import('./Backgrounds/logistic_map/main.js');
        module.draw(ctx, Iterations);
    }

    else if (DropdownType == 14) {
        const module = await import('./Backgrounds/mandelbrot_set/main.js');
        module.draw(ctx, Iterations);
    }

    else if (DropdownType == 15) {
        const module = await import('./Backgrounds/mandelbox/main.js');
        module.draw(ctx, Iterations);
    }

    else if (DropdownType == 16) {
        const module = await import('./Backgrounds/newton_fractal/main.js');
        module.draw(ctx, Iterations);
    }

    else if (DropdownType == 17) {
        const module = await import('./Backgrounds/julia_set/main.js');
        module.draw(ctx, Iterations);
    }

    else if (DropdownType == 18) {
        const module = await import('./Backgrounds/burning_ship/main.js');
        module.draw(ctx, Iterations);
    }
}