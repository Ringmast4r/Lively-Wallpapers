(function () {
  'use strict';
  if (window.GridSettingsWindow !== true || !window.chrome?.webview) return;
  const api = window.GridWallpaper;
  const host = window.chrome.webview;
  const status = document.getElementById('save-status');
  let ready = false;
  let previous = {};
  let revision = 0;
  let shownSequence = 0;
  let interactiveFrame = 0;
  let telemetryAvailable = null;
  const setControlsEnabled = enabled => {
    document.querySelectorAll('#panel input, #panel select, #panel button:not(#close-settings)').forEach(control => { control.disabled = !enabled; });
  };

  function nativeProperties(config) {
    const properties = {};
    for (const [key, value] of Object.entries(config)) {
      if (key === 'domeSizes') value.forEach((size, index) => { properties[`domeSize${index}`] = size; });
      else if (key === 'fpsLimit') properties[key] = api.fpsOptions.indexOf(value);
      else if (key === 'mouseMode') properties[key] = api.mouseModes.indexOf(value);
      else properties[key] = value;
    }
    return properties;
  }
  function showStatus(message) { status.textContent = message; }
  function clearShown() {
    shownSequence = 0;
    cancelAnimationFrame(interactiveFrame);
    interactiveFrame = 0;
  }
  function reportInteractive() {
    if (!ready || !shownSequence || interactiveFrame) return;
    const sequence = shownSequence;
    interactiveFrame = requestAnimationFrame(() => {
      interactiveFrame = 0;
      if (ready && sequence === shownSequence && !document.hidden) host.postMessage({ kind: 'interactive', sequence });
    });
  }

  function launcherAppearance() {
    const button = document.getElementById('hamburger');
    const style = getComputedStyle(button);
    const svg = button.querySelector('svg');
    const view = svg.viewBox.baseVal;
    const width = Number.parseFloat(style.width), height = Number.parseFloat(style.height);
    const radius = Number.parseFloat(style.borderTopLeftRadius);
    const border = Number.parseFloat(style.borderTopWidth);
    const gap = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--settings-gap'));
    const pressed = Number.parseFloat(style.getPropertyValue('--settings-press-scale'));
    const svgWidth = svg.width.baseVal.value, svgHeight = svg.height.baseVal.value;
    const frames = [];
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width * window.devicePixelRatio);
    canvas.height = Math.round(height * window.devicePixelRatio);
    const context = canvas.getContext('2d');
    for (let frame = 0; frame < 6; frame++) {
      context.resetTransform();
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.save();
      context.scale(canvas.width / width, canvas.height / height);
      context.beginPath();
      context.roundRect(border / 2, border / 2, width - border, height - border, Math.max(0, radius - border / 2));
      context.fillStyle = style.backgroundColor;
      context.fill();
      context.lineWidth = border;
      context.strokeStyle = style.borderTopColor;
      context.stroke();
      context.translate(width / 2, height / 2);
      const scale = 1 + (pressed - 1) * frame / 5;
      context.scale(scale, scale);
      context.translate(-svgWidth / 2, -svgHeight / 2);
      context.scale(svgWidth / view.width, svgHeight / view.height);
      context.translate(-view.x, -view.y);
      for (const element of svg.querySelectorAll('path')) {
        const pathStyle = getComputedStyle(element);
        const path = new Path2D(element.getAttribute('d'));
        context.save();
        for (let index = 0; index < element.transform.baseVal.numberOfItems; index++) {
          const matrix = element.transform.baseVal.getItem(index).matrix;
          context.transform(matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f);
        }
        context.globalAlpha = Number.parseFloat(pathStyle.opacity);
        if (pathStyle.fill !== 'none') {
          context.fillStyle = pathStyle.fill;
          context.fill(path, pathStyle.fillRule);
        }
        if (pathStyle.stroke !== 'none') {
          context.strokeStyle = pathStyle.stroke;
          context.lineWidth = Number.parseFloat(pathStyle.strokeWidth);
          context.lineCap = pathStyle.strokeLinecap;
          context.lineJoin = pathStyle.strokeLinejoin;
          context.miterLimit = Number.parseFloat(pathStyle.strokeMiterlimit);
          context.stroke(path);
        }
        context.restore();
      }
      context.restore();
      frames.push(canvas.toDataURL('image/png').split(',')[1]);
    }
    return { width, height, gap, radius, frames };
  }
  window.GridSettingsHost = Object.freeze({
    get telemetryAvailable() { return telemetryAvailable; },
    close() { host.postMessage({ kind: 'close' }); },
    observeDomes(active) { host.postMessage({ kind: 'observe-domes', active: active === true }); }
  });
  api.subscribe(config => {
    if (!ready) return;
    const current = nativeProperties(config);
    const changed = Object.fromEntries(Object.entries(current).filter(([key, value]) => previous[key] !== value));
    if (Object.keys(changed).length === 0) return;
    previous = current;
    showStatus('Saving changes…');
    host.postMessage({ kind: 'change', properties: changed, revision: ++revision });
  });
  host.addEventListener('message', event => {
    const message = event.data;
    if (message?.kind === 'init' && message.properties && typeof message.properties === 'object') {
      if (typeof message.telemetryAvailable === 'boolean') telemetryAvailable = message.telemetryAvailable;
      ready = false;
      for (const [name, property] of Object.entries(message.properties)) {
        if (property && Object.hasOwn(property, 'value')) window.livelyPropertyListener(name, property.value);
      }
      previous = nativeProperties(api.getConfig());
      ready = true;
      setControlsEnabled(true);
      showStatus('Changes save automatically.');
      reportInteractive();
    } else if (message?.kind === 'shown' && Number.isSafeInteger(message.sequence) && message.sequence > 0) {
      clearShown();
      shownSequence = message.sequence;
      window.dispatchEvent(new Event('grid-settings-shown'));
      reportInteractive();
    } else if (message?.kind === 'hidden') {
      clearShown();
      api.setDomeState(null);
      window.dispatchEvent(new Event('grid-settings-hidden'));
    } else if (message?.kind === 'dome-state') {
      api.setDomeState(message.state);
    } else if (message?.kind === 'loading') {
      ready = false;
      setControlsEnabled(false);
      showStatus('Loading your settings…');
    } else if (message?.kind === 'closing') {
      clearShown();
      api.setDomeState(null);
      window.dispatchEvent(new Event('grid-settings-hidden'));
      ready = false;
      setControlsEnabled(false);
      showStatus('Saving before closing…');
    } else if (message?.kind === 'saved' && message.revision === revision) showStatus('Changes saved.');
    else if (message?.kind === 'error') {
      previous = {};
      ready = true;
      setControlsEnabled(true);
      showStatus(typeof message.message === 'string' ? message.message : 'Changes could not be saved. Keep Lively running and try again.');
      reportInteractive();
    }
  });
  showStatus('Loading your settings…');
  window.addEventListener('DOMContentLoaded', () => {
    setControlsEnabled(ready);
    const message = { kind: 'ready', radius: Number.parseFloat(getComputedStyle(document.getElementById('panel')).borderTopRightRadius), launcher: launcherAppearance() };
    if (new TextEncoder().encode(JSON.stringify(message)).length > 65536) {
      showStatus('The settings appearance is too large to load at this display scale.');
      return;
    }
    host.postMessage(message);
  }, { once: true });
})();

(function () {
  'use strict';

  const api = window.GridWallpaper;
  const menu = document.getElementById('hamburger');
  const panel = document.getElementById('panel');
  const closeButton = document.getElementById('close-settings');
  const sections = Array.from(panel.querySelectorAll('details'));
  const expandButton = document.getElementById('expand-sections');
  const status = document.getElementById('action-status');
  const bindings = [];
  const colorBindings = [];
  const domeBindings = [];
  const isSettingsWindow = window.GridSettingsWindow === true;
  let nativeVisible = !isSettingsWindow;
  let domeState = null;
  let stopDomeObservation = null;
  const contentAnimations = new Set();
  document.documentElement.classList.toggle('settings-window', isSettingsWindow);

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  if (!api) {
    menu.disabled = true;
    document.body.append(element('p', 'startup-error',
      'Grid Wallpaper could not load. Keep all wallpaper files together, then reopen grid-wallpaper.html.'));
    return;
  }

  const edgeGap = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--settings-gap'));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let layoutHostManaged = api.hostManaged;
  let pressAnimation;

  function pressFeedback() {
    if (isSettingsWindow) return;
    pressAnimation?.cancel();
    if (!reducedMotion.matches) {
      pressAnimation = menu.querySelector('svg').animate([
        { transform: 'scale(1)' },
        { transform: `scale(${getComputedStyle(menu).getPropertyValue('--settings-press-scale').trim()})`, offset: .35 },
        { transform: 'scale(1)' }
      ], { duration: 180, easing: 'ease-out' });
    }
  }
  reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) pressAnimation?.cancel(); });

  function setText(node, text) {
    if (node.textContent !== text) node.textContent = text;
  }

  function range(container, key, format, index) {
    const isDome = index !== undefined;
    const spec = api.schema[isDome ? 'domeSize' : key];
    const row = element('div', 'control');
    const heading = element('div', 'control-heading');
    const input = element('input');
    input.type = 'range';
    input.id = isDome ? `dome-size-${index}` : `setting-${key}`;
    input.min = spec.min;
    input.max = spec.max;
    input.step = spec.step;
    const label = element('label', '', isDome ? `Dome ${index + 1}` : spec.label);
    label.htmlFor = input.id;
    const mode = isDome ? element('span', 'dome-mode') : null;
    if (mode) label.append(mode);
    const output = element('output');
    output.htmlFor = input.id;
    output.setAttribute('aria-live', 'off');
    heading.append(label, output);
    row.append(heading, input);
    container.append(row);
    input.addEventListener('input', () => {
      if (isDome) {
        const sizes = api.getConfig().domeSizes;
        sizes[index] = Number(input.value);
        api.update({ domeSizes: sizes });
      } else {
        api.update({ [key]: Number(input.value) });
      }
    });
    const sync = config => {
      const base = isDome ? config.domeSizes[index] : config[key];
      const live = isDome && config.autoSize && document.activeElement !== input
        && domeState?.autoSize === true && domeState.bases[index] === base;
      const value = live ? domeState.sizes[index] : base;
      input.min = live ? 0 : spec.min;
      input.value = value;
      input.style.setProperty('--range-progress', `${(value - Number(input.min)) / (spec.max - Number(input.min)) * 100}%`);
      const formatted = format(value);
      setText(output, formatted);
      input.setAttribute('aria-valuetext', live ? `Live size ${formatted}; base ${format(base)}` : formatted);
      if (isDome) {
        setText(mode, config.autoSize ? `Base ${format(base)}${live ? ' · live' : ''}` : '');
        const hidden = index >= config.count;
        if (hidden && row.contains(document.activeElement)) {
          row.closest('details').querySelector('summary').focus();
        }
        row.hidden = hidden;
      }
    };
    bindings.push(sync);
    if (isDome) {
      domeBindings.push(sync);
      input.addEventListener('focus', () => sync(api.getConfig()));
      input.addEventListener('blur', () => sync(api.getConfig()));
    }
  }

  function checkbox(container, key, title) {
    const label = element('label', 'check-control');
    const input = element('input');
    input.type = 'checkbox';
    input.id = `setting-${key}`;
    label.append(element('span', '', title), input);
    container.append(label);
    input.addEventListener('change', () => api.update({ [key]: input.checked }));
    bindings.push(config => { input.checked = config[key]; });
  }

  function select(container, key, title, values, describe) {
    const row = element('div', 'control select-control');
    const input = element('select');
    input.id = `setting-${key}`;
    const label = element('label', '', title);
    label.htmlFor = input.id;
    values.forEach(value => {
      const option = element('option', '', describe(value));
      option.value = value;
      input.append(option);
    });
    row.append(label, input);
    container.append(row);
    input.addEventListener('change', () => {
      const value = typeof values[0] === 'number' ? Number(input.value) : input.value;
      api.update({ [key]: value });
    });
    bindings.push(config => { input.value = config[key]; });
  }

  function color(container, key, title) {
    const fieldset = element('fieldset');
    const group = element('div', 'color-inputs');
    const picker = element('input');
    picker.type = 'color';
    picker.id = `setting-${key}`;
    picker.setAttribute('aria-label', `${title} color picker`);
    const label = element('label', 'hex-label', 'Hex color');
    const hex = element('input');
    hex.type = 'text';
    hex.id = `hex-${key}`;
    hex.maxLength = 7;
    hex.spellcheck = false;
    hex.autocomplete = 'off';
    hex.setAttribute('autocapitalize', 'off');
    hex.setAttribute('aria-label', `${title} hexadecimal color`);
    hex.setAttribute('aria-describedby', `error-${key}`);
    const error = element('p', 'hint color-error', 'Use # followed by six hexadecimal digits. The current color is unchanged.');
    error.id = `error-${key}`;
    error.hidden = true;
    label.htmlFor = hex.id;
    label.append(hex);
    group.append(picker, label);
    fieldset.append(element('legend', '', title), group, error);
    container.append(fieldset);
    let dirty = false;

    function clearError() {
      dirty = false;
      hex.removeAttribute('aria-invalid');
      hex.setCustomValidity('');
      error.hidden = true;
    }

    hex.addEventListener('input', () => {
      const value = hex.value.trim();
      if (/^#[0-9a-f]{6}$/i.test(value)) {
        clearError();
        api.update({ [key]: value.toLowerCase() });
      } else {
        dirty = true;
        hex.setAttribute('aria-invalid', 'true');
        hex.setCustomValidity('Enter a color in #RRGGBB format.');
        error.hidden = false;
      }
    });
    hex.addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        hex.reportValidity();
      }
    });
    picker.addEventListener('input', () => {
      clearError();
      api.update({ [key]: picker.value });
    });
    bindings.push(config => {
      picker.value = config[key];
      if (!dirty) hex.value = config[key];
    });
    colorBindings.push(clearError);
  }

  const multiplier = value => `${value.toFixed(2)}×`;
  const motion = document.getElementById('motion-controls');
  select(motion, 'mouseMode', 'Pointer interaction', api.mouseModes,
    value => ({ repel: 'Repel', attract: 'Attract', off: 'Off' })[value]);
  range(motion, 'count', String);
  ['sizeScale', 'speedScale', 'forceScale'].forEach(key => range(motion, key, multiplier));
  range(motion, 'lerpSpeed', value => value.toFixed(2));
  motion.append(element('p', 'hint', 'Lower smoothness values make changes more gradual.'));

  const domes = document.getElementById('dome-controls');
  checkbox(domes, 'autoSize', 'Auto-change dome sizes');
  const domeHelp = element('p', 'hint');
  domeHelp.id = 'dome-size-status';
  domes.append(domeHelp);
  api.defaults.domeSizes.forEach((_, index) => range(domes, 'domeSize', multiplier, index));

  function updateDomeHelp() {
    const config = api.getConfig();
    setText(domeHelp, !config.autoSize ? 'Set each dome’s base size.'
      : domeState ? `${domeState.paused ? 'Live sizes are paused.' : 'Sliders show live sizes.'} A focused slider edits its base; move focus away to resume live feedback. Global size and display fit also apply.`
        : isSettingsWindow && window.GridSettingsHost.telemetryAvailable === false
          ? 'Live size feedback is unavailable. You can still adjust each dome’s base size.'
          : 'Waiting for live sizes. You can still adjust each dome’s base size.');
  }
  function updateDomeObservation() {
    const observe = !document.hidden && !panel.hidden && nativeVisible && domes.closest('details').open && api.getConfig().autoSize;
    if (observe && !stopDomeObservation) {
      stopDomeObservation = api.subscribeDomeState(state => {
        domeState = state;
        const config = api.getConfig();
        domeBindings.slice(0, config.count).forEach(sync => sync(config));
        updateDomeHelp();
      });
      if (isSettingsWindow) window.GridSettingsHost.observeDomes(true);
    } else if (!observe && stopDomeObservation) {
      stopDomeObservation();
      stopDomeObservation = null;
      domeState = null;
      if (isSettingsWindow) window.GridSettingsHost.observeDomes(false);
    }
    updateDomeHelp();
  }

  const performance = document.getElementById('performance-controls');
  checkbox(performance, 'snapshot', 'Freeze frame');
  select(performance, 'fpsLimit', 'Frame rate', api.fpsOptions, value => `${value} fps`);

  const appearance = document.getElementById('appearance-controls');
  checkbox(appearance, 'autoColor', 'Auto-change line color');
  checkbox(appearance, 'gradientLines', 'Grid ripple');
  checkbox(appearance, 'vignette', 'Vignette');
  range(appearance, 'cellSize', value => `${value} px`);
  range(appearance, 'lineOpacity', value => `${Math.round(value * 100)}%`);
  color(appearance, 'bgColor', 'Background');
  color(appearance, 'lineColor', 'Grid lines');
  appearance.append(element('p', 'hint', 'Turn off auto-change line color to use your selected line color.'));

  api.presets.forEach(preset => {
    const button = element('button', 'preset');
    button.type = 'button';
    const swatch = element('span', 'preset-swatch');
    swatch.style.background = preset.bgColor;
    swatch.style.color = preset.lineColor;
    swatch.setAttribute('aria-hidden', 'true');
    button.append(swatch, element('span', '', preset.name));
    button.addEventListener('click', () => {
      colorBindings.forEach(clearError => clearError());
      const { name, ...patch } = preset;
      api.update({ ...patch, autoColor: false });
      setText(status, `${name} preset applied.`);
    });
    bindings.push(config => {
      const selected = !config.autoColor && Object.entries(preset).every(([key, value]) => key === 'name' || config[key] === value);
      button.setAttribute('aria-pressed', String(selected));
    });
    document.getElementById('preset-grid').append(button);
  });

  document.getElementById('randomize').addEventListener('click', () => {
    api.randomize();
    setText(status, 'Motion and grid spacing randomized.');
  });
  document.getElementById('reset').addEventListener('click', () => {
    colorBindings.forEach(clearError => clearError());
    api.reset();
    setText(status, 'All settings reset to defaults.');
  });

  function canOpenSettingsWindow() {
    return !isSettingsWindow && api.hostManaged && Boolean(window.chrome?.webview);
  }

  function render() {
    const config = api.getConfig();
    bindings.forEach(sync => sync(config));
    if (!isSettingsWindow) {
      const message = api.hostManaged
        ? 'For settings that survive a restart, use Lively > Customize wallpaper. Changes here are a preview.'
        : api.storageAvailable
          ? 'Settings save in this browser on this device.'
          : 'Browser storage is unavailable. Settings last until this page closes.';
      setText(document.getElementById('save-status'), message);
      if (canOpenSettingsWindow() && !panel.hidden) closePanel(false);
    }
    syncMenuAction();
    if (layoutHostManaged !== api.hostManaged) {
      layoutHostManaged = api.hostManaged;
      refreshLayout();
    }
    updateDomeObservation();
  }

  function syncMenuAction() {
    menu.hidden = canOpenSettingsWindow();
    if (canOpenSettingsWindow()) {
      menu.setAttribute('aria-label', 'Open grid settings');
      menu.title = 'Settings · drag to move';
      menu.removeAttribute('aria-expanded');
      menu.removeAttribute('aria-controls');
    } else {
      menu.setAttribute('aria-label', panel.hidden ? 'Open grid settings' : 'Close grid settings');
      menu.title = 'Settings · drag to move';
      menu.setAttribute('aria-expanded', String(!panel.hidden));
      menu.setAttribute('aria-controls', panel.id);
    }
  }

  function availableBounds() {
    const viewport = window.visualViewport;
    const bounds = {
      left: Math.max(0, viewport?.offsetLeft || 0),
      top: Math.max(0, viewport?.offsetTop || 0),
      right: window.innerWidth,
      bottom: window.innerHeight
    };
    if (viewport) {
      bounds.right = Math.min(bounds.right, bounds.left + viewport.width);
      bounds.bottom = Math.min(bounds.bottom, bounds.top + viewport.height);
    }
    if (!api.hostManaged) return bounds;

    const screen = window.screen;
    const scaleX = window.outerWidth > 0 ? window.innerWidth / window.outerWidth : 1;
    const scaleY = window.outerHeight > 0 ? window.innerHeight / window.outerHeight : 1;
    // Borderless host coordinates and the screen work area share screen CSS pixels.
    // Convert to content pixels; monitor origins may be negative and page scale may differ.
    const work = {
      left: (screen.availLeft - window.screenX) * scaleX,
      top: (screen.availTop - window.screenY) * scaleY,
      right: (screen.availLeft + screen.availWidth - window.screenX) * scaleX,
      bottom: (screen.availTop + screen.availHeight - window.screenY) * scaleY
    };
    const intersect = {
      left: Math.max(bounds.left, work.left),
      top: Math.max(bounds.top, work.top),
      right: Math.min(bounds.right, work.right),
      bottom: Math.min(bounds.bottom, work.bottom)
    };
    if (Object.values(intersect).every(Number.isFinite)
      && intersect.right - intersect.left >= Math.min(240, bounds.right - bounds.left)
      && intersect.bottom - intersect.top >= Math.min(192, bounds.bottom - bounds.top)) return intersect;

    // Some embedded players omit window origins. Reserve unavailable screen extents
    // at both edges rather than mistake a different monitor's origin for usable space.
    const reserve = (total, available, size) => Number.isFinite(total) && total > 0
      && Number.isFinite(available) && available > 0 && available <= total
      ? Math.min(size / 4, (total - available) * size / total) : 0;
    const horizontal = reserve(screen.width, screen.availWidth, window.innerWidth);
    const vertical = reserve(screen.height, screen.availHeight, window.innerHeight);
    return {
      left: bounds.left + horizontal, top: bounds.top + vertical,
      right: bounds.right - horizontal, bottom: bounds.bottom - vertical
    };
  }

  function placePanel() {
    if (isSettingsWindow) return;
    const button = menu.getBoundingClientRect();
    const bounds = availableBounds();
    panel.style.maxWidth = `${Math.max(48, bounds.right - bounds.left - edgeGap * 2)}px`;
    panel.style.maxHeight = `${Math.max(48, bounds.bottom - bounds.top - edgeGap * 2)}px`;
    const minLeft = bounds.left + edgeGap, minTop = bounds.top + edgeGap;
    const maxLeft = Math.max(minLeft, bounds.right - edgeGap - panel.offsetWidth);
    const maxTop = Math.max(minTop, bounds.bottom - edgeGap - panel.offsetHeight);
    panel.style.right = 'auto';
    panel.style.left = `${Math.max(minLeft, Math.min(maxLeft, button.left + button.width / 2 - panel.offsetWidth))}px`;
    panel.style.top = `${Math.max(minTop, Math.min(maxTop, button.top + button.height / 2))}px`;
  }

  function closePanel(restoreFocus = true) {
    if (isSettingsWindow) {
      window.GridSettingsHost.close();
      return;
    }
    if (panel.hidden) return;
    if (restoreFocus || panel.contains(document.activeElement)) menu.focus();
    panel.hidden = true;
    panel.inert = true;
    updateDomeObservation();
    contentAnimations.forEach(animation => animation.cancel());
    contentAnimations.clear();
    syncMenuAction();
    pressFeedback();
  }

  function openPanel() {
    render();
    panel.hidden = false;
    panel.inert = false;
    refreshLayout();
    syncMenuAction();
    pressFeedback();
    closeButton.focus();
    updateDomeObservation();
    if (!isSettingsWindow) revealPanelContent();
  }

  function revealPanelContent() {
    contentAnimations.forEach(animation => animation.cancel());
    contentAnimations.clear();
    if (reducedMotion.matches) return;
    // Animate content only: the native window, border and input availability stay immediate.
    for (const node of panel.children) {
      const animation = node.animate([
        { opacity: .92, transform: 'translateY(2px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ], { duration: 110, easing: 'ease-out' });
      contentAnimations.add(animation);
      animation.finished.catch(() => {}).finally(() => contentAnimations.delete(animation));
    }
  }
  window.addEventListener('grid-settings-shown', () => {
    nativeVisible = true;
    updateDomeObservation();
    revealPanelContent();
  });
  window.addEventListener('grid-settings-hidden', () => {
    nativeVisible = false;
    updateDomeObservation();
    contentAnimations.forEach(animation => animation.cancel());
    contentAnimations.clear();
  });
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) {
      contentAnimations.forEach(animation => animation.cancel());
      contentAnimations.clear();
    }
  });

  let suppressClick = false;
  menu.addEventListener('click', event => {
    if (suppressClick && event.detail !== 0) {
      suppressClick = false;
      return;
    }
    suppressClick = false;
    if (canOpenSettingsWindow()) return;
    if (panel.hidden) openPanel();
    else closePanel();
  });
  closeButton.addEventListener('click', () => closePanel());
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden) {
      event.preventDefault();
      closePanel();
    }
  });
  document.addEventListener('pointerdown', event => {
    if (!isSettingsWindow && !panel.hidden && !panel.contains(event.target) && !menu.contains(event.target)) closePanel(false);
  });

  function syncExpandButton() {
    setText(expandButton, sections.every(section => section.open) ? 'Collapse all sections' : 'Expand all sections');
  }
  expandButton.addEventListener('click', () => {
    const open = !sections.every(section => section.open);
    sections.forEach(section => { section.open = open; });
    syncExpandButton();
  });
  sections.forEach(section => section.addEventListener('toggle', () => {
    syncExpandButton();
    if (!panel.hidden) placePanel();
    updateDomeObservation();
  }));

  let drag = null;
  function moveMenu(left, top) {
    const bounds = availableBounds();
    const minLeft = bounds.left + edgeGap, minTop = bounds.top + edgeGap;
    const maxLeft = Math.max(minLeft, bounds.right - menu.offsetWidth - edgeGap);
    const maxTop = Math.max(minTop, bounds.bottom - menu.offsetHeight - edgeGap);
    menu.style.left = `${Math.max(minLeft, Math.min(maxLeft, left))}px`;
    menu.style.top = `${Math.max(minTop, Math.min(maxTop, top))}px`;
    menu.style.right = 'auto';
    if (!panel.hidden) placePanel();
  }
  menu.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0 || canOpenSettingsWindow()) return;
    event.preventDefault();
    menu.focus({ preventScroll: true });
    suppressClick = false;
    const bounds = menu.getBoundingClientRect();
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, left: bounds.left, top: bounds.top, moved: false };
    try { menu.setPointerCapture(event.pointerId); } catch { /* Window listeners handle uncaptured input. */ }
  });
  window.addEventListener('pointermove', event => {
    if (!drag || event.pointerId !== drag.id) return;
    if (event.pointerType === 'mouse' && !(event.buttons & 1)) { finishDrag(event, false); return; }
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) < 6) return;
    if (!drag.moved) {
      drag.moved = true;
      menu.classList.add('dragging');
    }
    moveMenu(drag.left + dx, drag.top + dy);
  });
  function finishDrag(event, snap = true) {
    if (!drag || (event && event.pointerId !== drag.id)) return;
    const pointerId = drag.id;
    suppressClick = drag.moved;
    if (drag.moved && snap) {
      const button = menu.getBoundingClientRect();
      const bounds = availableBounds();
      const leftSide = button.left + button.width / 2 < (bounds.left + bounds.right) / 2;
      moveMenu(leftSide ? bounds.left + edgeGap : bounds.right - button.width - edgeGap, button.top);
    }
    drag = null;
    menu.classList.remove('dragging');
    try { if (menu.hasPointerCapture(pointerId)) menu.releasePointerCapture(pointerId); } catch { /* Capture may already have ended in the host. */ }
  }
  window.addEventListener('pointerup', event => finishDrag(event));
  window.addEventListener('pointercancel', event => finishDrag(event, false));
  menu.addEventListener('lostpointercapture', event => finishDrag(event, false));
  window.addEventListener('pointerout', event => { if (!event.relatedTarget) finishDrag(event, false); });
  window.addEventListener('blur', () => finishDrag(null, false));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) finishDrag(null, false);
    updateDomeObservation();
  });
  function refreshLayout() {
    if (isSettingsWindow || canOpenSettingsWindow()) return;
    const bounds = menu.getBoundingClientRect();
    moveMenu(bounds.left, bounds.top);
    if (!panel.hidden) placePanel();
  }
  window.addEventListener('resize', refreshLayout);
  window.addEventListener('focus', refreshLayout);
  window.visualViewport?.addEventListener('resize', refreshLayout);
  window.visualViewport?.addEventListener('scroll', refreshLayout);
  window.screen.addEventListener?.('change', refreshLayout);

  api.subscribe(render);
  render();
  if (isSettingsWindow) openPanel();
  else refreshLayout();
})();
