/* Camera orbit math shared by mouse, touch, and the renderer. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.BonkCamera = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const TAU = Math.PI * 2, MIN_PITCH = .07, MAX_PITCH = 1.51;
  const wrap = angle => ((angle + Math.PI) % TAU + TAU) % TAU - Math.PI;
  function rotate(yaw, pitch, dx, dy, sensitivity = 1, invertY = false) {
    if (![yaw, pitch, dx, dy, sensitivity].every(Number.isFinite)) return { yaw, pitch };
    return {
      yaw: wrap(yaw - dx * .0035 * sensitivity),
      pitch: Math.max(MIN_PITCH, Math.min(MAX_PITCH, pitch + dy * .003 * sensitivity * (invertY ? -1 : 1)))
    };
  }
  function edgeTurn(x, width, dt, sensitivity = 1) {
    if (![x, width, dt, sensitivity].every(Number.isFinite) || width <= 0 || x < 0 || x > width) return 0;
    const band = Math.min(32, width * .06);
    const pressure = x < band ? 1 - x / band : x > width - band ? -(x - width + band) / band : 0;
    return pressure * Math.abs(pressure) * 1.65 * Math.max(0, Math.min(dt, .05)) * sensitivity;
  }
  function direction(facing, cameraYaw) {
    return ((Math.round(wrap(facing - cameraYaw) / (TAU / 8)) % 8) + 8) % 8;
  }
  return Object.freeze({ rotate, edgeTurn, direction, wrap, MIN_PITCH, MAX_PITCH });
});
