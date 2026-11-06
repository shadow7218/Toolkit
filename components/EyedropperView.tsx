"use client";

import { useState, useRef, ChangeEvent, MouseEvent, TouchEvent } from "react";
import { Upload, Pipette, Check, Copy } from "lucide-react";

interface EyedropperViewProps {
  onPickColor: (hex: string) => void;
}

function rgbToHex(r: number, g: number, b: number): string {
  const h = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`.toUpperCase();
}

export default function EyedropperView({ onPickColor }: EyedropperViewProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [activeHex, setActiveHex] = useState<string | null>(null);
  const [activeRgb, setActiveRgb] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      setImageSrc(src);
      loadImageToCanvas(src);
    };
    reader.readAsDataURL(file);
  };

  const loadImageToCanvas = (src: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src;
    img.onload = () => {
      const maxWidth = 800;
      const ratio = Math.min(1, maxWidth / img.naturalWidth);
      canvas.width = img.naturalWidth * ratio;
      canvas.height = img.naturalHeight * ratio;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
  };

  const pickPixel = (clientX: number, clientY: number, selectForShades = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(((clientX - rect.left) / rect.width) * canvas.width);
    const y = Math.floor(((clientY - rect.top) / rect.height) * canvas.height);

    if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) return;

    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const hex = rgbToHex(pixel[0], pixel[1], pixel[2]);
    const rgbStr = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;

    setActiveHex(hex);
    setActiveRgb(rgbStr);

    if (selectForShades) {
      onPickColor(hex);
    }
  };

  const copy = (val: string) => {
    navigator.clipboard.writeText(val);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <div className="space-y-4">
      {!imageSrc ? (
        <label className="flex flex-col items-center justify-center p-12 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-card cursor-pointer hover:border-zinc-500 transition">
          <Upload size={32} className="text-zinc-400 mb-2 stroke-[1.5]" />
          <p className="text-xs font-mono font-medium tracking-tight text-zinc-700 dark:text-zinc-300">
            Upload Image to Inspect
          </p>
          <span className="text-[10px] font-mono text-zinc-500 mt-1">Tap here to choose file</span>
          <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
        </label>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
            <span className="flex items-center gap-1">
              <Pipette size={13} /> Tap any pixel
            </span>
            <label className="cursor-pointer text-zinc-200 underline">
              Replace
              <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
            </label>
          </div>

          <div className="relative rounded-2xl overflow-hidden border border-zinc-200 dark:border-borderline bg-black flex justify-center">
            <canvas
              ref={canvasRef}
              className="max-w-full h-auto cursor-crosshair touch-none"
              onClick={(e: MouseEvent<HTMLCanvasElement>) => pickPixel(e.clientX, e.clientY, false)}
              onTouchMove={(e: TouchEvent<HTMLCanvasElement>) => {
                if (e.touches[0]) pickPixel(e.touches[0].clientX, e.touches[0].clientY, false);
              }}
              onTouchEnd={(e: TouchEvent<HTMLCanvasElement>) => {
                if (e.changedTouches[0]) pickPixel(e.changedTouches[0].clientX, e.changedTouches[0].clientY, false);
              }}
            />
          </div>

          {activeHex && (
            <div className="p-3 rounded-2xl bg-zinc-100 dark:bg-card border border-zinc-200 dark:border-borderline flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl border border-white/20 shadow"
                  style={{ backgroundColor: activeHex }}
                />
                <div>
                  <div className="font-mono text-sm font-bold tracking-tight">{activeHex}</div>
                  <div className="font-mono text-[10px] text-zinc-400">{activeRgb}</div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => copy(activeHex)}
                  className="p-2 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-xs font-mono flex items-center gap-1"
                >
                  {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                </button>
                <button
                  onClick={() => onPickColor(activeHex)}
                  className="px-3 py-2 rounded-xl bg-white text-black dark:bg-zinc-100 dark:text-black text-xs font-mono font-bold"
                >
                  Make Shades
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
