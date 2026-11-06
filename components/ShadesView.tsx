"use client";

import { useState } from "react";
import { Copy, Check, SlidersHorizontal } from "lucide-react";

interface ShadesViewProps {
  baseColor: string;
  onColorChange: (color: string) => void;
}

function hexToRgb(hex: string) {
  const c = hex.replace("#", "");
  const num = parseInt(c.length === 3 ? c.split("").map((x) => x + x).join("") : c, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function getLuminance(r: number, g: number, b: number): number {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

export default function ShadesView({ baseColor, onColorChange }: ShadesViewProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [stepCount, setStepCount] = useState<number>(11);

  const rgb = hexToRgb(baseColor);
  const shades = [];

  const mid = Math.floor(stepCount / 2);
  for (let i = 0; i < stepCount; i++) {
    let r = 0, g = 0, b = 0;
    if (i < mid) {
      const factor = (mid - i) / mid;
      r = rgb.r + (255 - rgb.r) * factor;
      g = rgb.g + (255 - rgb.g) * factor;
      b = rgb.b + (255 - rgb.b) * factor;
    } else if (i === mid) {
      r = rgb.r;
      g = rgb.g;
      b = rgb.b;
    } else {
      const factor = 1 - (i - mid) / (stepCount - 1 - mid);
      r = rgb.r * factor;
      g = rgb.g * factor;
      b = rgb.b * factor;
    }
    const hex = rgbToHex(r, g, b);
    const rgbStr = `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
    shades.push({
      hex,
      rgb: rgbStr,
      weight: (i + 1) * (1000 / (stepCount + 1)),
      lum: getLuminance(r, g, b),
    });
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 1400);
  };

  return (
    <div className="space-y-6">
      {/* Top Controller Bar */}
      <div className="p-4 rounded-2xl bg-zinc-100 dark:bg-card border border-zinc-200 dark:border-borderline flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <label className="relative flex items-center justify-center cursor-pointer">
            <input
              type="color"
              value={baseColor}
              onChange={(e) => onColorChange(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <div
              className="w-10 h-10 rounded-xl border border-white/20 shadow-sm"
              style={{ backgroundColor: baseColor }}
            />
          </label>
          <div>
            <div className="text-[10px] tracking-wider uppercase font-mono text-zinc-400">Selected Hex</div>
            <div className="font-mono font-semibold text-sm tracking-tight">{baseColor.toUpperCase()}</div>
          </div>
        </div>

        {/* Step count pills */}
        <div className="flex items-center gap-1 bg-zinc-200/60 dark:bg-zinc-900 p-1 rounded-xl border border-zinc-300/40 dark:border-white/5">
          {[7, 11, 15].map((cnt) => (
            <button
              key={cnt}
              onClick={() => setStepCount(cnt)}
              className={`px-2.5 py-1 text-xs font-mono rounded-lg transition-all ${
                stepCount === cnt
                  ? "bg-white dark:bg-zinc-800 font-bold shadow-sm text-black dark:text-white"
                  : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
              }`}
            >
              {cnt}
            </button>
          ))}
        </div>
      </div>

      {/* Vertical Sleek Shade Stack */}
      <div className="rounded-2xl overflow-hidden border border-zinc-200 dark:border-borderline divide-y divide-black/5 dark:divide-white/5">
        {shades.map((shade, i) => {
          const isLight = shade.lum > 0.55;
          const textPrimary = isLight ? "text-zinc-900" : "text-zinc-100";
          const textSecondary = isLight ? "text-zinc-600/90" : "text-zinc-400/90";

          return (
            <div
              key={i}
              style={{ backgroundColor: shade.hex }}
              className="h-16 px-4 flex items-center justify-between transition-transform active:scale-[0.99]"
            >
              <div className="flex items-baseline gap-3">
                <span className={`text-[10px] font-mono opacity-60 ${textPrimary}`}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <button
                  onClick={() => copyToClipboard(shade.hex)}
                  className={`font-mono text-sm font-semibold tracking-wide flex items-center gap-1.5 ${textPrimary}`}
                >
                  {shade.hex}
                  {copiedCode === shade.hex ? (
                    <Check size={12} className="text-emerald-400 stroke-[3]" />
                  ) : null}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyToClipboard(shade.rgb)}
                  className={`text-[11px] font-mono tracking-tight hover:underline ${textSecondary}`}
                >
                  {copiedCode === shade.rgb ? "COPIED" : shade.rgb}
                </button>
                <button
                  onClick={() => copyToClipboard(shade.hex)}
                  aria-label="Copy shade"
                  className={`p-1.5 rounded-lg bg-black/10 dark:bg-white/10 backdrop-blur-sm ${textPrimary}`}
                >
                  <Copy size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
