/* Net // Works live wallpaper kit.
 * Copyright (c) 2026 Net Works Lab LLC. All rights reserved. See LICENSE.txt.
 *
 * Everything the wallpapers in this collection have in common, so that a new one
 * is its drawing and nothing else:
 *
 *   NWLive.stage(opts)   settings (query string, then Lively's settings panel),
 *                        the page palette, layout in device pixels, the corner
 *                        wordmark, one clock, one animation loop
 *   S.canvas / S.place   canvases that land on the device-pixel grid one-to-one
 *   S.program(...)       a WebGL2 fragment-shader program over a canvas, which
 *                        survives a lost context
 *   S.drawRings(...)     the limb, the two orbit rings and their nodes
 *   NWLive.raster(...)   a land/sea bitmap, drawn once with canvas 2D
 *   NWLive.GLSL          the shader pieces every sphere here starts from
 *
 * The master copy is shared/nwlive.js; scripts/build_packages.py copies it into
 * each wallpaper folder, because a Lively wallpaper has to be one self-contained
 * folder. Edit the master, not the copies.
 */
(function (global) {
  'use strict';
  var D = Math.PI / 180;

  /* ---- palette --------------------------------------------------------- */
  /* The two page colours of the Net Works site, plus two quiet tones for
     hairlines and for marks that should sit behind the subject. */
  var THEMES = {
    light: { name: 'light', bg: '#fafafa', ink: [20, 19, 14],    sea: [250, 250, 250], dim: 'rgba(20,19,14,0.34)',    grey: '#999999', rule: '#dededa' },
    dark:  { name: 'dark',  bg: '#0a0a0a', ink: [242, 241, 236], sea: [10, 10, 10],    dim: 'rgba(242,241,236,0.30)', grey: '#666666', rule: '#242424' }
  };

  /* The site globe's two orbit rings. */
  var RINGS = [
    { f: 1.28, incl: 0.30,  base: 0.0, spd: 0.34,  nodes: 6, noff: 0.0 },
    { f: 1.44, incl: -0.24, base: 1.1, spd: -0.27, nodes: 5, noff: 0.4 }
  ];

  /* ---- shader pieces --------------------------------------------------- */
  var GLSL = {
    vert: '#version 300 es\n' +
      'void main(){gl_Position=vec4(float((gl_VertexID<<1)&2)*2.0-1.0,float(gl_VertexID&2)*2.0-1.0,0.0,1.0);}',
    /* u_c: body centre in this canvas, px, y up.  u_tilt: cos, sin of the tilt. */
    head: [
      '#version 300 es',
      'precision highp float;',
      'uniform vec2 u_c;',
      'uniform float u_R;',
      'uniform float u_phi;',
      'uniform vec2 u_tilt;',
      'out vec4 o;',
      'const float PI=3.141592653589793;',
      ''
    ].join('\n'),
    /* A point P on the unit disc -> (longitude, latitude, depth) on the turning body, radians. */
    lonlat: [
      'vec3 nwLonLat(vec2 P){',
      '  float Z=sqrt(max(0.0,1.0-dot(P,P)));',
      '  float wy=P.y*u_tilt.x+Z*u_tilt.y, wz=-P.y*u_tilt.y+Z*u_tilt.x;',
      '  return vec3(atan(P.x,wz)-u_phi,asin(clamp(wy,-1.0,1.0)),Z);',
      '}',
      ''
    ].join('\n'),
    /* An equirectangular 0/1 bitmap, read with the same truncation a JavaScript lookup would use. */
    mask: [
      'float nwMask(sampler2D m,vec2 ll){',
      '  ivec2 s=textureSize(m,0);',
      '  int mx=min(int(fract(ll.x/(2.0*PI)+0.5)*float(s.x)),s.x-1);',
      '  int my=clamp(int((0.5-ll.y/PI)*float(s.y)),0,s.y-1);',
      '  return texelFetch(m,ivec2(mx,my),0).r;',
      '}',
      ''
    ].join('\n'),
    /* The 15-degree graticule as stroke coverage at a pixel: x for the parallels
       (75S to 75N), y for the meridians (which stop at 82 degrees with a round
       cap). Distance to the nearest line is the angular gap over the angle's
       screen gradient, so the stroke keeps one width, lw px, all over the sphere. */
    graticule: [
      'vec2 nwGraticule(vec2 p,float lw){',
      '  vec2 g=p; float d2=dot(g,g);',
      '  if(d2>0.9995)g*=sqrt(0.9995/d2);',   /* keeps the gradients finite on the limb */
      '  float Z=sqrt(1.0-dot(g,g));',
      '  float ct=u_tilt.x, st=u_tilt.y;',
      '  float wy=g.y*ct+Z*st, wz=-g.y*st+Z*ct;',
      '  vec2 dZ=-g/Z;',
      '  vec2 dwy=vec2(st*dZ.x,ct+st*dZ.y);',
      '  vec2 dwz=vec2(ct*dZ.x,-st+ct*dZ.y);',
      '  float h2=max(1e-6,1.0-wy*wy);',
      '  float latDeg=degrees(asin(clamp(wy,-1.0,1.0)));',
      '  float lonDeg=degrees(atan(g.x,wz)-u_phi);',
      '  float gLat=max(1e-6,length(degrees(dwy/sqrt(h2))/u_R));',
      '  float gLon=max(1e-6,length(degrees(vec2(wz-g.x*dwz.x,-g.x*dwz.y)/h2)/u_R));',
      '  float nearPar=clamp(floor(latDeg/15.0+0.5)*15.0,-75.0,75.0);',
      '  float dPar=abs(latDeg-nearPar)/gLat;',
      '  float dMer=abs(lonDeg-15.0*floor(lonDeg/15.0+0.5))/gLon;',
      '  dMer=length(vec2(dMer,max(0.0,abs(latDeg)-82.0)/gLat));',
      '  float hw=0.5*lw+0.5;',
      '  return vec2(clamp(hw-dPar,0.0,1.0),clamp(hw-dMer,0.0,1.0));',
      '}',
      ''
    ].join('\n')
  };

  /* ---- land bitmaps ---------------------------------------------------- */
  /* Draws with canvas 2D into a w x h equirectangular canvas (white on black)
     and returns it as bytes, 255 where the drawing is white. */
  function raster(w, h, paint) {
    var m = document.createElement('canvas'); m.width = w; m.height = h;
    var mc = m.getContext('2d', { willReadFrequently: true });
    mc.fillStyle = '#000'; mc.fillRect(0, 0, w, h); mc.fillStyle = '#fff';
    paint(mc, function (lon) { return (lon + 180) / 360 * w; }, function (lat) { return (90 - lat) / 180 * h; });
    var d = mc.getImageData(0, 0, w, h).data, bits = new Uint8Array(w * h);
    for (var i = 0, n = w * h; i < n; i++) bits[i] = d[i * 4] > 127 ? 255 : 0;
    return {
      w: w, h: h, bits: bits,
      at: function (lon, lat) {   /* degrees */
        var x = ((lon + 180) / 360 * w) | 0, y = ((90 - lat) / 180 * h) | 0;
        if (x < 0) x = 0; else if (x >= w) x = w - 1;
        if (y < 0) y = 0; else if (y >= h) y = h - 1;
        return bits[y * w + x] !== 0;
      }
    };
  }
  /* The real coastlines: rings of [lon*100, lat*100, ...] from land-110m.js. */
  function land(w, h) {
    var rings = global.NW_LAND110 || [];
    return raster(w, h, function (mc, X, Y) {
      mc.beginPath();
      for (var r = 0; r < rings.length; r++) {
        var ring = rings[r];
        for (var i = 0; i < ring.length; i += 2) {
          if (i === 0) mc.moveTo(X(ring[i] / 100), Y(ring[i + 1] / 100)); else mc.lineTo(X(ring[i] / 100), Y(ring[i + 1] / 100));
        }
        mc.closePath();
      }
      mc.fill('evenodd');
    });
  }

  /* An equal-area lattice of points: rings spaced so the spacing on the sphere
     is constant. A plain lat/lon grid crowds the poles into a pincushion. */
  function lattice(step) {
    var pts = [];
    for (var lat = -88; lat <= 88; lat += step) {
      var n = Math.max(1, Math.round(360 / step * Math.cos(lat * D)));
      for (var i = 0; i < n; i++) pts.push([-180 + i * (360 / n), lat]);
    }
    return pts;
  }

  /* ---- stage ----------------------------------------------------------- */
  function stage(opts) {
    var q = new URLSearchParams(global.location.search);
    var cfg = { theme: 'dark', speed: 40, mark: true, corner: 'NET-WORKS-LAB.COM' };
    var k;
    for (k in (opts.settings || {})) cfg[k] = opts.settings[k];

    function coerce(name, val, fromHost) {
      var was = cfg[name];
      if (name === 'theme') return (val === 'light' || (fromHost && +val === 1)) ? 'light' : 'dark';
      if (typeof was === 'boolean') return fromHost ? !!val : !(val === '0' || val === 'false' || val === 'off');
      if (typeof was === 'number') return isFinite(+val) ? +val : was;
      return String(val == null ? '' : val);
    }
    for (k in cfg) if (q.has(k)) cfg[k] = coerce(k, q.get(k), false);
    var still = q.has('still'), freeze = q.has('t') ? +q.get('t') : null;

    var S = {
      cfg: cfg, T: THEMES[cfg.theme], still: still,
      dpr: 1, W: 0, H: 0, R: 0, cx: 0, cy: 0, clock: 0, ok: true
    };
    S.ink = function () { return 'rgb(' + S.T.ink[0] + ',' + S.T.ink[1] + ',' + S.T.ink[2] + ')'; };

    /* Page furniture: the wallpaper is the whole page. */
    var css = document.createElement('style');
    css.textContent =
      '@font-face{font-family:"DM Mono";font-weight:400;font-style:normal;src:url(fonts/DMMono-Regular.woff2) format("woff2")}' +
      '@font-face{font-family:"DM Mono";font-weight:500;font-style:normal;src:url(fonts/DMMono-Medium.woff2) format("woff2")}' +
      'html,body{margin:0;padding:0;width:100%;height:100%;overflow:hidden}canvas{position:absolute;display:block}';
    document.head.appendChild(css);

    S.canvas = function () { var c = document.createElement('canvas'); document.body.appendChild(c); return c; };
    var markL = S.canvas(), markR = S.canvas();

    /* Every canvas has to land on the device-pixel grid one-to-one, or the
       compositor resamples it and the linework goes soft. Layout keeps CSS
       lengths in 1/64 px, so at 125% or 150% display scaling only some
       device-pixel values survive the trip (multiples of 5, of 3); each edge
       moves outward to the nearest one that does. */
    function onGrid(v) { var c = v / S.dpr * 64; return Math.abs(c - Math.round(c)) < 1e-6; }
    function gridDown(v) { v = Math.floor(v); for (var n = 0; n < 64 && !onGrid(v); n++) v--; return v; }
    function gridUp(v) { v = Math.ceil(v); for (var n = 0; n < 64 && !onGrid(v); n++) v++; return v; }
    /* Sizes a canvas to cover the device-pixel box x0,y0..x1,y1; returns where it landed. */
    S.place = function (cv, x0, y0, x1, y1) {
      var x = gridDown(x0), y = gridDown(y0), w = gridUp(x1 - x), h = gridUp(y1 - y);
      if (cv.width !== w) cv.width = w;
      if (cv.height !== h) cv.height = h;
      cv.style.left = (x / S.dpr) + 'px'; cv.style.top = (y / S.dpr) + 'px';
      cv.style.width = (w / S.dpr) + 'px'; cv.style.height = (h / S.dpr) + 'px';
      return { x: x, y: y, w: w, h: h };
    };

    /* ---- the wordmark, one small canvas per corner, drawn once ---- */
    function drawMarks() {
      document.documentElement.style.background = document.body.style.background = S.T.bg;
      var corner = String(cfg.corner || '').toUpperCase();
      markL.style.display = cfg.mark ? '' : 'none';
      markR.style.display = cfg.mark && corner ? '' : 'none';
      if (!cfg.mark) return;
      var W = S.W, H = S.H, INK = S.ink();
      var unit = Math.min(W, H), edge = Math.round(unit * 0.055), my = H - Math.round(unit * 0.05);
      /* On a screen wider than 16:9 the wordmark keeps to a centred 16:9 frame,
         which is where Windows puts it when a still is set to Fit, and which
         keeps it out from under a taskbar docked to the side. */
      var fw = Math.min(W, Math.round(H * 16 / 9)), fx = Math.round((W - fw) / 2);
      /* Letter-spacing is drawn by hand: canvas has no tracking. parts is [text, fill] pairs. */
      function run(cv, parts, weight, fs, fromRight) {
        var ctx = cv.getContext('2d'), font = weight + ' ' + fs + 'px "DM Mono", ui-monospace, monospace', track = fs * 0.34;
        ctx.font = font;
        var total = -track;
        parts.forEach(function (p) { total += ctx.measureText(p[0]).width + track * p[0].length; });
        var x = fromRight ? fx + fw - edge - total : fx + edge;
        var b = S.place(cv, x - fs, my - 2 * fs, x + total + fs, my + fs);
        ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, b.w, b.h);
        ctx.translate(-b.x, -b.y);
        ctx.font = font; ctx.textBaseline = 'alphabetic';   /* resizing a canvas resets its state */
        parts.forEach(function (p) {
          ctx.fillStyle = p[1];
          for (var c = 0; c < p[0].length; c++) { ctx.fillText(p[0][c], x, my); x += ctx.measureText(p[0][c]).width + track; }
        });
      }
      run(markL, [['NET ', INK], ['// ', S.T.dim], ['WORKS', INK]], 500, Math.max(11, Math.round(unit * 0.0135)), false);
      if (corner) run(markR, [[corner, S.T.dim]], 400, Math.max(9, Math.round(unit * 0.0105)), true);
    }

    /* ---- layout, in device pixels ---- */
    var devW = 0, devH = 0;
    function layout() {
      S.dpr = global.devicePixelRatio || 1;
      /* innerWidth is rounded to whole CSS px, which is a device pixel out on a
         2560-wide screen at 150%; the observer below reports the real size. It
         is only believed when it agrees to within that rounding - under an
         emulated scale factor it answers in CSS px instead. */
      S.W = Math.max(1, Math.round(global.innerWidth * S.dpr)); S.H = Math.max(1, Math.round(global.innerHeight * S.dpr));
      if (Math.abs(devW - S.W) <= S.dpr && Math.abs(devH - S.H) <= S.dpr) { S.W = devW; S.H = devH; }
      S.R = Math.min(S.W, S.H) * (opts.size || 0.27); S.cx = S.W / 2; S.cy = S.H * 0.48;
      drawMarks();
      if (opts.layout) opts.layout(S);
      dirty = true;
    }
    try {
      new ResizeObserver(function (entries) {
        var s = entries[0].devicePixelContentBoxSize;
        if (!s || (s[0].inlineSize === devW && s[0].blockSize === devH)) return;
        devW = s[0].inlineSize; devH = s[0].blockSize; layout();
      }).observe(document.documentElement, { box: 'device-pixel-content-box' });
    } catch (e) {}
    global.addEventListener('resize', layout);

    /* ---- WebGL2: one fragment shader over one canvas ---- */
    /* init(gl, P) uploads textures; it runs again if the context is lost and
       comes back, which a wallpaper sees across driver resets and sleep. */
    S.program = function (canvas, frag, init) {
      var P = { gl: null, live: false };
      var locs = {};
      function start() {
        var gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false });
        if (!gl) { S.ok = false; return; }
        function sh(type, src) {
          var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
          if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw Error(gl.getShaderInfoLog(s));
          return s;
        }
        var prog = gl.createProgram();
        gl.attachShader(prog, sh(gl.VERTEX_SHADER, GLSL.vert)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, frag));
        gl.linkProgram(prog);
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw Error(gl.getProgramInfoLog(prog));
        gl.useProgram(prog);
        gl.bindVertexArray(gl.createVertexArray());
        gl.disable(gl.BLEND); gl.clearColor(0, 0, 0, 0);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
        locs = {}; P.gl = gl; P.prog = prog; P.live = true;
        if (init) init(gl, P);
      }
      P.u = function (name) { return locs[name] || (locs[name] = P.gl.getUniformLocation(P.prog, name)); };
      /* The uniforms every sphere takes: where the body is in this canvas, its radius, turn and tilt. */
      P.sphere = function (box, phi, tilt) {
        var gl = P.gl;
        gl.uniform2f(P.u('u_c'), S.cx - box.x, box.h - (S.cy - box.y));
        gl.uniform1f(P.u('u_R'), S.R);
        gl.uniform1f(P.u('u_phi'), phi % (2 * Math.PI));
        gl.uniform2f(P.u('u_tilt'), Math.cos(tilt), Math.sin(tilt));
      };
      P.rgb = function (name, c) { P.gl.uniform3f(P.u(name), c[0] / 255, c[1] / 255, c[2] / 255); };
      P.draw = function (box) {
        var gl = P.gl;
        gl.viewport(0, 0, box.w, box.h); gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLES, 0, 3);
      };
      /* A 0/255 bitmap as a texture read by texel, never filtered. */
      P.bitmap = function (unit, m) {
        var gl = P.gl, tex = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, m.w, m.h, 0, gl.RED, gl.UNSIGNED_BYTE, m.bits);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      };
      /* A photograph as a texture: mipmapped, and wrapping round the sphere in longitude. */
      P.image = function (unit, img, internal, format) {
        var gl = P.gl, tex = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, internal || gl.RGBA, format || gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        var ext = gl.getExtension('EXT_texture_filter_anisotropic');
        if (ext) gl.texParameterf(gl.TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
      };
      canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); P.live = false; });
      canvas.addEventListener('webglcontextrestored', function () { try { start(); S.redraw(); } catch (err) { console.error(err); } });
      try { start(); } catch (err) { S.ok = false; console.error(err); }
      return P;
    };

    /* ---- limb, orbit rings and their nodes ---- */
    /* o.limb: stroke the outline; o.squash: the body's height over its width;
       o.rings: draw the rings. The ring nodes travel and breathe on the clock. */
    S.drawRings = function (ctx, clock, o) {
      var R = S.R, cx = S.cx, cy = S.cy, INK = S.ink();
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      if (o.limb !== false) {
        ctx.lineWidth = Math.max(1.6, R * 0.006); ctx.strokeStyle = INK;
        ctx.beginPath(); ctx.ellipse(cx, cy, R, R * (o.squash || 1), 0, 0, 6.2832); ctx.stroke();
      }
      if (o.rings === false) return;
      for (var g = 0; g < RINGS.length; g++) {
        var rg = RINGS[g], Ro = rg.f * R, si = Math.sin(rg.incl), spin = rg.base + clock * rg.spd;
        ctx.lineWidth = Math.max(1.6, R * 0.005); ctx.strokeStyle = INK;
        ctx.beginPath(); ctx.ellipse(cx, cy, Ro, Math.abs(Ro * si), 0, 0, 6.2832); ctx.stroke();
        for (var n = 0; n < rg.nodes; n++) {
          var na = rg.noff + n * 2 * Math.PI / rg.nodes + spin;
          var nx = cx + Ro * Math.cos(na), ny = cy + Ro * Math.sin(na) * si;
          var nr = Math.max(3, R * 0.022) * (still ? 1 : 1 + 0.14 * Math.sin(clock * 2.2 + n * 1.7));
          ctx.beginPath(); ctx.arc(nx, ny, nr + R * 0.008, 0, 6.2832); ctx.fillStyle = S.T.bg; ctx.fill();
          ctx.beginPath(); ctx.arc(nx, ny, nr, 0, 6.2832); ctx.fillStyle = INK; ctx.fill();
        }
      }
    };
    /* The box the limb, the outer ring (1.44R) and its nodes can reach. */
    S.ringBox = function (cv, extraTop) {
      var pad = Math.ceil(S.R * 0.05) + 4;
      return S.place(cv, S.cx - 1.44 * S.R - pad, S.cy - S.R - pad - (extraTop || 0), S.cx + 1.44 * S.R + pad, S.cy + S.R + pad);
    };
    /* A 2D context over a placed canvas, cleared, drawing in device-pixel screen coordinates. */
    S.context = function (cv, box) {
      var ctx = cv.getContext('2d');
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, box.w, box.h);
      ctx.translate(-box.x, -box.y);
      return ctx;
    };

    /* ---- clock ---- */
    /* One clock drives everything a wallpaper animates, in full-pace seconds,
       so Speed slows the whole scene rather than one part of it. */
    var prevT = performance.now(), lastDraw = -1e9, frames = 0, ticks = 0, minMs = opts.fps ? 1000 / opts.fps : 0;
    var drawnClock = NaN, dirty = true;
    S.redraw = function () { dirty = true; };
    function frame(now) {
      requestAnimationFrame(frame);
      var dt = (now - prevT) / 1000; prevT = now;
      if (dt > 0.05) dt = 0.05;   /* a paused or hidden wallpaper resumes where it stopped, without a lurch */
      if (freeze !== null) S.clock = freeze;
      else if (!still && dt > 0) S.clock += dt * cfg.speed / 100;
      ticks++;
      if (minMs && freeze === null && now - lastDraw < minMs - 1) return;   /* a frame budget for the canvas-drawn ones */
      if (S.clock === drawnClock && !dirty) return;   /* nothing has moved: a stopped wallpaper costs nothing */
      drawnClock = S.clock; dirty = false; lastDraw = now;
      opts.draw(S, S.clock);
      frames++;
    }

    /* ---- settings from the wallpaper host ---- */
    /* Lively Wallpaper calls this once per property on load and again on change. */
    global.livelyPropertyListener = function (name, val) {
      if (!(name in cfg)) return;
      cfg[name] = coerce(name, val, true);
      S.T = THEMES[cfg.theme];
      if (name === 'theme' || name === 'mark' || name === 'corner') drawMarks();
      if (opts.change) opts.change(S, name);
      dirty = true;
    };

    /* Read-only diagnostics, and the hook scripts/shoot.py steps the clock through. */
    global.nwLive = function () {
      return { frames: frames, ticks: ticks, clock: S.clock, W: S.W, H: S.H, R: S.R, dpr: S.dpr, ok: S.ok, theme: cfg.theme, speed: cfg.speed };
    };
    global.nwLiveAt = function (t) { freeze = t; };

    /* Canvas text does not count as a use of a webfont, so ask for it by hand,
       then redraw the wordmark. A wallpaper with something to load (a texture)
       passes its promise as opts.ready. */
    S.start = function () {
      layout();
      Promise.all([
        Promise.all([document.fonts.load('500 32px "DM Mono"'), document.fonts.load('400 32px "DM Mono"')]).catch(function () {}),
        Promise.resolve(opts.ready).catch(function (e) { S.ok = false; console.error(e); })
      ]).then(function () { drawMarks(); dirty = true; global.NW_LIVE_READY = true; });
      requestAnimationFrame(frame);
      return S;
    };
    return S;
  }

  /* Points on the sphere as unit vectors, in typed arrays: [lon, lat] pairs in
     degrees go in once, and a frame is then a handful of multiplies per point
     with no trigonometry and no allocation. */
  function vectors(list) {
    var n = list.length, x = new Float32Array(n), y = new Float32Array(n), z = new Float32Array(n);
    for (var i = 0; i < n; i++) {
      var lo = list[i][0] * D, la = list[i][1] * D, c = Math.cos(la);
      x[i] = c * Math.cos(lo); y[i] = c * Math.sin(lo); z[i] = Math.sin(la);
    }
    return { n: n, x: x, y: y, z: z };
  }
  /* The viewer: looking at longitude lam, from latitude phi (degrees). For a
     unit vector v:  X = v.x*a + v.y*b,  across = -v.x*b + v.y*a,
     depth = sp*v.z + cp*X (in front when > 0),  up = cp*v.z - sp*X. */
  function view(lam, phi) {
    return { a: Math.cos(lam * D), b: Math.sin(lam * D), cp: Math.cos(phi * D), sp: Math.sin(phi * D) };
  }

  global.NWLive = { stage: stage, raster: raster, land: land, lattice: lattice, vectors: vectors, view: view,
                    THEMES: THEMES, RINGS: RINGS, GLSL: GLSL, D: D };
})(window);
