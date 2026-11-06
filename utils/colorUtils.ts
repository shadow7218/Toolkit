export interface ShadeItem {
  hex: string;
  rgb: string;
  lum: number;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleanHex = hex.replace("#", "");
  if (cleanHex.length !== 6 && cleanHex.length !== 3) return null;

  let r = 0, g = 0, b = 0;
  if (cleanHex.length === 3) {
    r = parseInt(cleanHex[0] + cleanHex[0], 16);
    g = parseInt(cleanHex[1] + cleanHex[1], 16);
    b = parseInt(cleanHex[2] + cleanHex[2], 16);
  } else {
    r = parseInt(cleanHex.substring(0, 2), 16);
    g = parseInt(cleanHex.substring(2, 4), 16);
    b = parseInt(cleanHex.substring(4, 6), 16);
  }
  return { r, g, b };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

export function getLuminance(r: number, g: number, b: number): number {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

// Generate stepped gradient from pure white to selected base, down to pitch black
export function generateShades(hex: string, steps: number = 11): ShadeItem[] {
  const rgb = hexToRgb(hex);
  if (!rgb) return [];

  const shades: ShadeItem[] = [];
  const mid = Math.floor(steps / 2);

  for (let i = 0; i < steps; i++) {
    let r = 0, g = 0, b = 0;
    if (i < mid) {
      // Lighten towards #ffffff
      const factor = (mid - i) / mid;
      r = rgb.r + (255 - rgb.r) * factor;
      g = rgb.g + (255 - rgb.g) * factor;
      b = rgb.b + (255 - rgb.b) * factor;
    } else if (i === mid) {
      r = rgb.r;
      g = rgb.g;
      b = rgb.b;
    } else {
      // Darken towards #000000
      const factor = 1 - (i - mid) / (steps - 1 - mid);
      r = rgb.r * factor;
      g = rgb.g * factor;
      b = rgb.b * factor;
    }

    const hexVal = rgbToHex(r, g, b);
    const lum = getLuminance(r, g, b);
    shades.push({
      hex: hexVal,
      rgb: `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`,
      lum,
    });
  }
  return shades;
}
