// ─── HSV ↔ RGB ────────────────────────────────────────────────────────────────

export function hsvToRgb(h, s, v) {
  const hh = (h / 60) % 6;
  const f = h / 60 - Math.floor(h / 60);
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  let r, g, b;
  switch (Math.floor(hh)) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    default: r = v; g = p; b = q;
  }
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

export function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;

  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }
  return { h, s: max === 0 ? 0 : d / max, v: max };
}

export function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
}

export function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 255, g: 255, b: 255 };
}

// ─── Color Temperature → RGB ──────────────────────────────────────────────────
// Converts Kelvin (1000–40000K) to an approximate RGB for display

export function kelvinToRgb(kelvin) {
  const t = kelvin / 100;
  let r, g, b;

  if (t <= 66) {
    r = 255;
    g = Math.min(255, Math.max(0, 99.4708025861 * Math.log(t) - 161.1195681661));
    b = t <= 19 ? 0 : Math.min(255, Math.max(0, 138.5177312231 * Math.log(t - 10) - 305.0447927307));
  } else {
    r = Math.min(255, Math.max(0, 329.698727446 * Math.pow(t - 60, -0.1332047592)));
    g = Math.min(255, Math.max(0, 288.1221695283 * Math.pow(t - 60, -0.0755148492)));
    b = 255;
  }

  return { r: Math.round(r), g: Math.round(g), b: Math.round(b) };
}

export function kelvinToHex(kelvin) {
  const { r, g, b } = kelvinToRgb(kelvin);
  return rgbToHex(r, g, b);
}

// ─── WiZ Color Temp Range ─────────────────────────────────────────────────────
export const TEMP_MIN = 2200;
export const TEMP_MAX = 6500;

export function tempToLabel(k) {
  if (k <= 2700) return 'Warm';
  if (k <= 3500) return 'Soft White';
  if (k <= 4500) return 'Neutral';
  if (k <= 5500) return 'Cool White';
  return 'Daylight';
}
