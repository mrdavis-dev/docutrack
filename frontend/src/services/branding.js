// Derives the 10-shade brand palette (50–900) from a single admin-picked hex color,
// and injects it as CSS variables so tailwind.config.js's brand-* classes pick it up
// at runtime — no rebuild needed when the color changes.

function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return null;
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}

function rgbToHsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s;
  const l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return [h, s, l];
}

function hslToRgb([h, s, l]) {
  if (s === 0) { const v = Math.round(l * 255); return [v, v, v]; }
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [
    Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  ];
}

// Target lightness per Tailwind shade — 500/600 stay close to the input color,
// lighter shades push toward white, darker shades push toward black.
const SHADE_LIGHTNESS = {
  50: 0.97, 100: 0.93, 200: 0.85, 300: 0.74, 400: 0.63,
  500: 0.53, 600: 0.45, 700: 0.37, 800: 0.29, 900: 0.22,
};

export function paletteFromHex(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const [h, s] = rgbToHsl(rgb);
  const palette = {};
  for (const [shade, lightness] of Object.entries(SHADE_LIGHTNESS)) {
    // Keep saturation from the source color but soften it at the lightness extremes,
    // same way most "single seed color -> palette" generators do — otherwise 50/900
    // come out either washed-out grey or neon.
    const satAdj = s * (1 - Math.abs(lightness - 0.53) * 0.5);
    palette[shade] = hslToRgb([h, satAdj, lightness]).join(" ");
  }
  return palette;
}

export function applyBrandColor(hex) {
  const palette = paletteFromHex(hex);
  if (!palette) return;
  const root = document.documentElement.style;
  for (const [shade, rgbTriplet] of Object.entries(palette)) {
    root.setProperty(`--brand-${shade}`, rgbTriplet);
  }
}
