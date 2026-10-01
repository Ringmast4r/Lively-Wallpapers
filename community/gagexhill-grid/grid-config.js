/* Shared runtime defaults and native Lively property generation. No build is needed to run. */
(function (root) {
  'use strict';
  const schema = {
    count: { label: 'Dome count', min: 1, max: 10, step: 1 },
    sizeScale: { label: 'Global size', min: 0.2, max: 3, step: 0.05 },
    speedScale: { label: 'Speed', min: 0, max: 4, step: 0.05 },
    forceScale: { label: 'Displacement', min: 0, max: 3, step: 0.05 },
    lerpSpeed: { label: 'Smoothness', min: 0.01, max: 0.3, step: 0.01 },
    cellSize: { label: 'Grid size', min: 10, max: 60, step: 1 },
    lineOpacity: { label: 'Line opacity', min: 0.01, max: 1, step: 0.01 },
    domeSize: { label: 'Dome size', min: 0.1, max: 3, step: 0.01 }
  };
  const defaults = {
    count: 5, sizeScale: 1, speedScale: 1, forceScale: 1, lerpSpeed: 0.06,
    cellSize: 14, bgColor: '#1b1b17', lineColor: '#fffff2', lineOpacity: 0.05,
    autoColor: false, mouseMode: 'repel', autoSize: false, vignette: true,
    snapshot: false, fpsLimit: 30, gradientLines: false,
    domeSizes: [1, 0.42, 1.7, 0.28, 0.9, 1.3, 0.38, 0.65, 2.1, 0.22]
  };
  const presets = [
    { name: 'Dusk', bgColor: '#2a1f1f', lineColor: '#e8b89a', lineOpacity: 0.07, cellSize: 18, count: 4, sizeScale: 1.1, speedScale: 0.6, forceScale: 1.2, vignette: true },
    { name: 'Slate', bgColor: '#1a1f2e', lineColor: '#b8c4e8', lineOpacity: 0.06, cellSize: 16, count: 5, sizeScale: 1, speedScale: 0.9, forceScale: 0.9, vignette: false },
    { name: 'Sage', bgColor: '#1a2420', lineColor: '#9ecdb8', lineOpacity: 0.06, cellSize: 20, count: 4, sizeScale: 1.2, speedScale: 0.5, forceScale: 0.8, vignette: false },
    { name: 'Ash', bgColor: '#1c1c1a', lineColor: '#e8e8d8', lineOpacity: 0.04, cellSize: 12, count: 5, sizeScale: 0.9, speedScale: 1, forceScale: 1, vignette: false },
    { name: 'Plum', bgColor: '#1e1525', lineColor: '#d4a8c8', lineOpacity: 0.07, cellSize: 18, count: 5, sizeScale: 1.2, speedScale: 0.5, forceScale: 1.4, vignette: true },
    { name: 'Sand', bgColor: '#221e15', lineColor: '#d4c08a', lineOpacity: 0.07, cellSize: 16, count: 4, sizeScale: 1, speedScale: 0.8, forceScale: 1.1, vignette: false },
    { name: 'Frost', bgColor: '#151a20', lineColor: '#c0d8e8', lineOpacity: 0.06, cellSize: 12, count: 6, sizeScale: 0.9, speedScale: 1.4, forceScale: 0.8, vignette: false },
    { name: 'Ember', bgColor: '#1a1510', lineColor: '#d4784a', lineOpacity: 0.08, cellSize: 18, count: 5, sizeScale: 1.1, speedScale: 0.5, forceScale: 1.6, vignette: true }
  ];
  function freeze(value) {
    Object.values(value).forEach(item => { if (item && typeof item === 'object') freeze(item); });
    return Object.freeze(value);
  }
  const hostSettings = { settingsUri: 'grid-wallpaper-settings:' };
  const domePulse = { min: 0.55, max: 1 };
  const config = freeze({ schema, defaults, presets, hostSettings, domePulse, fpsOptions: [15, 24, 30, 60], mouseModes: ['repel', 'attract', 'off'] });
  if (typeof module !== 'undefined' && module.exports) module.exports = config;
  else root.GridConfig = config;
})(typeof window === 'undefined' ? globalThis : window);
