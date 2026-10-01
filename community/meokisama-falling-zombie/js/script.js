// A tribute to the Tetka Falling Woman Flash Movie...
// http://www.geocities.ws/mr_marble_madness/ragdoll/tetka.htm
"use strict";
{
	const Aargh = class {
		constructor(srcimg) {
			this.x = -10000.0;
			this.y = 0.0;
			this.w = 0.0;
			this.h = 0.0;
			this.vx = 0.0;
			this.vy = 0.0;
			this.a = 0;
			this.s = Math.sqrt(canvas.width) / 2;
			this.shape = new Image();
			this.loaded = false;
			this.shape.src = "./js/res/" + srcimg + ".png";
		}
		anim() {
			this.x += this.vx;
			this.y += this.vy;
			if (this.loaded) {
				const tx = this.x + canvas.x + canvas.width * 0.5;
				const ty = this.y + canvas.y + canvas.height * 0.5;
				ctx.translate(tx, ty);
				ctx.rotate(this.a);
				ctx.drawImage(
					this.shape,
					-this.w * 0.5,
					-this.h * 0.5,
					this.w,
					this.h
				);
				ctx.rotate(-this.a);
				ctx.translate(-tx, -ty);
			} else {
				if (this.shape.complete && this.shape.width) {
					this.w = this.shape.width * this.s / 40;
					this.h = this.shape.height * this.s / 40;
					this.loaded = true;
				}
			}
		}
	};
	const Particle = class {
		constructor() {
			this.x = 0.0;
			this.y = 0.0;
			this.r = 0.0;
			this.vx = 0.0;
			this.vy = 0.0;
			this.shape = Particle.shape("rgba(255,164,0,1)");
		}
		anim() {
			if (this.r > 0) {
				this.r *= 0.99;
				this.x += this.vx;
				this.y += this.vy;
				this.vy += 0.1;
				ctx.drawImage(
					this.shape,
					this.x - this.r + canvas.x + canvas.width * 0.5,
					this.y - this.r + canvas.y + canvas.height * 0.5,
					2 * this.r,
					2 * this.r
				);
			}
		}
	};
	Particle.shape = color => {
		const shape = document.createElement("canvas");
		shape.width = 128;
		shape.height = 128;
		const ctx = shape.getContext("2d");
		ctx.beginPath();
		ctx.fillStyle = color;
		ctx.arc(64, 64, 63, 0, 2 * Math.PI);
		ctx.fill();
		return shape;
	};
	const Disk = class {
		constructor() {
			this.x = 0;
			this.y = -10000;
			this.vx = 3 * Math.random() - 1.5;
			this.vy = 3 * Math.random() - 1.5;
			this.r = 0;
			this.shape = Particle.shape("rgba(255,128,64,0.5)");
			this.aargh = true;
		}
		anim() {
			this.x += this.vx;
			this.y += this.vy;
			ctx.drawImage(
				this.shape,
				this.x - this.r + canvas.x + canvas.width * 0.5,
				this.y - this.r + canvas.y + canvas.height * 0.5,
				2 * this.r,
				2 * this.r
			);
			if (this.y < -canvas.y - canvas.height) {
				this.r = doll.s * 4 + Math.random() * doll.s * 3;
				this.y =
					this.r + canvas.height * 0.5 - canvas.y + Math.random() * canvas.height;
				this.x = -canvas.x + Math.random() * canvas.width - canvas.width * 0.5;
				this.sat = 0;
				this.aargh = true;
			}
		}
	};
	const Doll = class {
		constructor(size, structure) {
			this.s = size;
			this.points = [];
			this.links = [];
			this.angles = [];
			const len = (p0, p1) => {
				for (const link of structure.links) {
					if (
						(link.p0 === p0 && link.p1 === p1) ||
						(link.p0 === p1 && link.p1 === p0)
					) {
						return link.length;
						break;
					}
				}
				return 1;
			};
			for (const link of structure.links) {
				this.links.push(new Doll.Link(this, link, structure.shapes));
			}
			for (const constraint of structure.constraints) {
				this.angles.push(
					new Doll.Angle(
						this.points[constraint.p1],
						this.points[constraint.p2],
						this.points[constraint.p3],
						len(constraint.p1, constraint.p2) * size,
						len(constraint.p2, constraint.p3) * size,
						constraint.angle,
						constraint.range,
						0.05
					)
				);
			}
		}
		anim() {
			for (const angle of this.angles) angle.solve();
			for (const point of this.points) point.anim();
			for (const link of this.links) link.draw();
		}
		collide(disks) {
			for (const point of this.points) {
				for (const disk of disks) {
					const dx = point.x - disk.x;
					const dy = point.y - disk.y;
					const sd = dx * dx + dy * dy;
					const w = 0.5 * point.w + disk.r;
					if (sd < w * w) {
						const d = Math.sqrt(sd);
						point.x += 0.5 * dx / d * (w - d);
						point.y += 0.5 * dy / d * (w - d);
						// DON'T KEEP CALM AND RUN !
						const i = ++iParticles % nParticles;
						const p = particles[i];
						p.x = point.x;
						p.y = point.y;
						p.r = 2 + Math.sqrt(w - d) * 3.0;
						p.vx = dx * 0.02 + dx * 0.01 * Math.random();
						p.vy = dy * 0.02 + dy * 0.01 * Math.random();
						// Aargh!
						if (w - d > 20 && disk.aargh) {
							disk.aargh = false;
							const j = ++iAarghs % nAarghs;
							const q = aarghs[j];
							q.x = point.x;
							q.y = point.y;
							q.vx = 6 * (Math.random() - 0.5);
							q.vy = -canvas.vy * 0.5;
							q.a = q.vx > 0 ? Math.random() * 0.4 : -Math.random() * 0.4;
						}
					}
				}
			}
		}
	};
	Doll.Point = class {
		constructor() {
			this.x = 0;
			this.y = 0;
			this.xb = 0;
			this.yb = 0;
			this.w = 0;
			this.mass = 1;
		}
		anim() {
			if (pointer.pointDrag && this === pointer.pointDrag) {
				this.x = this.xb = pointer.x - canvas.x - canvas.width * 0.5;
				this.y = this.yb = pointer.y - canvas.y - canvas.height * 0.5;
			} else {
				const vx = (this.x - this.xb) * 0.99;
				const vy = (this.y - this.yb) * 0.99;
				this.xb = this.x;
				this.yb = this.y;
				this.x += vx;
				this.y += vy + 0.1 * this.mass;
			}
		}
	};
	Doll.Angle = class {
		constructor(p1, p2, p3, len1, len2, angle, range, force) {
			this.p1 = p1;
			this.p2 = p2;
			this.p3 = p3;
			this.len1 = len1;
			this.len2 = len2;
			this.angle = angle;
			this.range = range;
			this.force = force;
		}
		a12(p1, p2, p3) {
			const a = Math.atan2(p2.y - p1.y, p2.x - p1.x);
			const b = Math.atan2(p3.y - p2.y, p3.x - p2.x);
			const c = this.angle - (b - a);
			const d = c > Math.PI ? c - 2 * Math.PI : c < -Math.PI ? c + 2 * Math.PI : c;
			const e = Math.abs(d) > this.range
				? (-Math.sign(d) * this.range + d) * this.force
				: 0;
			const m = p1.mass + p2.mass;
			const m1 = p1.mass / m;
			const m2 = p2.mass / m;
			const cos = Math.cos(a - e);
			const sin = Math.sin(a - e);
			const x1 = p1.x + (p2.x - p1.x) * m2;
			const y1 = p1.y + (p2.y - p1.y) * m2;
			p1.x = x1 - cos * this.len1 * m2;
			p1.y = y1 - sin * this.len1 * m2;
			p2.x = x1 + cos * this.len1 * m1;
			p2.y = y1 + sin * this.len1 * m1;
			return e;
		}
		a23(e, p2, p3) {
			const a = Math.atan2(p2.y - p3.y, p2.x - p3.x) + e;
			const m = p2.mass + p3.mass;
			const m2 = p2.mass / m;
			const m3 = p3.mass / m;
			const cos = Math.cos(a);
			const sin = Math.sin(a);
			const x1 = p3.x + (p2.x - p3.x) * m2;
			const y1 = p3.y + (p2.y - p3.y) * m2;
			p3.x = x1 - cos * this.len2 * m2;
			p3.y = y1 - sin * this.len2 * m2;
			p2.x = x1 + cos * this.len2 * m3;
			p2.y = y1 + sin * this.len2 * m3;
		}
		solve() {
			const e = this.a12(this.p1, this.p2, this.p3);
			this.a23(e, this.p2, this.p3);
		}
	};
	Doll.Link = class {
		constructor(doll, link, shapes) {
			this.length = link.length * doll.s;
			this.width = link.width * doll.s;
			this.offset = link.offset || 0.0;
			this.shape = link.img ? document.getElementById(link.img) : null;
			if (link.shape) {
				const svg = shapes[link.shape];
				if (svg) {
					// for perf reasons, cache the svg image as a canvas image
					this.shape = document.createElement("canvas");
					const image = new Image();
					image.onload = (e) => {
						this.shape.width = e.target.width;
						this.shape.height = e.target.height;
						const ctx = this.shape.getContext("2d");
						ctx.drawImage(e.target, 0, 0);	
					}
					image.src = 'data:image/svg+xml;base64,'+window.btoa(svg);
				}
			}
			doll.points[link.p0] = this.p0 = doll.points[link.p0]
				? doll.points[link.p0]
				: new Doll.Point();
			doll.points[link.p1] = this.p1 = doll.points[link.p1]
				? doll.points[link.p1]
				: new Doll.Point();
			if (this.width > this.p0.w) this.p0.w = this.width;
			this.p0.mass++;
			this.p1.mass++;
		}
		draw() {
			if (!this.shape) return;
			const dx = this.p1.x - this.p0.x;
			const dy = this.p1.y - this.p0.y;
			const a = Math.atan2(dy, dx);
			const d = pointer.pointDrag ? Math.sqrt(dx * dx + dy * dy) : this.length;
			const tx = this.p0.x + canvas.x + canvas.width * 0.5;
			const ty = this.p0.y + canvas.y + canvas.height * 0.5;
			ctx.translate(tx, ty);
			ctx.rotate(a);
			ctx.drawImage(
				this.shape,
				-this.width * 0.15 - this.width * this.offset,
				-this.width * 0.5,
				d + this.width * 0.3,
				this.width
			);
			ctx.rotate(-a);
			ctx.translate(-tx, -ty);
		}
	};
	// ---- set canvas ----
	const canvas = {
		init() {
			this.elem = document.createElement("canvas");
			document.body.appendChild(this.elem);
			this.resize();
			this.x = this.vx = 0;
			this.y = this.vy = 0;
			this.s = 0.01;
			window.addEventListener("resize", () => canvas.resize(), false);
			return this.elem.getContext("2d");
		},
		createBackground() {
			const shape = document.createElement("canvas");
			shape.width = this.width;
			shape.height = this.height;
			const ctx = shape.getContext("2d");
			ctx.fillStyle = "#123";
			ctx.fillRect(0, 0, this.width, this.height);
			ctx.beginPath();
			ctx.arc(
				this.width * 0.5,
				this.height * 0.5,
				Math.min(400, this.width, this.height) * 0.65,
				0,
				2 * Math.PI
			);
			ctx.fillStyle = "#fff";
			ctx.fill();
			return shape;
		},
		createFilter() {
			const shape = document.createElement("canvas");
			shape.width = this.width;
			shape.height = this.height;
			const ctx = shape.getContext("2d");
			for (let i = 0; i < this.width + 5; i += 5) {
				for (let j = 0; j < this.height + 5; j += 5) {
					ctx.beginPath();
					ctx.arc(i, j, 2, 0, 2 * Math.PI);
					ctx.fillStyle = "#331";
					ctx.fill();
				}
			}
			return shape;
		},
		resize() {
			this.width = this.elem.width = this.elem.offsetWidth;
			this.height = this.elem.height = this.elem.offsetHeight;
			this.background = this.createBackground();
			this.filter = this.createFilter();
		},
		scroll(p) {
			if (!pointer.pointDrag) {
				this.vx = (-p.x - this.x) * this.s;
				this.vy = (-p.y - this.y) * this.s;
				this.x += this.vx;
				this.y += this.vy;
				if (this.s < 0.25) this.s += 0.001;
			} else this.s = 0.01;
		}
	};
	// ---- set pointer ----
	const pointer = {
		init(canvas) {
			this.x = 0;
			this.y = 0;
			window.addEventListener("mousemove", e => this.move(e), false);
			canvas.elem.addEventListener("touchmove", e => this.move(e), false);
			window.addEventListener("mousedown", e => this.down(e), false);
			window.addEventListener("touchstart", e => this.down(e), false);
			window.addEventListener("mouseup", e => this.up(e), false);
			window.addEventListener("touchend", e => this.up(e), false);
		},
		down(e) {
			this.move(e);
			let msd = 1000000;
			for (const point of doll.points) {
				const dx = point.x + canvas.x - this.x + canvas.width * 0.5;
				const dy = point.y + canvas.y - this.y + canvas.height * 0.5;
				const sd = dx * dx + dy * dy;
				if (sd < canvas.width * 0.05 * canvas.width * 0.05) {
					if (sd < msd) {
						msd = sd;
						this.pointDrag = point;
					}
				}
			}
		},
		up(e) {
			this.pointDrag = null;
		},
		move(e) {
			let touchMode = e.targetTouches,
				pointer;
			if (touchMode) {
				e.preventDefault();
				pointer = touchMode[0];
			} else pointer = e;
			this.x = pointer.clientX;
			this.y = pointer.clientY;
		}
	};
	// ---- init ----
	const ctx = canvas.init();
	pointer.init(canvas);
	// ---- main loop ----
	const run = () => {
		requestAnimationFrame(run);
		ctx.drawImage(canvas.background, 0, 0);
		canvas.scroll(doll.points[3]);
		for (const disk of disks) disk.anim();
		ctx.stroke();
		doll.collide(disks);
		doll.anim();
		for (const p of particles) p.anim();
		for (const a of aarghs) a.anim();
		ctx.globalCompositeOperation = "lighter";
		ctx.drawImage(canvas.filter, 0, 0);
		ctx.globalCompositeOperation = "source-over";
	};
	const disks = [];
	const particles = [];
	const aarghs = [];
	const nParticles = 800;
	const tAarghs = ["boom","pow","ooops", "hmm", "aargh", "splash"];
	const nAarghs = tAarghs.length;
	let iAarghs = 0;
	let iParticles = 0;
	for (let i = 0; i < nParticles; i++) {
		particles.push(new Particle());
	}
	tAarghs.forEach(t => {
		aarghs.push(new Aargh(t));
	});
	for (let i = 0; i < 10; i++) {
		disks.push(new Disk());
	}

	/*

                             888     d8b         
                             888     Y8P         
                             888                 
88888888 .d88b. 88888b.d88b. 88888b. 888 .d88b.  
   d88P d88""88b888 "888 "88b888 "88b888d8P  Y8b 
  d88P  888  888888  888  888888  88888888888888 
 d88P   Y88..88P888  888  888888 d88P888Y8b.     
88888888 "Y88P" 888  888  88888888P" 888 "Y8888  


*/

	const doll = new Doll(Math.sqrt(canvas.width) / 2, {
		links: [
			{
				p0: 0,
				p1: 1,
				length: 7,
				width: 2.5,
				shape: "armRight"
			},
			{
				p0: 1,
				p1: 2,
				length: 7,
				width: 2.5,
				shape: "handRight"
			},
			{
				p0: 3,
				p1: 7,
				length: 6,
				width: 3.5,
				shape: "leftLeg"
			},
			{
				p0: 7,
				p1: 8,
				length: 7,
				width: 3,
				shape: "leftFoot"
			},
			{
				p0: 3,
				p1: 9,
				length: 6,
				width: 2.5,
				offset: 0.3,
				shape: "rightLeg"
			},
			{
				p0: 9,
				p1: 10,
				length: 7,
				width: 4,
				offset: 0.05,
				shape: "rightFoot"
			},
			{
				p0: 0,
				p1: 4,
				length: 4.5,
				width: 4.5,
				offset: -0.3,
				shape: "head"
			},
			{
				p0: 0,
				p1: 11,
				length: 4,
				width: 5,
				offset: 0.1,
				shape: "tors"
			},
			{
				p0: 11,
				p1: 3,
				length: 4,
				width: 3,
				offset: 0.2,
				shape: "stomach"
			},
			{
				p0: 0,
				p1: 5,
				length: 6,
				width: 2,
				shape: "leftArm"
			},
			{
				p0: 5,
				p1: 6,
				length: 7,
				width: 4,
				shape: "leftHand"
			}
		],
		constraints: [
			{
				p1: 4,
				p2: 0,
				p3: 11,
				angle: 0,
				range: 1
			},
			{
				p1: 0,
				p2: 1,
				p3: 2,
				angle: -Math.PI / 2,
				range: Math.PI / 2
			},
			{
				p1: 0,
				p2: 5,
				p3: 6,
				angle: -Math.PI / 2,
				range: Math.PI / 2
			},
			{
				p1: 11,
				p2: 3,
				p3: 7,
				angle: -Math.PI / 4,
				range: Math.PI / 3
			},
			{
				p1: 11,
				p2: 3,
				p3: 9,
				angle: Math.PI / 4,
				range: Math.PI / 3
			},
			{
				p1: 3,
				p2: 7,
				p3: 8,
				angle: Math.PI / 2,
				range: Math.PI / 3
			},
			{
				p1: 3,
				p2: 9,
				p3: 10,
				angle: Math.PI / 2,
				range: Math.PI / 3
			},
			{
				p1: 0,
				p2: 11,
				p3: 3,
				angle: 0,
				range: 0.1
			},
			{
				p1: 11,
				p2: 0,
				p3: 1,
				angle: Math.PI / 2,
				range: Math.PI / 3
			},
			{
				p1: 11,
				p2: 0,
				p3: 5,
				angle: -Math.PI / 2,
				range: Math.PI / 3
			}
		],
		shapes: {
			armRight: `
				<svg version="1.0" xmlns="http://www.w3.org/2000/svg"
				 width="291.000000pt" height="94.000000pt" viewBox="0 0 291.000000 94.000000"
				 preserveAspectRatio="xMidYMid meet">
				<g transform="translate(0.000000,94.000000) scale(0.100000,-0.100000)"
				fill="#000000" stroke="none">
				<path d="M410 811 c-87 -6 -116 -12 -170 -37 -82 -39 -145 -101 -184 -184 -28
				-58 -31 -75 -31 -155 0 -71 5 -102 23 -147 47 -116 163 -208 288 -228 32 -5
				170 -15 306 -21 274 -13 377 -5 431 35 22 16 44 21 91 21 51 0 76 -7 147 -42
				108 -51 117 -48 101 38 -6 35 -10 64 -9 65 1 1 25 -2 52 -7 85 -16 566 -23
				633 -10 32 6 154 43 271 81 116 39 216 68 221 65 5 -3 30 1 55 10 25 8 60 15
				78 15 39 0 101 29 145 68 29 25 33 37 39 94 4 52 2 73 -15 110 -31 70 -77 96
				-203 114 -57 8 -120 12 -139 8 -68 -12 -543 -4 -700 12 -148 16 -310 15 -495
				-2 l-60 -5 28 23 c27 24 35 52 17 63 -5 3 -38 -5 -72 -18 -91 -35 -97 -37
				-112 -31 -8 3 -20 19 -26 34 -15 37 -55 46 -149 35 -82 -10 -180 -11 -336 -3
				-66 3 -167 3 -225 -1z"/>
				</g>
				</svg>
			`,
			handRight: `
				<svg version="1.0" xmlns="http://www.w3.org/2000/svg"
				 width="401.000000pt" height="141.000000pt" viewBox="0 0 401.000000 141.000000"
				 preserveAspectRatio="xMidYMid meet">
				<g transform="translate(0.000000,141.000000) scale(0.100000,-0.100000)"
				fill="#000000" stroke="none">
				<path d="M2357 1394 c-1 -1 -18 -4 -37 -7 -83 -13 -233 -65 -250 -87 -3 -3
				-23 -17 -45 -30 -39 -24 -47 -30 -103 -77 -15 -12 -39 -28 -54 -34 -15 -6 -28
				-16 -28 -21 0 -5 -4 -6 -10 -3 -5 3 -10 1 -10 -6 0 -7 -3 -9 -7 -6 -3 4 -17 0
				-29 -8 -13 -8 -34 -17 -46 -19 -13 -3 -23 -5 -23 -6 0 -1 -13 -3 -30 -5 -16
				-2 -46 -6 -65 -9 -118 -17 -189 -18 -495 -11 -187 4 -202 5 -222 18 -7 5 -13
				5 -13 1 0 -3 -7 -1 -15 6 -8 7 -15 10 -15 6 0 -3 -12 -1 -28 5 -26 10 -40 14
				-92 24 -14 3 -36 7 -50 10 -29 6 -154 6 -190 0 -85 -14 -84 -14 -205 -60 -133
				-51 -166 -77 -249 -197 l-46 -68 0 -130 0 -129 32 -48 c53 -77 112 -133 142
				-133 57 0 117 45 184 141 l33 45 112 -3 c230 -6 428 -1 487 11 13 3 42 8 65
				11 22 4 74 15 115 26 41 11 86 22 100 25 14 3 50 13 80 24 73 25 143 44 153
				42 4 -1 18 4 30 13 12 8 27 15 33 15 6 0 28 7 48 15 20 8 38 15 41 15 3 0 32
				13 64 29 32 17 61 27 65 24 3 -4 6 0 6 7 0 7 3 11 6 7 4 -3 18 0 33 7 23 11
				42 13 56 6 13 -6 33 -5 75 5 70 16 96 9 143 -42 23 -25 51 -53 62 -62 11 -9
				69 -65 129 -124 59 -59 110 -106 113 -103 3 2 26 -6 51 -19 26 -12 65 -28 87
				-35 22 -6 47 -14 55 -17 8 -3 20 -7 26 -8 24 -6 82 -37 103 -56 31 -29 48 -66
				72 -165 23 -95 46 -134 94 -164 50 -31 82 -32 109 -4 28 31 31 76 11 179 -21
				109 -54 177 -109 224 -10 9 -28 27 -40 40 -24 27 -42 44 -70 64 -10 8 -19 24
				-20 38 -2 25 20 80 37 90 9 7 51 4 116 -6 20 -3 66 -10 104 -15 37 -6 86 -15
				110 -20 23 -6 47 -12 52 -13 6 -2 25 -11 43 -22 26 -16 36 -32 49 -75 8 -30
				19 -59 23 -65 7 -11 28 -72 55 -168 9 -32 29 -73 46 -91 16 -19 36 -51 45 -72
				18 -43 41 -64 62 -56 12 4 13 22 8 94 -4 50 -11 113 -17 141 -6 29 -12 104
				-14 167 -2 63 -8 127 -13 141 -6 14 -30 41 -54 60 -24 19 -44 37 -46 41 -2 5
				-8 8 -13 8 -5 0 -28 12 -51 26 -22 14 -57 32 -77 39 -20 8 -30 14 -23 14 7 1
				34 16 60 34 66 46 104 60 149 53 21 -3 42 -5 46 -6 17 0 103 -97 147 -165 40
				-62 112 -145 125 -145 3 0 28 -15 57 -32 29 -18 58 -33 64 -34 30 -5 69 -31
				72 -49 7 -46 12 -51 28 -31 47 65 -21 227 -186 440 -52 67 -172 174 -225 201
				-32 16 -64 30 -70 31 -5 1 -28 6 -50 11 -22 6 -48 9 -58 7 -12 -2 -29 23 -62
				91 -44 88 -73 122 -114 130 -9 2 -16 4 -16 5 0 9 -93 12 -320 13 -284 0 -340
				-2 -366 -14 -12 -6 -24 2 -44 27 -23 29 -33 34 -62 32 -18 -1 -35 -3 -36 -4z"/>
				</g>
				</svg>
			`,
			leftArm: `
				<svg version="1.0" xmlns="http://www.w3.org/2000/svg"
				 width="326.000000pt" height="128.000000pt" viewBox="0 0 326.000000 128.000000"
				 preserveAspectRatio="xMidYMid meet">
				<g transform="translate(0.000000,128.000000) scale(0.100000,-0.100000)"
				fill="#000000" stroke="none">
				<path d="M1030 1240 c-14 -4 -59 -8 -100 -9 -116 -4 -137 -6 -212 -27 -13 -4
				-52 -8 -88 -9 -185 -10 -285 -40 -391 -121 -127 -96 -208 -271 -196 -418 12
				-137 62 -305 112 -375 22 -31 122 -128 150 -146 44 -29 103 -54 138 -61 17 -2
				34 -7 39 -10 5 -4 33 -8 61 -10 29 -1 68 -6 87 -9 19 -4 53 -8 75 -11 22 -2
				60 -6 85 -8 117 -13 367 -5 643 20 72 6 199 6 242 -2 73 -12 199 -3 236 17 10
				5 19 8 19 6 0 -3 24 1 53 8 51 11 172 12 232 0 36 -7 130 -18 165 -19 21 -1
				25 4 28 30 3 26 -5 40 -43 79 -26 26 -45 48 -43 51 6 6 60 5 102 -1 24 -4 42
				-2 46 5 7 11 22 13 70 8 30 -2 109 9 180 27 11 3 28 7 38 9 9 2 29 9 45 15 15
				6 27 9 27 6 0 -2 20 4 45 15 25 11 45 17 45 14 0 -2 10 1 23 8 22 12 28 14 57
				21 8 1 26 9 40 17 14 8 28 14 32 15 20 1 137 129 161 176 26 52 27 61 27 197
				0 169 -11 202 -100 294 -42 45 -72 65 -129 89 -41 17 -86 33 -100 36 -38 7
				-231 6 -266 -1 -16 -4 -64 -9 -105 -11 -41 -3 -92 -7 -113 -10 -109 -14 -102
				-13 -169 -31 -22 -6 -116 -6 -168 -1 -16 2 -24 8 -21 17 2 8 6 31 9 51 6 51
				-12 62 -68 43 -46 -16 -138 -20 -180 -7 -14 3 -97 8 -185 9 -88 1 -221 4 -295
				8 -254 12 -315 13 -340 6z"/>
				</g>
				</svg>
			`,
			leftFoot: `
				<svg version="1.0" xmlns="http://www.w3.org/2000/svg"
				 width="492.000000pt" height="185.000000pt" viewBox="0 0 492.000000 185.000000"
				 preserveAspectRatio="xMidYMid meet">
				<g transform="translate(0.000000,185.000000) scale(0.100000,-0.100000)"
				fill="#000000" stroke="none">
				<path d="M4155 1819 c-4 -5 -13 -9 -21 -9 -24 0 -93 -75 -116 -126 -25 -58
				-35 -159 -19 -206 6 -19 27 -53 46 -74 19 -21 35 -43 35 -47 0 -5 5 -5 10 -2
				6 3 10 2 10 -4 0 -6 11 -16 24 -23 30 -16 25 -24 -54 -88 -30 -24 -63 -52 -73
				-62 -19 -19 -102 -130 -127 -169 -8 -13 -41 -50 -74 -81 -62 -60 -64 -61 -196
				-73 -30 -2 -64 -6 -75 -8 -11 -3 -42 -8 -70 -12 -64 -11 -56 -9 -82 -23 -13
				-7 -23 -11 -23 -8 0 3 -25 -6 -55 -20 -46 -21 -63 -24 -111 -18 -65 7 -73 9
				-94 17 -8 3 -31 8 -50 11 -69 10 -96 18 -160 48 -35 16 -72 32 -82 33 -10 2
				-24 7 -31 12 -6 4 -19 9 -27 10 -22 4 -90 13 -130 18 -36 4 -75 12 -75 15 0 1
				-11 3 -25 5 -14 2 -35 6 -47 9 -13 3 -33 9 -45 12 -31 7 -40 10 -58 17 -65 25
				-210 56 -288 62 -26 2 -47 4 -47 5 0 1 -25 3 -55 5 -30 1 -107 6 -170 10 -114
				8 -191 9 -445 4 -122 -2 -280 7 -296 16 -4 3 -24 7 -45 11 -22 3 -64 15 -94
				25 -30 11 -61 21 -67 21 -7 1 -13 6 -13 11 0 6 -3 8 -6 4 -6 -6 -47 25 -73 57
				-45 53 -63 70 -78 72 -8 2 -24 12 -34 22 -10 11 -48 35 -85 53 -56 28 -79 33
				-148 35 -166 5 -294 -71 -366 -220 -92 -187 -8 -427 181 -519 64 -32 90 -38
				174 -42 52 -3 100 -10 100 -15 0 -2 13 -5 51 -14 28 -6 120 -43 165 -67 20
				-10 41 -19 47 -19 6 0 77 -39 159 -86 123 -71 246 -135 256 -132 1 0 22 -5 47
				-12 25 -7 55 -14 68 -16 12 -2 34 -6 50 -9 30 -6 269 -6 317 -1 17 2 61 7 99
				10 38 4 72 8 75 10 19 11 155 19 366 21 132 1 251 5 265 9 51 13 88 19 205 31
				33 3 74 10 90 15 28 9 51 14 120 27 47 8 60 11 60 13 0 7 77 14 160 14 88 1
				105 -2 137 -23 27 -16 41 -34 47 -59 10 -36 37 -145 48 -190 7 -29 78 -90 118
				-101 33 -9 186 -7 224 2 12 4 28 10 35 15 6 5 23 12 39 16 15 3 27 10 27 15 0
				5 16 18 35 30 19 11 51 46 71 78 62 99 78 119 129 162 28 23 59 50 70 60 23
				21 85 54 85 46 0 -3 10 1 23 9 12 8 36 17 52 20 17 4 41 9 55 11 28 6 71 11
				158 20 78 7 167 21 167 25 0 2 10 4 50 13 24 6 91 44 127 72 69 56 98 200 60
				306 -10 30 -32 73 -48 95 -29 40 -35 47 -77 95 -108 122 -147 201 -147 298 0
				54 -3 61 -33 87 -29 26 -86 70 -107 84 -4 3 -23 39 -42 80 -32 69 -96 150
				-120 150 -5 0 -7 4 -4 8 2 4 -3 9 -12 10 -83 9 -113 9 -117 1z"/>
				</g>
				</svg>
			`,
			leftHand: `
				<svg version="1.0" xmlns="http://www.w3.org/2000/svg"
				 width="505.000000pt" height="191.000000pt" viewBox="0 0 505.000000 191.000000"
				 preserveAspectRatio="xMidYMid meet">
				<g transform="translate(0.000000,191.000000) scale(0.100000,-0.100000)"
				fill="#000000" stroke="none">
				<path d="M4016 1834 c-9 -8 -16 -25 -16 -37 0 -54 -106 -151 -285 -261 -44
				-27 -124 -85 -178 -128 -54 -43 -104 -78 -110 -79 -55 -5 -257 61 -386 126
				-65 32 -101 45 -117 41 -13 -4 -49 -38 -80 -77 -31 -39 -65 -74 -77 -78 -11
				-4 -53 -6 -93 -3 -61 4 -80 1 -119 -18 -25 -12 -57 -37 -71 -56 -25 -32 -30
				-34 -85 -34 -33 0 -170 -11 -307 -24 -136 -14 -288 -27 -338 -31 -51 -3 -128
				-12 -173 -20 -196 -34 -240 -37 -450 -25 -233 12 -424 38 -621 82 -149 33
				-233 34 -322 3 -64 -23 -132 -85 -162 -150 -24 -49 -26 -65 -26 -190 0 -95 4
				-146 14 -170 22 -52 94 -124 158 -156 48 -24 69 -29 130 -29 40 1 91 7 113 15
				30 11 92 15 241 15 164 0 220 4 300 21 55 11 153 24 219 30 347 28 705 114
				1078 260 207 81 312 113 426 130 l82 13 42 -46 c28 -30 57 -50 85 -59 45 -13
				42 -15 185 83 l28 19 60 -55 c93 -86 259 -156 370 -156 24 0 86 9 137 19 l92
				19 103 -47 c56 -27 122 -58 147 -69 25 -12 69 -35 99 -52 30 -16 66 -30 82
				-30 34 0 43 -13 29 -40 -9 -18 -20 -19 -98 -18 -48 1 -102 -1 -120 -6 -77 -19
				-52 -85 40 -106 29 -7 73 -25 98 -41 66 -41 118 -61 143 -53 43 12 95 56 171
				144 53 62 106 109 167 151 120 82 131 106 84 187 -13 23 -21 42 -18 42 19 0
				72 -44 81 -68 21 -53 21 -68 7 -122 -19 -73 -19 -119 1 -127 23 -9 87 24 128
				66 42 43 87 137 93 195 5 38 1 44 -49 96 -29 31 -91 97 -138 147 -90 96 -121
				116 -259 168 -77 30 -81 32 -53 38 42 8 105 -12 199 -64 161 -88 185 -99 229
				-99 39 0 74 18 74 39 0 23 -66 93 -131 141 -41 29 -105 77 -144 106 -162 120
				-205 132 -368 104 -62 -10 -156 -34 -208 -53 -52 -19 -111 -37 -131 -41 l-37
				-7 49 51 c38 39 54 66 70 116 31 103 21 203 -26 255 -21 23 -37 24 -58 3z
				m-1635 -699 c3 -30 -511 -183 -697 -209 -23 -3 -103 5 -189 19 -82 14 -166 25
				-186 25 -39 0 -58 15 -42 31 6 6 91 16 189 24 98 8 220 22 269 31 158 28 609
				93 633 91 12 -1 23 -6 23 -12z"/>
				</g>
				</svg>
			`,
			leftLeg: `
				<svg version="1.0" xmlns="http://www.w3.org/2000/svg"
				 width="334.000000pt" height="157.000000pt" viewBox="0 0 334.000000 157.000000"
				 preserveAspectRatio="xMidYMid meet">
				<g transform="translate(0.000000,157.000000) scale(0.100000,-0.100000)"
				fill="#000000" stroke="none">
				<path d="M2304 1484 c-19 -7 -43 -19 -52 -27 -17 -15 -53 -29 -82 -32 -65 -7
				-108 -22 -151 -52 -57 -39 -70 -41 -280 -49 -188 -7 -214 -9 -260 -18 -29 -6
				-42 -3 -71 16 -19 13 -33 28 -31 34 2 6 -2 11 -9 12 -7 0 -24 4 -38 8 -35 10
				-174 16 -392 18 -158 2 -197 -1 -245 -16 -33 -10 -75 -17 -98 -14 -23 2 -66
				-4 -100 -15 -33 -10 -72 -19 -86 -19 -38 0 -141 -55 -197 -105 -30 -27 -60
				-67 -76 -102 -15 -32 -31 -66 -37 -75 -22 -43 -9 -190 31 -343 10 -38 23 -91
				29 -116 13 -59 101 -203 154 -253 40 -37 119 -81 169 -92 13 -3 55 -7 93 -9
				84 -3 153 18 227 68 17 11 36 16 48 12 14 -4 20 -2 20 8 0 19 53 25 185 22
				102 -3 121 -6 165 -23 14 -5 27 -10 30 -10 12 -1 66 -23 80 -32 8 -5 29 -17
				47 -26 18 -9 37 -22 44 -30 8 -10 16 -11 31 -3 17 9 19 18 14 64 -5 46 -4 53
				13 58 10 2 31 -1 47 -8 35 -14 72 -12 111 7 33 17 34 50 1 85 l-21 22 24 -5
				c56 -12 117 -19 254 -29 39 -3 84 -8 100 -11 17 -3 122 -7 235 -8 113 -2 230
				-6 260 -10 30 -4 73 -10 95 -13 42 -5 76 -9 159 -18 27 -2 56 -7 65 -10 9 -2
				34 -7 55 -11 22 -3 49 -10 62 -14 22 -9 64 -3 74 10 17 22 103 50 164 53 l69
				3 2 79 c2 56 9 94 24 127 18 40 21 58 15 120 -4 46 -1 91 6 118 11 40 10 46
				-5 55 -10 5 -27 19 -39 30 -37 36 -141 112 -193 143 -74 44 -110 47 -190 16
				-38 -14 -81 -28 -98 -32 -66 -14 -343 -6 -455 13 -14 2 -43 6 -65 10 -22 3
				-47 7 -55 10 -8 2 -26 6 -40 9 -14 3 -36 8 -50 11 -21 5 -84 13 -124 15 -13 0
				63 58 87 66 12 4 24 9 27 13 16 20 102 51 138 49 38 -1 92 22 92 40 0 18 57
				69 101 90 64 33 109 74 109 100 0 18 -6 22 -32 23 -18 0 -59 2 -91 3 -31 1
				-73 -3 -93 -10z"/>
				</g>
				</svg>
			`,
			rightFoot: `
				<svg version="1.0" xmlns="http://www.w3.org/2000/svg"
				 width="467.000000pt" height="273.000000pt" viewBox="0 0 467.000000 273.000000"
				 preserveAspectRatio="xMidYMid meet">
				<g transform="translate(0.000000,273.000000) scale(0.100000,-0.100000)"
				fill="#000000" stroke="none">
				<path d="M3866 2695 c-14 -8 -26 -12 -26 -9 0 7 -73 -48 -87 -66 -7 -8 -18
				-33 -26 -55 -17 -50 -2 -127 36 -182 14 -21 29 -50 32 -66 4 -15 11 -29 15
				-32 5 -3 11 -33 15 -68 12 -114 10 -216 -10 -422 -2 -22 -7 -83 -10 -135 -4
				-52 -11 -115 -16 -140 -6 -25 -10 -53 -10 -62 0 -10 -5 -18 -10 -18 -6 0 -8
				-4 -4 -10 17 -27 -98 -179 -153 -202 -31 -13 -27 -12 -69 -22 -18 -4 -40 -17
				-48 -29 -8 -12 -15 -17 -15 -12 0 6 -5 2 -11 -8 -6 -9 -14 -15 -20 -12 -5 4
				-9 2 -9 -4 0 -18 -211 -114 -279 -126 -14 -2 -48 -9 -76 -14 -74 -15 -315 -5
				-395 15 -14 4 -32 8 -40 9 -8 2 -31 5 -50 9 -71 11 -93 17 -170 45 -68 25 -90
				29 -162 26 -46 -2 -99 -6 -118 -9 -19 -3 -55 -8 -80 -11 -25 -3 -58 -8 -75
				-10 l-30 -6 30 28 c46 43 106 69 173 72 20 1 14 39 -9 51 -11 7 -23 9 -25 7
				-3 -3 -29 4 -57 14 -86 33 -232 59 -407 75 -36 3 -80 7 -97 8 -18 2 -35 1 -38
				-2 -3 -3 -13 -7 -22 -8 -23 -4 -58 -22 -111 -57 -98 -65 -162 -79 -222 -46
				-30 16 -93 60 -100 70 -13 17 -120 45 -170 44 -62 -2 -79 10 -103 65 -30 71
				-84 105 -142 88 -54 -15 -73 -16 -109 -8 -19 4 -37 5 -40 2 -3 -3 -25 -6 -48
				-8 -92 -5 -190 -53 -279 -135 -23 -21 -46 -39 -49 -39 -4 0 -10 -18 -14 -40
				-3 -22 -10 -40 -15 -40 -8 0 -60 -97 -62 -117 -1 -5 -6 -19 -11 -33 -22 -56
				-21 -147 2 -221 22 -73 78 -167 122 -204 36 -30 130 -85 147 -85 8 0 36 -14
				63 -31 52 -34 76 -38 123 -19 17 6 32 11 35 12 3 0 10 3 15 7 6 5 21 6 35 4
				14 -2 57 -5 95 -7 52 -2 100 -14 185 -46 63 -23 124 -43 135 -44 11 -2 30 -6
				42 -10 12 -4 32 -9 44 -11 79 -15 127 -41 185 -99 33 -34 70 -69 83 -79 23
				-18 133 -87 161 -101 24 -11 57 -31 71 -43 16 -12 73 -31 115 -39 15 -3 31 -7
				35 -10 14 -8 178 -16 213 -10 75 14 35 61 -91 106 -35 12 -68 29 -74 37 -10
				11 -8 12 12 5 29 -9 175 -8 207 2 27 9 28 35 4 67 -39 50 -35 54 42 54 111 1
				164 15 271 70 36 19 65 31 65 27 0 -4 4 -2 8 4 14 19 143 67 220 80 12 2 34 6
				50 9 15 3 63 8 107 11 44 3 116 14 160 26 44 11 87 21 95 23 8 2 15 4 15 5 0
				6 57 11 156 15 107 3 196 12 209 20 6 3 160 21 257 29 45 4 171 -35 185 -57 4
				-7 8 -8 8 -3 0 5 6 3 14 -3 7 -6 28 -13 47 -16 19 -3 44 -7 56 -9 15 -3 37 11
				76 50 95 91 147 100 281 49 160 -61 205 -40 286 130 42 87 51 173 23 222 -10
				18 -49 64 -86 102 -42 43 -66 75 -61 82 4 8 3 9 -5 5 -19 -12 -63 98 -69 169
				-2 39 4 107 16 181 12 65 23 171 26 234 5 116 16 193 35 242 14 37 7 74 -28
				143 -37 74 -69 109 -128 137 -24 11 -47 27 -50 34 -3 7 3 33 12 57 16 44 16
				45 -8 94 -34 67 -159 180 -247 224 -52 27 -137 33 -174 14z"/>
				</g>
				</svg>
			`,
			rightLeg: `
				<svg version="1.0" xmlns="http://www.w3.org/2000/svg"
				 width="388.000000pt" height="132.000000pt" viewBox="0 0 388.000000 132.000000"
				 preserveAspectRatio="xMidYMid meet">
				<g transform="translate(0.000000,132.000000) scale(0.100000,-0.100000)"
				fill="#000000" stroke="none">
				<path d="M514 1291 c-2 -2 -11 -4 -21 -5 -10 -1 -38 -8 -63 -16 -25 -7 -51
				-15 -59 -16 -8 -1 -17 -7 -20 -12 -3 -5 -21 -17 -39 -26 -43 -22 -161 -143
				-216 -221 -79 -112 -96 -183 -96 -398 0 -162 12 -217 69 -304 45 -70 184 -213
				226 -233 17 -8 38 -21 48 -29 28 -24 59 -26 362 -23 479 4 479 4 560 42 70 33
				140 42 208 26 23 -6 27 -3 27 16 0 22 4 23 78 24 42 1 104 4 137 8 53 7 223
				18 250 17 61 -3 144 -15 153 -21 1 -2 5 -3 10 -4 4 0 30 -16 58 -34 28 -17 56
				-32 62 -32 27 0 60 24 82 61 14 21 32 40 40 41 8 1 76 2 150 3 74 1 151 6 170
				10 19 5 104 8 189 9 l154 0 42 -49 c24 -27 50 -50 60 -51 9 -1 37 6 61 17 25
				10 48 18 52 18 21 -3 31 3 37 22 9 29 75 100 86 93 5 -3 9 -1 9 4 0 5 13 15
				29 22 16 6 32 18 35 26 3 7 24 17 46 20 23 4 47 12 54 19 7 7 32 23 56 35 51
				26 53 28 140 110 78 74 107 128 120 220 11 76 0 133 -37 202 -33 60 -160 178
				-198 184 -5 1 -26 5 -45 9 -40 7 -32 7 -255 6 -93 0 -197 0 -230 0 -62 0 -95
				-3 -205 -17 -36 -4 -110 -8 -165 -7 -106 0 -172 7 -255 28 -11 3 -29 7 -40 9
				-11 3 -24 7 -28 10 -5 3 -19 7 -33 10 -23 5 -42 9 -89 21 -11 3 -29 7 -40 10
				-48 12 -68 16 -125 22 -107 11 -237 7 -345 -12 -14 -3 -41 -7 -60 -11 -19 -3
				-46 -7 -60 -10 -129 -23 -244 -23 -340 1 -26 6 -54 12 -92 19 -13 2 -36 9 -53
				16 -34 13 -36 14 -135 35 -62 13 -71 15 -92 21 -13 3 -35 7 -50 8 -14 1 -34 8
				-43 16 -9 7 -28 15 -42 16 -14 2 -33 6 -42 10 -9 4 -23 9 -31 11 -21 5 -211 9
				-216 4z"/>
				</g>
				</svg>
			`,
			stomach:`
				<svg version="1.0" xmlns="http://www.w3.org/2000/svg"
				 width="391.000000pt" height="188.000000pt" viewBox="0 0 391.000000 188.000000"
				 preserveAspectRatio="xMidYMid meet">
				<g transform="translate(0.000000,188.000000) scale(0.100000,-0.100000)"
				fill="#000000" stroke="none">
				<path d="M1497 1810 c-43 -38 -85 -70 -94 -70 -24 0 -93 22 -93 30 0 4 -20 13
				-44 20 -42 12 -98 10 -156 -5 -21 -5 -34 2 -72 39 -52 52 -87 59 -112 24 -9
				-12 -16 -36 -16 -53 0 -34 -14 -60 -27 -52 -8 5 -106 -1 -307 -19 -65 -5 -178
				-40 -249 -76 -83 -41 -208 -172 -252 -263 -74 -151 -78 -182 -72 -445 6 -212
				9 -242 31 -308 44 -135 132 -235 259 -295 37 -17 69 -39 72 -48 9 -28 88 -103
				160 -151 39 -26 80 -56 90 -68 36 -40 70 -51 119 -40 25 5 72 7 105 4 65 -7
				128 5 194 38 27 14 50 17 85 13 26 -3 71 -7 101 -10 l54 -5 56 57 56 57 75 -3
				c106 -3 130 -13 190 -81 29 -34 60 -60 70 -60 24 0 35 36 27 86 -6 33 -5 34
				21 28 15 -4 35 -15 45 -26 41 -42 51 19 12 72 -32 43 -31 48 3 56 15 4 47 16
				72 26 25 11 60 21 77 24 41 5 119 -21 156 -52 16 -14 63 -41 105 -62 96 -46
				144 -48 221 -9 35 17 71 27 100 27 26 1 64 4 87 9 34 6 43 5 52 -10 11 -17 15
				-17 46 -4 20 9 65 15 103 15 63 -1 84 -6 169 -41 18 -7 39 -9 50 -5 10 5 60 9
				109 10 50 2 119 8 155 15 36 7 87 17 114 22 135 26 274 135 336 264 19 39 44
				86 56 105 12 19 33 69 45 110 20 64 23 97 23 220 0 129 -3 155 -27 235 -15 50
				-32 115 -38 145 -10 54 -53 146 -94 204 -11 15 -51 52 -88 82 -53 41 -87 59
				-155 80 -48 14 -96 31 -107 37 -13 7 -20 6 -23 -2 -2 -6 -22 -11 -45 -11 -44
				0 -171 -32 -190 -49 -24 -19 -114 -38 -172 -35 -95 3 -561 42 -655 54 -47 6
				-119 15 -160 21 -109 15 -182 14 -299 -3 -121 -19 -139 -16 -113 17 24 30 46
				99 39 119 -9 22 -42 20 -109 -8 l-57 -23 15 35 c18 45 12 62 -23 62 -21 0 -49
				-19 -106 -70z"/>
				</g>
				</svg>
			`,
			tors: `
				<svg version="1.0" xmlns="http://www.w3.org/2000/svg"
				 width="293.000000pt" height="316.000000pt" viewBox="0 0 293.000000 316.000000"
				 preserveAspectRatio="xMidYMid meet">
				<g transform="translate(0.000000,316.000000) scale(0.100000,-0.100000)"
				fill="#000000" stroke="none">
				<path d="M730 3152 c-112 -8 -226 -60 -309 -141 -55 -54 -135 -173 -158 -236
				-6 -16 -15 -39 -19 -50 -4 -11 -8 -22 -9 -25 -1 -3 -11 -25 -22 -50 -69 -146
				-84 -186 -97 -247 -8 -37 -13 -70 -11 -74 3 -3 0 -21 -6 -40 -6 -19 -12 -52
				-15 -74 -3 -21 -8 -43 -11 -48 -3 -5 -7 -97 -9 -205 -3 -195 3 -255 35 -336 6
				-16 14 -52 17 -80 3 -28 8 -54 10 -58 2 -4 9 -41 14 -82 5 -41 14 -83 19 -93
				5 -10 15 -31 22 -48 8 -16 29 -45 48 -64 99 -104 141 -187 146 -295 5 -103 29
				-193 71 -266 20 -36 52 -93 69 -127 86 -163 167 -249 330 -350 53 -33 128 -62
				195 -76 101 -21 273 -19 361 3 66 17 207 77 259 110 14 9 43 22 65 29 22 8 68
				30 103 50 35 20 89 51 120 68 57 33 75 41 167 83 28 12 66 30 85 40 62 33 221
				110 226 110 5 0 93 58 203 133 29 21 65 52 80 70 14 18 35 43 47 55 20 22 33
				45 54 97 6 14 14 35 19 48 22 52 50 146 59 197 18 99 0 327 -29 366 -5 6 -11
				32 -14 59 -10 84 -58 262 -87 322 -6 11 -8 26 -4 31 3 6 2 13 -3 16 -5 3 -12
				23 -16 43 -10 54 -78 186 -137 265 -49 66 -184 196 -243 233 -52 33 -195 105
				-195 98 0 -3 -8 1 -17 10 -10 8 -21 16 -25 16 -5 1 -38 15 -75 32 -121 56
				-202 90 -213 91 -3 0 -10 3 -15 8 -15 12 -106 44 -215 75 -52 15 -133 47 -180
				71 -47 24 -92 44 -101 44 -9 0 -19 3 -23 7 -3 4 -12 8 -19 9 -14 2 -112 44
				-227 97 -36 16 -85 38 -110 49 -46 20 -149 35 -210 30z"/>
				</g>
				</svg>
			`,
			head: `
				<svg version="1.0" xmlns="http://www.w3.org/2000/svg"
				 width="295.000000pt" height="234.000000pt" viewBox="0 0 295.000000 234.000000"
				 preserveAspectRatio="xMidYMid meet">
				<g transform="translate(0.000000,234.000000) scale(0.100000,-0.100000)"
				fill="#000000" stroke="none">
				<path d="M1538 2211 c-57 -18 -138 -61 -170 -88 -13 -12 -24 -12 -55 -4 -21 6
				-75 11 -121 11 -62 0 -102 6 -158 25 -107 36 -123 34 -184 -25 -29 -28 -64
				-53 -78 -57 -23 -6 -155 11 -189 24 -7 3 -13 1 -13 -4 0 -8 99 -45 153 -58 42
				-9 109 27 141 75 14 22 36 42 49 45 14 4 60 -6 113 -25 75 -26 101 -31 169
				-29 149 4 145 8 73 -63 l-63 -63 -24 23 c-36 33 -127 57 -165 44 -17 -6 -51
				-10 -76 -10 -51 1 -100 -19 -151 -61 -52 -44 -31 -44 35 0 44 30 68 39 99 39
				32 0 38 -3 29 -12 -31 -31 6 -96 47 -83 29 9 36 41 16 72 -22 33 -6 45 53 40
				49 -5 126 -52 119 -72 -3 -7 -22 -35 -41 -63 l-36 -49 -120 5 -120 5 -50 -56
				c-30 -32 -62 -57 -78 -60 -22 -4 -87 9 -189 39 -13 3 -23 2 -23 -3 0 -15 137
				-63 180 -63 61 0 105 23 135 70 28 44 57 60 111 60 43 0 124 -20 124 -30 0
				-17 -111 -153 -194 -236 -138 -138 -237 -185 -360 -170 -41 6 -66 15 -89 35
				-62 54 -94 65 -192 63 -109 -2 -180 -32 -220 -90 -24 -36 -25 -42 -25 -213 l0
				-176 29 -39 c15 -21 48 -55 71 -74 66 -54 93 -83 112 -118 23 -43 39 -47 125
				-33 41 7 77 10 81 7 17 -18 -23 -142 -89 -275 -67 -133 -73 -148 -77 -220 -3
				-66 -1 -82 20 -121 49 -90 119 -110 230 -65 34 14 67 25 74 25 6 0 24 -16 38
				-35 15 -19 40 -42 56 -50 58 -30 155 -11 180 34 16 30 12 103 -8 138 -46 84
				-72 133 -72 136 0 3 19 7 42 11 23 4 48 12 55 18 16 13 17 62 2 90 -10 18 -17
				20 -65 14 -66 -8 -68 2 -15 55 35 35 44 39 88 39 36 0 60 -7 84 -23 60 -40 70
				-84 45 -186 -22 -84 -22 -113 -2 -156 24 -53 41 -65 92 -65 59 0 72 7 94 49
				34 67 43 68 98 17 57 -53 83 -57 111 -17 25 35 78 61 123 61 18 0 60 -12 93
				-25 33 -14 67 -25 76 -25 17 0 29 37 29 86 0 13 9 33 21 45 25 25 41 21 134
				-37 121 -74 143 -72 209 21 25 35 99 111 163 168 137 122 189 176 263 271 l54
				69 33 -37 c39 -43 41 -56 9 -56 -45 0 -93 -92 -66 -125 28 -33 110 -3 129 47
				6 17 15 11 71 -46 36 -36 68 -66 73 -66 4 0 7 9 7 20 0 24 -68 101 -115 130
				-18 11 -36 32 -39 46 -4 14 -25 45 -46 68 -39 42 -40 44 -27 75 l14 32 101
				-52 c56 -29 132 -77 169 -106 70 -56 98 -55 44 1 -38 40 -168 119 -247 151
				-71 29 -81 50 -27 60 71 13 132 54 160 108 23 46 9 42 -45 -12 -35 -35 -64
				-54 -98 -64 l-49 -14 -6 161 c-11 251 -56 439 -134 548 -24 35 -63 89 -85 120
				-22 31 -40 64 -40 72 0 9 -15 17 -41 21 -39 7 -43 5 -88 -39 -26 -25 -50 -46
				-54 -46 -3 0 -14 15 -23 33 -28 54 -50 56 -112 10 -17 -13 -37 -21 -42 -18 -5
				3 -16 27 -24 53 l-13 47 -71 -1 c-70 0 -70 0 -61 24 5 13 9 45 9 72 0 55 -18
				80 -55 80 l-24 0 24 36 c28 41 28 43 15 64 -15 24 -180 25 -252 1z"/>
				</g>
				</svg>
			`
		}
	});
	run();
}