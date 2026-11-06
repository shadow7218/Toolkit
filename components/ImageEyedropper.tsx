"use client";

import { useState, useRef, ChangeEvent, MouseEvent, TouchEvent } from "react";
import { Upload, Pipette, Copy, Check } from "lucide-react";
import { rgbToHex } from "../utils/colorUtils";

interface ImageEyedropperProps {
  onPickColor: (hex: string) => void;
}

export default function ImageEyedropper({ onPickColor }: ImageEyedropperProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [hoverColor, setHoverColor] = useState<{ hex: string; rgb: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const src = event.target?.result as string;
        setImageSrc(src);
        drawCanvas(src);
      };
      reader.readAsDataURL(file);
    }
  };

  const drawCanvas = (src: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src;
    img.onload = () => {
      const maxW = 900;
      const scale = Math.min(1, maxW / img.naturalWidth);
      canvas.width = img.naturalWidth * scale;
      canvas.height = img.naturalHeight * scale;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
  };

  const sampleColor = (clientX: number, clientY: number, commit = false) => {
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
    const rgb = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;

    setHoverColor({ hex, rgb });
    if (commit) {
      onPickColor(hex);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      {!imageSrc ? (
        <label className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-3xl border-slate-300 dark:border-slate-800 glass-panel cursor-pointer hover:border-blue-500/50 transition-colors">
          <Upload size={36} className="text-blue-500 mb-3" />
          <span className="text-base font-semibold text-slate-700 dark:text-slate-200">
            Click or tap to upload an image
          </span>
          <span className="text-xs text-slate-400 mt-1">PNG, JPG, WEBP</span>
          <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
        </label>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold px-4 py-2 rounded-xl glass-panel text-slate-600 dark:text-slate-300 cursor-pointer hover:bg-white/40 dark:hover:bg-white/10 transition-colors">
              Replace Image
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Pipette size={14} /> Tap or move cursor anywhere on the picture
            </span>
          </div>

          <div className="relative rounded-3xl overflow-hidden glass-panel p-2 flex justify-center bg-black/20">
            <canvas
              ref={canvasRef}
              className="max-w-full h-auto rounded-2xl cursor-crosshair touch-none"
              onMouseMove={(e: MouseEvent<HTMLCanvasElement>) => sampleColor(e.clientX, e.clientY, false)}
              onClick={(e: MouseEvent<HTMLCanvasElement>) => sampleColor(e.clientX, e.clientY, true)}
              onTouchMove={(e: TouchEvent<HTMLCanvasElement>) => {
                if (e.touches[0]) sampleColor(e.touches[0].clientX, e.touches[0].clientY, false);
              }}
              onTouchEnd={(e: TouchEvent<HTMLCanvasElement>) => {
                if (e.changedTouches[0]) sampleColor(e.changedTouches[0].clientX, e.changedTouches[0].clientY, true);
              }}
            />
          </div>

          {/* Color Inspector Card */}
          {hoverColor && (
            <div className="p-4 rounded-3xl glass-panel flex items-center justify-between shadow-lg border border-white/20">
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-2xl shadow-inner border border-white/30"
                  style={{ backgroundColor: hoverColor.hex }}
                />
                <div>
                  <p className="font-mono text-base font-bold text-slate-900 dark:text-white uppercase">
                    {hoverColor.hex}
                  </p>
                  <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
                    {hoverColor.rgb}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleCopy(hoverColor.hex)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copied ? "Copied" : "Copy HEX"}</span>
                </button>
                <button
                  onClick={() => onPickColor(hoverColor.hex)}
                  className="px-3 py-2 rounded-xl text-xs font-medium glass-panel text-slate-700 dark:text-slate-200 hover:bg-white/30 transition"
                >
                  Use for Shades
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
