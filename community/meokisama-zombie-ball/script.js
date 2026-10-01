! function()
{
	var style = function(elem, css)
	{
		for (var i in css) elem.style[i] = css[i];
	}
	var screen = document.createElement("canvas");
	screen.onselectstart = function () { return false; }
	screen.ondrag = function () { return false; }
	document.body.appendChild(screen);
	var ctx = screen.getContext("2d");
	style(document.body,
	{
		overflow: "hidden",
		margin: 0
	});
	style(screen,
	{
		width: "100%",
		height: "100%",
		background: "#eee"
	});
	var path = "./res/";
	var move = function(e, touch)
	{
		e.preventDefault();
		var pointer = touch ? e.touches[0] : e;
		xm = pointer.clientX;
		ym = pointer.clientY;
	}
	document.addEventListener("mousemove", function(e)
	{
		move(e, false);
	}, true);
	screen.ontouchmove = function(e)
	{
		move(e, true);
	}
	var arms = [],
		scale, backFill;
	var Arm = function(x, y, arm, s)
	{
		for (var i in arm) this[i] = arm[i];
		this.s = s;
		this.x = x;
		this.y = y;
		this.image1 = new Image();
		this.image2 = new Image();
		this.image1.src = path + arm.src1 + ".png";
		this.image2.src = path + arm.src2 + ".png";
	}
	Arm.prototype.anim = function()
	{
		var x0 = this.x;
		var y0 = this.y;
		var x = x0 - xc;
		var y = y0 - yc;
		var d = Math.sqrt(x * x + y * y) / 2 / this.w1;
		if (d > 0.98)
		{
			d = 0.98;
		}
		var a1 = this.s * (Math.asin(d) + Math.PI / 2);
		var at2 = Math.atan2(x, y);
		var a2 = a1 - at2 + Math.PI / 2;
		ctx.save();
		ctx.translate(x0, y0);
		ctx.rotate(a2);
		ctx.drawImage(this.image1, this.xs1, this.ys1, this.w1 - this.xs2, this.h1);
		ctx.restore();
		ctx.save();
		ctx.translate(x0 + Math.cos(a2) * this.w1, y0 + Math.sin(a2) * this.w1);
		ctx.rotate(-a1 - at2 + Math.PI / 2);
		ctx.drawImage(this.image2, this.xs2, this.ys2, this.w2, this.h2);
		ctx.restore();
	}
	var resize = function()
	{
		screen.width = window.innerWidth;
		screen.height = window.innerHeight;
		scale = Math.min(screen.height, screen.width) < 380 ? 0.3 : 0.6;
		backFill = ctx.createRadialGradient(screen.width / 2, screen.height / 2, screen.height / 2, screen.width / 2, screen.height / 2, Math.max(screen.height,screen.width)*0.6);
		backFill.addColorStop(0, "white");
		backFill.addColorStop(1, "black");
		arms.length = 0;
		var arm1 = {
			xs1: 0 * scale,
			ys1: -50 * scale,
			src1: "zb2",
			w1: 446 * scale,
			h1: 108 * scale,
			src2: "zb1",
			xs2: -40 * scale,
			ys2: -60 * scale,
			w2: 446 * scale,
			h2: 122 * scale
		};
		var arm2 = {
			xs1: 0 * scale,
			ys1: -50 * scale,
			src1: "zb2",
			w1: 446 * scale,
			h1: 108 * scale,
			src2: "zb3",
			xs2: -40 * scale,
			ys2: -50 * scale,
			w2: 446 * scale,
			h2: 98 * scale
		};
		arms.push(new Arm(screen.width / 2 + 100, screen.height + 50, arm1, -1));
		arms.push(new Arm(screen.width / 2 - 100, screen.height + 50, arm2, +1));
		arms.push(new Arm(screen.width / 2 - 100, -50, arm1, -1));
		arms.push(new Arm(screen.width / 2 + 100, -50, arm2, +1));
		arms.push(new Arm(-50, screen.height / 2 + 100, arm1, -1));
		arms.push(new Arm(-50, screen.height / 2 - 100, arm2, +1));
		arms.push(new Arm(screen.width + 50, screen.height / 2 - 100, arm1, -1));
		arms.push(new Arm(screen.width + 50, screen.height / 2 + 100, arm2, +1));
	}
	window.addEventListener('resize', resize, false);
	resize();
	var xm = xc = screen.width / 2,
		ym = yc = screen.height / 2,
		xs = 0,
		ys = 0;
	var run = function()
	{
		requestAnimationFrame(run);
		ctx.fillStyle = backFill;
		ctx.fillRect(0, 0, screen.width, screen.height);
		ctx.beginPath();
		ctx.arc(xc, yc, 80 * scale, 0, 2 * Math.PI);
		ctx.fillStyle = "#f00";
		ctx.fill();
		var i = 0,
			arm;
		while (arm = arms[i++]) arm.anim();
		xc += (xm - xc) * 0.1;
		yc += (ym - yc) * 0.1;
		xs = xc - screen.width * .5;
		ys = yc - screen.height * .5;
	}
	requestAnimationFrame(run);
}();