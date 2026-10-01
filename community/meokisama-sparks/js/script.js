$(window).bind('load', function () {
    const raf = function (entry) {
        window.requestAnimationFrame(entry);
    };
    const random = function (min, max) {
        max = max + 1;
        return Math.floor(Math.random() * (max - min) + min);
    }
    var app = {
        init: function () {
            this.cacheDOM();
            this.style();
        },
        cacheDOM: function () {
            this.container = $('#container');
            this.images = $('img');

            this.mouseX = null;
            this.mouseY = null;
        },
        style: function () {
            this.images.imagesLoaded(function () {
                $(window).resize(function initial() {
                    TweenMax.set(app.container, {
                        opacity: 1
                    });
                    return initial;
                }());
            });
        },
        cursorEvents: function (e) {
            app.mouseX = e.clientX;
            app.mouseY = e.clientY;
        }
    }

    app.init();

    var cContainer = $('#c-container'),
        c = document.getElementById('c'),
        c2Container = $('#c2-container'),
        c2 = document.getElementById('c2'),
        cx = c.getContext('2d'),
        c2x = c2.getContext('2d'),
        particleIndex = 0,
        particles = {},
        particleNum = 1,
        particlesLoaded = false,
        Particle,
        Particle2,
        canvas,
        canvas2;

    c.width = $('#c').outerWidth();
    c.height = $('#c').outerHeight();

    c2.width = $('#c2').outerWidth();
    c2.height = $('#c2').outerHeight();

    //INITIAL CANVAS DRAW
    cx.fillStyle = 'rgba(0,0,0,1)';
    cx.fillRect(0, 0, c.width, c.height);
    c2x.fillStyle = 'rgba(0,0,0,1)';
    c2x.fillRect(0, 0, c2.width, c2.height);

    function particleFactory(thisCanvas, thisContext, thisParticleName, thisCanvasFunction) {

        var particleIndex = 0,
            particles = {},
            particleNum = 2,
            particlesLoaded = false;

        thisParticleName = function () {
            this.r = 8;
            this.rStart = this.r;
            this.rIncrement = this.r * -0.01;
            this.x = thisCanvas.width / 2;
            this.y = thisCanvas.height / 2;
          
            this.vxIsNegative = random(1,2);
          
            this.originTriggered = false;
            this.vx = this.vxIsNegative === 1 ? random(0,50) * -0.1 : random(0,50) * 0.1;
            this.vxMult = random(10,20) * 0.1;
            this.vy = random(-10, 10);
            this.vyMult = random(2,6) * -0.1;
            this.opacityLimit = 1;
            this.opacity = 1;
            this.opacityIncrement = 0.05;
            this.opacityReversing = false;
            this.gravity = 1;
            this.framerate = 0;
            this.framerateCounter = this.framerate;
            this.counter = 0;
            particleIndex++;
            particles[particleIndex] = this;
            this.id = particleIndex;
            this.life = 0;
            this.maxLife = random(0, 100);
            this.hue = random(30, 60);
            this.light = random(50, 100);
            this.color = `hsla(${this.hue},100%,${this.light}%,${this.opacity})`;
          
            this.bounced = false;
          
            this.duration = 60;
            this.durationTotal = this.duration + this.opacityLimit * 10;
            this.durationCounter = 0;
        }

        thisParticleName.prototype.draw = function () {

            if ((!this.originTriggered) && (app.mouseX != null)) {
                this.originTriggered = true;
                this.x = app.mouseX;
                this.y = app.mouseY;
            }
            this.color = `hsla(${this.hue},100%,${this.light}%,${this.opacity})`;
            thisContext.fillStyle = this.color;
            thisContext.beginPath();
            thisContext.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
            thisContext.fill();

            //START DRAW OPERATION
            this.r += this.rIncrement;
            this.x += this.vx;
            this.y += this.vy;
            this.durationCounter++;
            if (this.vx === 0) {
                this.vx++;
            }
            if (this.vxIsNegative === 1) {
                this.vx
            }
            if (this.vy === 0) {
                this.vy++;
            }
            if (this.y > thisCanvas.height - this.rStart) {
                if (!this.bounced) {
                  this.vx *= this.vxMult;
                } else {
                  this.vx *= 0.9;
                }
                this.bounced = true;
                this.vy *= this.vyMult;
                this.y = thisCanvas.height - this.rStart;
            }
            this.vy += this.gravity;
            if ((this.r <= 0)) {
                delete particles[this.id];
            }
            this.life++;
            //END DRAW OPERATION
        }

        thisCanvasFunction = function () {
            thisContext.globalCompositeOperation = 'source-over';
            thisContext.fillStyle = 'rgba(0,0,0,1)';
            thisContext.fillRect(0, 0, thisCanvas.width, thisCanvas.height);
            if (!particlesLoaded) {
                for (var i = 0; i < particleNum; i++) {
                    new thisParticleName();
                }
            }
            thisContext.globalCompositeOperation = 'lighter';
            for (var i in particles) {
                particles[i].draw();
            }
        }
        setInterval(thisCanvasFunction, 15);
    }

    $(window).resize(function initial() {
        window.addEventListener('mousemove', app.cursorEvents, false);

        c.width = $('#c').outerWidth();
        c.height = $('#c').outerHeight();

        c2.width = $('#c2').outerWidth();
        c2.height = $('#c2').outerHeight();

        return initial;
    }());

    particleFactory(c, cx, Particle, canvas);
    particleFactory(c2, c2x, Particle2, canvas2);

    TweenMax.set(c2Container, {
        transformOrigin: 'center bottom',
        scaleY: -1,
        opacity: 1
    });

    TweenMax.set(c2, {
        filter: 'blur(10px)'
    });
});