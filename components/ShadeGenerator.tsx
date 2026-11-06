"use client";

import { useState } from "react";
import { generateShades } from "../utils/colorUtils";
import { Check, Copy, Palette } from "lucide-react";

interface ShadeGeneratorProps {
  baseColor: string;
  onColorChange: (color: string) => void;
}

export default function ShadeGenerator({ baseColor, onColorChange }: ShadeGeneratorProps) {
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const shades = generateShades(baseColor, 13);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 1600);
  };

  return (
    <div className="space-y-6">
      {/* Control bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-3xl glass-panel shadow-sm">
        <div className="flex items-center gap-3">
          <label className="relative cursor-pointer flex items-center justify-center">
            <input
              type="color"
              value={baseColor}
              onChange={(e) => onColorChange(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <div
              className="w-11 h-11 rounded-2xl shadow-inner border border-white/40 ring-2 ring-black/5 dark:ring-white/10"
              style={{ backgroundColor: baseColor }}
            />
          </label>
          <div>
            <p className="text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400">
              Active Base
            </p>
            <p className="font-mono text-base font-bold text-slate-800 dark:text-white uppercase">
              {baseColor}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {["#0E2F76", "#3B82F6", "#10B981", "#EF4444", "#8B5CF6", "#F59E0B"].map((quickHex) => (
            <button
              key={quickHex}
              onClick={() => onColorChange(quickHex)}
              className="w-7 h-7 rounded-full border border-white/30 shadow transition-transform hover:scale-110 active:scale-95"
              style={{ backgroundColor: quickHex }}
              aria-label={`Select ${quickHex}`}
            />
          ))}
        </div>
      </div>

      {/* Swatches Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
        {shades.map((shade, idx) => {
          const isLight = shade.lum > 0.45;
          const textColor = isLight ? "text-slate-900" : "text-white";
          const subColor = isLight ? "text-slate-700/80" : "text-white/80";

          return (
            <div
              key={idx}
              className="group relative h-28 rounded-2xl p-3 flex flex-col justify-between shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg border border-black/5 dark:border-white/5"
              style={{ backgroundColor: shade.hex }}
            >
              <div className="flex justify-between items-start">
                <span className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-black/10 dark:bg-white/10 ${textColor}`}>
                  #{idx + 1}
                </span>

                <div className="flex gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleCopy(shade.hex)}
                    title="Copy HEX"
                    className="p-1.5 rounded-xl bg-black/15 dark:bg-white/15 hover:bg-black/30 dark:hover:bg-white/30 backdrop-blur-md transition-colors"
                  >
                    {copiedText === shade.hex ? (
                      <Check size={14} className={textColor} />
                    ) : (
                      <Copy size={14} className={textColor} />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <button
                  onClick={() => handleCopy(shade.hex)}
                  className={`text-sm font-mono font-bold tracking-tight text-left block hover:underline ${textColor}`}
                >
                  {shade.hex}
                </button>
                <button
                  onClick={() => handleCopy(shade.rgb)}
                  className={`text-[11px] font-mono block hover:underline text-left ${subColor}`}
                >
                  {shade.rgb}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
