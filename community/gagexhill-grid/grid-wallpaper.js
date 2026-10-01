(function () {
  'use strict';
  const { defaults, schema, presets, fpsOptions, mouseModes, domePulse } = window.GridConfig;
  const settingsWindow = window.GridSettingsWindow === true;
  const clone = value => JSON.parse(JSON.stringify(value));
  const storageKey = 'grid-wallpaper.settings.v1';
  const listeners = new Set();
  const domeListeners = new Set();
  let domeState = null, domeSequence = 0, remoteDomeSequence = -1, hasDomeFrame = false;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let storageAvailable = true, hostManaged = false, hostPaused = false;
  let config = { ...clone(defaults), snapshot: reducedMotion.matches };

  function normalize(patch, base) {
    const result = clone(base);
    if (!patch || typeof patch !== 'object' || Array.isArray(patch)) return result;
    for (const key of Object.keys(defaults)) {
      const value = patch[key];
      if (value === undefined) continue;
      if (key === 'domeSizes' && Array.isArray(value)) {
        result.domeSizes = defaults.domeSizes.map((_, i) => Number.isFinite(value[i])
          ? Math.max(schema.domeSize.min, Math.min(schema.domeSize.max, value[i])) : base.domeSizes[i]);
      } else if (schema[key] && Number.isFinite(value)) {
        const { min, max, step: increment } = schema[key];
        const bounded = Math.max(min, Math.min(max, value));
        result[key] = Number((min + Math.round((bounded - min) / increment) * increment).toFixed(6));
        if (key === 'count' || key === 'cellSize') result[key] = Math.round(result[key]);
      } else if (typeof defaults[key] === 'boolean' && typeof value === 'boolean') result[key] = value;
      else if ((key === 'bgColor' || key === 'lineColor') && typeof value === 'string' && /^#[\da-f]{6}$/i.test(value)) result[key] = value.toLowerCase();
      else if (key === 'fpsLimit' && fpsOptions.includes(value)) result[key] = value;
      else if (key === 'mouseMode' && mouseModes.includes(value)) result[key] = value;
    }
    return result;
  }
  try {
    const saved = window.localStorage.getItem(storageKey);
    if (saved) {
      try { config = normalize(JSON.parse(saved), config); } catch { /* Invalid saved JSON uses defaults. */ }
    }
  } catch { storageAvailable = false; }

  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('Grid Wallpaper requires Canvas 2D support.');
  const bases = [
    [44, 1.2, 0.040], [30, 1.6, 0.060], [52, 0.7, 0.025], [22, 2, 0.080], [38, 1, 0.050],
    [48, 0.9, 0.030], [26, 1.8, 0.070], [35, 1.3, 0.045], [58, 0.5, 0.020], [18, 2.4, 0.090]
  ];
  let width = 1, height = 1;
  const domes = [], waves = [];
  let points = new Float32Array(0), glow = new Float32Array(0);
  let columns = 0, rows = 0, mouseX = Infinity, mouseY = Infinity;
  let hue = Math.random() * 360, targetHue = hue, hueHold = 0;
  let rafId = null, lastTime = null, lastRender = null, accumulator = 0, dirty = true;
  const step = 1000 / 60;

  function syncCount() {
    while (domes.length < config.count) {
      const i = domes.length;
      const x = width * (0.1 + Math.random() * 0.8), y = height * (0.1 + Math.random() * 0.8);
      domes.push({ i, x, y, tx: x, ty: y, angle: Math.random() * Math.PI * 2, av: 0,
        speed: bases[i][1] * config.speedScale, phase: Math.random() * Math.PI * 2,
        cooldown: i * 20 + Math.random() * 40, radius: 0, force: 0 });
    }
    domes.length = config.count;
  }
  function resize() {
    const oldWidth = width, oldHeight = height;
    width = Math.max(1, window.innerWidth); height = Math.max(1, window.innerHeight);
    // CSS-pixel backing avoids quadratic DPR cost on high-density laptop displays.
    canvas.width = width; canvas.height = height;
    for (const dome of domes) {
      dome.x *= width / oldWidth; dome.tx *= width / oldWidth;
      dome.y *= height / oldHeight; dome.ty *= height / oldHeight;
    }
    waves.length = 0;
    invalidate();
  }
  function prepareDomes() {
    for (const dome of domes) {
      const pulse = config.autoSize ? domePulse.min + (domePulse.max - domePulse.min) * (0.5 + 0.5 * Math.sin(dome.phase)) : domePulse.max;
      dome.pulse = pulse;
      dome.radius = Math.min(200 * config.domeSizes[dome.i] * config.sizeScale * pulse, Math.min(width, height) * 0.38);
      dome.force = bases[dome.i][0] * config.forceScale * dome.radius / 200;
    }
  }
  // Fixed-size simulation steps preserve movement speed at every rendering FPS limit.
  function simulate() {
    prepareDomes();
    for (const dome of domes) {
      const base = bases[dome.i], speed = base[1] * config.speedScale;
      dome.av = (dome.av + (Math.random() - 0.5) * base[2]) * 0.92;
      dome.angle += dome.av;
      dome.speed = Math.max(speed * 0.4, Math.min(speed * 2.5, dome.speed + (Math.random() - 0.5) * 0.08));
      dome.tx += Math.cos(dome.angle) * dome.speed; dome.ty += Math.sin(dome.angle) * dome.speed;
      if (config.autoSize) dome.phase += 0.008 * (0.6 + dome.i * 0.08);
      if (config.mouseMode !== 'off') {
        const dx = dome.x - mouseX, dy = dome.y - mouseY, distance = Math.hypot(dx, dy);
        const reach = dome.radius * 0.85;
        if (distance > 0.1 && distance < reach) {
          const t = 1 - distance / reach, bounce = t * t * speed * 18;
          const sign = config.mouseMode === 'repel' ? 1 : -1;
          const nx = dx / distance * sign, ny = dy / distance * sign;
          dome.x += nx * bounce * 0.4; dome.y += ny * bounce * 0.4;
          dome.tx += nx * bounce; dome.ty += ny * bounce;
          const angle = Math.atan2(ny, nx) - dome.angle;
          dome.angle += Math.atan2(Math.sin(angle), Math.cos(angle)) * t * 0.5;
        }
      }
      const marginX = Math.min(60, width * 0.1), marginY = Math.min(60, height * 0.1);
      if (dome.tx < marginX || dome.tx > width - marginX) {
        dome.angle = Math.atan2(Math.sin(dome.angle), -Math.cos(dome.angle)) + (Math.random() - 0.5) * 0.3;
        dome.tx = Math.max(marginX, Math.min(width - marginX, dome.tx));
      }
      if (dome.ty < marginY || dome.ty > height - marginY) {
        dome.angle = Math.atan2(-Math.sin(dome.angle), Math.cos(dome.angle)) + (Math.random() - 0.5) * 0.3;
        dome.ty = Math.max(marginY, Math.min(height - marginY, dome.ty));
      }
      dome.x += (dome.tx - dome.x) * config.lerpSpeed; dome.y += (dome.ty - dome.y) * config.lerpSpeed;
      if (config.gradientLines && --dome.cooldown <= 0) {
        if (waves.length < 15) waves.push({ x: dome.x, y: dome.y, start: dome.radius * 0.3, max: dome.radius * 3, age: 0, r: 0, opacity: 0 });
        dome.cooldown = 140 + Math.random() * 80;
      }
    }
    for (let i = waves.length - 1; i >= 0; i--) {
      const wave = waves[i];
      if (++wave.age >= 360) waves.splice(i, 1);
      else {
        const t = wave.age / 360;
        wave.r = wave.start + (wave.max - wave.start) * (1 - (1 - t) ** 2);
        wave.opacity = 0.45 * (1 - t) ** 1.4;
      }
    }
    if (config.autoColor) {
      if (--hueHold <= 0) { targetHue = (hue + 90 + Math.random() * 180) % 360; hueHold = 900 + Math.random() * 1800; }
      const diff = ((targetHue - hue + 540) % 360) - 180;
      hue = (hue + diff * 0.04 + 360) % 360;
    }
  }
  function lineColor() {
    if (!config.autoColor) return config.lineColor;
    return 'hsl(' + hue + ' ' + (60 + 20 * Math.sin(hue * Math.PI / 90)) + '% ' + (68 + 15 * Math.cos(hue * Math.PI / 120)) + '%)';
  }
  function draw() {
    prepareDomes();
    const cell = config.cellSize;
    columns = Math.ceil(width / cell) + 4; rows = Math.ceil(height / cell) + 4;
    const count = columns * rows;
    if (points.length !== count * 2) { points = new Float32Array(count * 2); glow = new Float32Array(count); }
    // Rows, columns and ripples share one calculation per vertex and reuse typed buffers.
    for (let row = 0; row < rows; row++) {
      for (let column = 0; column < columns; column++) {
        const gx = column * cell, gy = row * cell, index = row * columns + column;
        let ox = 0, oy = 0, edge = 1, intensity = 0;
        for (const dome of domes) {
          const dx = gx - dome.x, dy = gy - dome.y, squared = dx * dx + dy * dy, radius = dome.radius;
          if (squared < (radius + 40) ** 2) {
            const distance = Math.sqrt(squared);
            if (waves.length && Math.abs(distance - radius) < 40) edge += (1 - Math.abs(distance - radius) / 40) * 1.2;
            if (distance > 0.01 && distance < radius) {
              const t = distance / radius;
              const push = dome.force * Math.sin(Math.PI * t) * 0.5 * (1 + Math.cos(Math.PI * Math.max(0, (t - 0.4) / 0.6)));
              ox += dx / distance * push; oy += dy / distance * push;
            }
          }
        }
        points[index * 2] = gx + ox; points[index * 2 + 1] = gy + oy;
        for (const wave of waves) {
          const dx = gx - wave.x, dy = gy - wave.y, squared = dx * dx + dy * dy;
          if (squared > (wave.r + 40) ** 2 || squared < Math.max(0, wave.r - 40) ** 2) continue;
          const fade = 1 - Math.abs(Math.sqrt(squared) - wave.r) / 40;
          if (fade > 0) intensity += wave.opacity * fade * fade;
        }
        glow[index] = Math.min(0.8, intensity * edge);
      }
    }
    ctx.globalAlpha = 1; ctx.fillStyle = config.bgColor; ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = lineColor(); ctx.lineWidth = 1; ctx.globalAlpha = config.lineOpacity;
    ctx.beginPath();
    for (let row = 0; row < rows; row++) {
      for (let column = 0; column < columns; column++) {
        const i = (row * columns + column) * 2;
        if (column === 0) ctx.moveTo(points[i], points[i + 1]); else ctx.lineTo(points[i], points[i + 1]);
      }
    }
    for (let column = 0; column < columns; column++) {
      for (let row = 0; row < rows; row++) {
        const i = (row * columns + column) * 2;
        if (row === 0) ctx.moveTo(points[i], points[i + 1]); else ctx.lineTo(points[i], points[i + 1]);
      }
    }
    ctx.stroke();
    if (waves.length) {
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < count; i++) {
        if (i % columns !== columns - 1) strokeGlow(i, i + 1);
        if (i < count - columns) strokeGlow(i, i + columns);
      }
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.globalAlpha = 1; dirty = false;
    hasDomeFrame = true;
    refreshDomeState();
  }
  function strokeGlow(a, b) {
    const opacity = (glow[a] + glow[b]) / 2;
    if (opacity <= 0.01) return;
    ctx.globalAlpha = opacity; ctx.beginPath();
    ctx.moveTo(points[a * 2], points[a * 2 + 1]); ctx.lineTo(points[b * 2], points[b * 2 + 1]); ctx.stroke();
  }
  function schedule() {
    if (!settingsWindow && rafId === null && !document.hidden && !hostPaused && (dirty || !config.snapshot)) rafId = requestAnimationFrame(frame);
  }
  function stop() {
    if (rafId !== null) cancelAnimationFrame(rafId);
    rafId = null; lastTime = null; lastRender = null; accumulator = 0;
  }
  function invalidate() { dirty = true; schedule(); }
  function frame(now) {
    rafId = null;
    if (document.hidden || hostPaused) { stop(); return; }
    if (lastTime !== null && !config.snapshot) accumulator += Math.min(100, Math.max(0, now - lastTime));
    lastTime = now;
    const interval = 1000 / config.fpsLimit;
    if (dirty || lastRender === null || now - lastRender >= interval - 0.1) {
      while (!config.snapshot && accumulator + 0.001 >= step) { simulate(); accumulator -= step; }
      draw();
      lastRender = lastRender === null ? now : now - ((now - lastRender) % interval);
    }
    schedule();
  }
  function notify() { for (const listener of listeners) listener(clone(config)); }
  function getDomeState() {
    if (settingsWindow) return domeState ? clone(domeState) : null;
    if (!hasDomeFrame || domeSequence >= Number.MAX_SAFE_INTEGER) return null;
    if (!domeState) {
      const screen = window.screen;
      domeState = {
        kind: 'domes', sequence: domeSequence, autoSize: config.autoSize,
        paused: config.snapshot || hostPaused || document.hidden,
        bases: config.domeSizes.slice(0, config.count),
        sizes: domes.map(dome => config.domeSizes[dome.i] * dome.pulse),
        screen: { left: screen?.availLeft ?? 0, top: screen?.availTop ?? 0,
          width: screen?.availWidth ?? width, height: screen?.availHeight ?? height,
          scale: window.devicePixelRatio || 1 }
      };
    }
    return clone(domeState);
  }
  function notifyDomeState() {
    for (const listener of domeListeners) listener(getDomeState());
  }
  function refreshDomeState() {
    if (settingsWindow) return;
    domeState = null;
    if (domeSequence < Number.MAX_SAFE_INTEGER) domeSequence++;
    if (domeListeners.size) notifyDomeState();
  }
  function setDomeState(state) {
    if (!settingsWindow) return false;
    if (state === null) {
      domeState = null; remoteDomeSequence = -1; notifyDomeState(); return true;
    }
    if (!state || state.kind !== 'domes' || !Number.isSafeInteger(state.sequence) || state.sequence < 0 ||
      state.sequence <= remoteDomeSequence || typeof state.paused !== 'boolean' || state.autoSize !== config.autoSize ||
      !Array.isArray(state.bases) || !Array.isArray(state.sizes) || state.bases.length !== config.count || state.sizes.length !== config.count) return false;
    const screen = state.screen;
    if (!screen || !['left', 'top', 'width', 'height', 'scale'].every(key => Number.isFinite(screen[key])) ||
      Math.abs(screen.left) > 131072 || Math.abs(screen.top) > 131072 || screen.width < 1 || screen.width > 32768 ||
      screen.height < 1 || screen.height > 32768 || screen.scale < 0.5 || screen.scale > 8) return false;
    for (let index = 0; index < config.count; index++) {
      const base = state.bases[index], size = state.sizes[index];
      if (!Number.isFinite(base) || base < schema.domeSize.min || base > schema.domeSize.max ||
        Math.abs(base - config.domeSizes[index]) > 0.000001 || !Number.isFinite(size) ||
        size < base * (state.autoSize ? domePulse.min : domePulse.max) - 0.000000001 ||
        size > base * domePulse.max + 0.000000001) return false;
    }
    remoteDomeSequence = state.sequence;
    domeState = { kind: 'domes', sequence: state.sequence, autoSize: state.autoSize, paused: state.paused,
      bases: state.bases.slice(), sizes: state.sizes.slice(),
      screen: { left: screen.left, top: screen.top, width: screen.width, height: screen.height, scale: screen.scale } };
    notifyDomeState(); return true;
  }
  function update(patch, persist = true) {
    const previous = config;
    const wasFrozen = config.snapshot;
    config = normalize(patch, config);
    const domeConfigChanged = previous.count !== config.count || previous.autoSize !== config.autoSize ||
      config.domeSizes.some((size, index) => size !== previous.domeSizes[index]);
    if (domeConfigChanged) { hasDomeFrame = false; domeState = null; notifyDomeState(); }
    else if (wasFrozen !== config.snapshot) refreshDomeState();
    if (wasFrozen !== config.snapshot) stop();
    if (!config.gradientLines) waves.length = 0;
    syncCount();
    document.getElementById('vignette')?.classList.toggle('on', config.vignette);
    if (persist && !hostManaged) {
      try { window.localStorage.setItem(storageKey, JSON.stringify(config)); storageAvailable = true; }
      catch { storageAvailable = false; }
    }
    invalidate(); notify(); return clone(config);
  }
  function reset() { return update({ ...clone(defaults), snapshot: reducedMotion.matches }); }
  function randomize() {
    const random = (a, b) => Number((a + (b - a) * Math.random()).toFixed(2));
    return update({ sizeScale: random(0.4, 2), speedScale: random(0.3, 2.5), forceScale: random(0.4, 2), lerpSpeed: random(0.02, 0.2), cellSize: Math.round(random(12, 40)) });
  }
  window.GridWallpaper = Object.freeze({ defaults, schema, presets, fpsOptions, mouseModes,
    getConfig: () => clone(config), getDomeState, setDomeState, update, reset, randomize,
    subscribe(callback) { listeners.add(callback); return () => listeners.delete(callback); },
    subscribeDomeState(callback) {
      if (typeof callback !== 'function') throw new TypeError('A dome state listener must be a function.');
      domeListeners.add(callback); callback(getDomeState());
      return () => domeListeners.delete(callback);
    },
    get storageAvailable() { return storageAvailable; }, get hostManaged() { return hostManaged; }
  });
  window.livelyPropertyListener = function (name, value) {
    if (!hostManaged) {
      hostManaged = true; config = clone(defaults);
      hasDomeFrame = false; domeState = null; notifyDomeState();
    }
    const patch = {};
    if (name === 'fpsLimit') patch.fpsLimit = fpsOptions[value];
    else if (name === 'mouseMode') patch.mouseMode = mouseModes[value];
    else if (/^domeSize[0-9]$/.test(name)) {
      patch.domeSizes = config.domeSizes.slice(); patch.domeSizes[Number(name.slice(-1))] = value;
    } else if (Object.hasOwn(defaults, name)) patch[name] = value;
    update(patch, false);
  };
  window.livelyWallpaperPlaybackChanged = function (data) {
    try {
      const message = typeof data === 'string' ? JSON.parse(data) : data;
      if (typeof message?.IsPaused !== 'boolean') return;
      const changed = hostPaused !== message.IsPaused;
      hostPaused = message.IsPaused; stop(); if (changed) refreshDomeState(); if (!hostPaused) invalidate();
    } catch { /* Malformed host messages leave playback unchanged. */ }
  };
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', () => { stop(); refreshDomeState(); if (!document.hidden) invalidate(); });
  window.addEventListener('pagehide', stop);
  window.addEventListener('pageshow', invalidate);
  window.addEventListener('pointermove', event => {
    if (event.target.closest?.('#panel, #hamburger')) { mouseX = mouseY = Infinity; return; }
    mouseX = event.clientX; mouseY = event.clientY;
  }, { passive: true });
  const clearPointer = () => { mouseX = mouseY = Infinity; };
  document.documentElement.addEventListener('pointerleave', clearPointer);
  window.addEventListener('blur', clearPointer);
  window.addEventListener('pointercancel', clearPointer);
  reducedMotion.addEventListener('change', event => { if (event.matches && !hostManaged) update({ snapshot: true }); });
  resize(); syncCount(); update({}, false);
})();

(function () {
  'use strict';
  if (window.GridSettingsWindow === true || !window.chrome?.webview) return;
  const api = window.GridWallpaper;
  if (!api || typeof window.WebSocket !== 'function') return;
  let socket = null, script = null, timer = null, sendTimer = null, unsubscribe = null, disposed = false;
  let lastSent = -Infinity, lastSourceSequence = -1, transportSequence = -1;
  const interval = 1000 / 15;
  const eligible = () => !disposed && api.hostManaged && !document.hidden;
  const stopStream = () => {
    unsubscribe?.(); unsubscribe = null;
    if (sendTimer !== null) clearTimeout(sendTimer);
    sendTimer = null;
  };
  const clearTimer = () => { if (timer !== null) clearTimeout(timer); timer = null; };
  const removeScript = () => {
    if (!script) return;
    script.onload = script.onerror = null;
    script.remove(); script = null;
  };
  function retry() {
    if (!eligible() || timer !== null) return;
    timer = setTimeout(() => { timer = null; loadBootstrap(); }, 3000);
  }
  function disconnect() {
    stopStream(); clearTimer(); removeScript();
    if (!socket) return;
    const previous = socket; socket = null;
    previous.onopen = previous.onmessage = previous.onclose = previous.onerror = null;
    previous.close();
  }
  function publish(state) {
    if (!state || !eligible() || !socket || socket.readyState !== window.WebSocket.OPEN) return;
    if (state.sequence === lastSourceSequence) return;
    const now = performance.now();
    if (socket.bufferedAmount || now - lastSent < interval) {
      if (sendTimer === null) sendTimer = setTimeout(() => {
        sendTimer = null;
        publish(api.getDomeState());
      }, socket.bufferedAmount ? interval : interval - (now - lastSent));
      return;
    }
    try {
      if (transportSequence >= Number.MAX_SAFE_INTEGER) { disconnect(); retry(); return; }
      socket.send(JSON.stringify({ ...state, sequence: ++transportSequence }));
      lastSourceSequence = state.sequence; lastSent = now;
    }
    catch { disconnect(); retry(); }
  }
  function connect(options) {
    if (!eligible() || socket || !script || !options || typeof options.url !== 'string' ||
      typeof options.token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(options.token)) return false;
    const match = /^ws:\/\/127\.0\.0\.1:([1-9]\d{0,4})\/grid-wallpaper\/$/.exec(options.url);
    if (!match || Number(match[1]) > 65535) return false;
    let next;
    try { next = new window.WebSocket(options.url, ['grid-wallpaper-v1', 'grid-wallpaper-token.' + options.token]); }
    catch { return false; }
    socket = next; lastSent = -Infinity; lastSourceSequence = transportSequence = -1;
    next.onopen = () => {
      if (socket !== next || !eligible()) return;
      clearTimer();
      const screen = window.screen;
      try {
        next.send(JSON.stringify({ kind: 'hello', screen: { left: screen.availLeft, top: screen.availTop,
          width: screen.availWidth, height: screen.availHeight, scale: window.devicePixelRatio } }));
      } catch { disconnect(); retry(); }
    };
    next.onmessage = event => {
      if (socket !== next || typeof event.data !== 'string' || event.data.length > 128) return;
      let message;
      try { message = JSON.parse(event.data); } catch { return; }
      if (!message || message.kind !== 'stream' || typeof message.active !== 'boolean' ||
        Object.keys(message).length !== 2) return;
      if (!message.active || !eligible()) { stopStream(); return; }
      if (!unsubscribe) {
        lastSent = -Infinity; lastSourceSequence = -1;
        const remove = api.subscribeDomeState(publish);
        if (socket !== next || !eligible()) remove();
        else unsubscribe = remove;
      }
    };
    next.onclose = next.onerror = () => {
      if (socket !== next) return;
      disconnect(); retry();
    };
    return true;
  }
  function loadBootstrap() {
    if (!eligible() || socket || script) return;
    clearTimer();
    const bootstrap = document.createElement('script');
    const url = new URL('windows-telemetry.js', document.baseURI);
    url.searchParams.set('v', String(Date.now()));
    bootstrap.src = url.href; bootstrap.async = true;
    script = bootstrap;
    bootstrap.onload = bootstrap.onerror = () => {
      if (script !== bootstrap) return;
      removeScript();
      if (!socket) { clearTimer(); retry(); }
    };
    // One bounded watchdog also covers a bootstrap that never loads or a stalled handshake.
    timer = setTimeout(() => { timer = null; disconnect(); retry(); }, 3000);
    document.head.appendChild(bootstrap);
  }
  window.GridLiveTelemetry = Object.freeze({ connect });
  const unsubscribeConfig = api.subscribe(() => { if (eligible() && timer === null) loadBootstrap(); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) disconnect(); else loadBootstrap();
  });
  window.addEventListener('pagehide', () => { disposed = true; disconnect(); });
  window.addEventListener('pageshow', () => { disposed = false; loadBootstrap(); });
  window.addEventListener('unload', () => { disposed = true; disconnect(); unsubscribeConfig(); });
  loadBootstrap();
})();
