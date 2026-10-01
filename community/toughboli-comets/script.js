var params = {

    speed: 25,
    fadeStrength: 0.05,

    sparkleCount: 100,
    sparkleSpeed: 4,

    cometCount: 20,


    velocity: {
        x: -10,
        y: -10
    },
    accel: {
        x: 0,
        y: 0
    },


    color:
    {
        state: 0,
        backgroundColor: { r: 0, g: 0, b: 0 },
        cometColor: { r: 255, g: 255, b: 255 },
        gradientVector: "[[0.418 0.808 0.500] [0.888 0.500 0.500] [1.000 1.000 1.000] [0.000 0.333 0.667]]",
        get: function (t) {
            switch (this.state) {
                default:
                case 0://custom static
                    return this.cometColor;
                case 1://custom gradient
                    return this.vec2grad(t, this.gradientVector)
                case 2://rainbow
                    return this.gradient(t, { r: 0.5, g: 0.5, b: 0.5 }, { r: 0.5, g: 0.5, b: 0.5 }, { r: 1.0, g: 1.0, b: 1.0 }, { r: 0, g: 0.3333, b: 0.667 });
                case 3://fire
                    return this.gradient(t, { r: 1.138, g: 0.358, b: -0.531 }, { r: 0, g: -0.671, b: 0.5 }, { r: 1.0, g: 1.0, b: 1.0 }, { r: 0, g: 0.333, b: 0.666 });
                case 4://Black and White
                    return this.vec2grad(t, "[[0.500 0.500 0.500] [-3.142 -3.142 -3.142] [3.138 3.138 3.138] [0.000 0.000 0.000]]");

            }
        },

        vec2grad: function (t, vec) {
            vec = vec.trim();
            vec = vec.replaceAll(" ", ",");
            vec = JSON.parse(vec);
            dco = { r: vec[0][0], g: vec[0][1], b: vec[0][2] };
            amp = { r: vec[1][0], g: vec[1][1], b: vec[1][2] };
            freq = { r: vec[2][0], g: vec[2][1], b: vec[2][2] };
            phase = { r: vec[3][0], g: vec[3][1], b: vec[3][2] };
            return this.gradient(t, dco, amp, freq, phase);
        },

        gradient: function (t, DCOffset, Amp, Freq, Phase) {
            var r = DCOffset.r + Amp.r * Math.cos(6.28318 * (Freq.r * t + Phase.r));
            var g = DCOffset.g + Amp.g * Math.cos(6.28318 * (Freq.g * t + Phase.g));
            var b = DCOffset.b + Amp.b * Math.cos(6.28318 * (Freq.b * t + Phase.b));

            r *= 255;
            g *= 255;
            b *= 255;

            return { r, g, b };
        },

    },


    canvas: document.getElementById("canvas")

}

//main
//
var canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
let mainDraw = setInterval(draw, params.speed, ctx);
let sparkleDraw = setInterval(drawSparkles, 100 - (params.sparkleSpeed * 25), params.sparkleCount);
//
canvas.height = window.innerHeight;
canvas.width = window.innerWidth;

//definitions
//
function draw(ctx) {
    //used for fade out effect
    c = params.color.backgroundColor;
    ctx.fillStyle = `rgba(${c.r},${c.g},${c.b}, ${params.fadeStrength})`;
    ctx.fillRect(0, 0, params.canvas.width, params.canvas.height);

    drawComet();
}
function drawSparkles(n) {
    if (n == 0) {
        return;
    }
    let t = 0;
    for (let i = 0; i < n; i++) {
        c = params.color.get(t);
        ctx.fillStyle = `rgba(${c.r},${c.g},${c.b},1)`;
        ctx.beginPath();
        ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 1, 0, 2 * Math.PI);
        ctx.fill();
        t += 0.1;
    }

}
function drawComet() {
    var rx = Math.random() * canvas.width;
    var ry = Math.random() * canvas.height;
    if (comet.cometCount >= params.cometCount) {
        return;
    }
    var c = new comet(rx, ry, params.velocity.x, params.velocity.y, params);
}

function clearBg() {
    let ctx = params.canvas.getContext("2d");
    ctx.fillStyle = `rgba(255,255,255,1)`;
    ctx.fillRect(0, 0, params.canvas.width, params.canvas.height);
}

class comet {
    constructor(x, y, vx, vy, params) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.radius = 5;
        this.t = 0;
        this.params = params;
        this.interval = null;
        this.startInterval();
        comet.cometCount++;
    };

    startInterval() {
        this.interval = setInterval(() => {
            this.draw();
        }, this.params.speed);
    };

    stopInterval() {
        comet.cometCount--;
        clearInterval(this.interval);
    };

    draw() {
        let ctx = this.params.canvas.getContext("2d");
        //drawing
        this.t += 0.1;
        let c = this.params.color.get(this.t);

        ctx.strokeStyle = `rgba(${c.r},${c.g},${c.b},1)`;
        ctx.lineWidth = this.radius;
        ctx.lineCap = "round";

        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + this.vx, this.y + this.vy);
        ctx.stroke();

        //updating position
        this.x += this.vx;
        this.y += this.vy;
        this.vx += this.params.accel.x;
        this.vy += this.params.accel.y;

        //determine when to kill the comet
        if (this.t > 1000) {
            this.stopInterval();
        }
        if (this.x < 0 || this.x > this.params.canvas.width || this.y < 0 || this.y > this.params.canvas.height) {
            this.stopInterval();
        }
    };

}
comet.cometCount = 0;

window.onresize = () => {
    location.reload();
}

function livelyPropertyListener(name, val) {
    switch (name) {
        case "speed":
            params.speed = 50 - val;
            clearInterval(mainDraw);
            mainDraw = setInterval(draw, params.speed, ctx);
            break;
        case "fadeStrength":
            params.fadeStrength = val;
            break;
        case "backgroundColor":
            clearBg();
            params.color.backgroundColor = hexToRGB(val);
            break;
        case "cometColorMode":
            params.color.state = val;
            break;
        case "cometColor":
            params.color.cometColor = hexToRGB(String(val));
            break;
        case "customGradientVector":
            params.color.gradientVector = val;
        case "sparkleCount":
            params.sparkleCount = val;
            clearInterval(sparkleDraw);
            sparkleDraw = setInterval(drawSparkles, 100 - (params.sparkleSpeed * 25), params.sparkleCount);
            break;
        case "sparkleSpeed":
            params.sparkleSpeed = val;
            clearInterval(sparkleDraw);
            sparkleDraw = setInterval(drawSparkles, 100 - (params.sparkleSpeed * 25), params.sparkleCount);
            break;
        case "cometCount":
            params.cometCount = val;
            break;
        case "velocityX":
            params.velocity.x = Number(String(val).trim());
            break;
        case "velocityY":
            params.velocity.y = Number(String(val).trim());
            break;
        case "accelX":
            params.accel.x = Number(String(val).trim());
            break;
        case "accelY":
            params.accel.y = Number(String(val).trim());
            break;
    }
}



function hexToRGB(hex) {
    hex = hex.replace("#", "");
    let i = parseInt(hex, 16);
    return {
        r: Math.trunc(i % 16 ** 6 / 16 ** 4),
        g: Math.trunc(i % 16 ** 4 / 16 ** 2),
        b: Math.trunc(i % 16 ** 2 / 16 ** 0)
    }
}
