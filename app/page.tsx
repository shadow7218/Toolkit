"use client";

import React, { useState, useRef, ChangeEvent, MouseEvent, TouchEvent } from "react";
import {
  Moon,
  Sun,
  Copy,
  Check,
  Droplet,
  ChevronRight,
  LayoutGrid,
  Pipette,
  Image as ImageIcon,
  Upload,
} from "lucide-react";

// Convert hex to rgb
function hexToRgb(hex: string) {
  let c = hex.replace("#", "");
  if (c.length === 3) {
    c = c.split("").map((x) => x + x).join("");
  }
  const num = parseInt(c, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

// Convert rgb to hex
function rgbToHex(r: number, g: number, b: number): string {
  const h = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`.toLowerCase();
}

// Generate exactly 12 harmonious shades from light to dark
function generate12Shades(hex: string): string[] {
  const rgb = hexToRgb(hex);
  const shades: string[] = [];
  const total = 12;

  // 1 to 3: very light tint steps
  for (let i = 0; i < 3; i++) {
    const factor = (3 - i) * 0.28;
    const r = rgb.r + (255 - rgb.r) * factor;
    const g = rgb.g + (255 - rgb.g) * factor;
    const b = rgb.b + (255 - rgb.b) * factor;
    shades.push(rgbToHex(r, g, b));
  }

  // 4 to 8: mid saturation shades around the base
  for (let i = 0; i < 5; i++) {
    const factor = (2 - i) * 0.15;
    let r = rgb.r, g = rgb.g, b = rgb.b;
    if (factor > 0) {
      r = rgb.r + (255 - rgb.r) * factor;
      g = rgb.g + (255 - rgb.g) * factor;
      b = rgb.b + (255 - rgb.b) * factor;
    } else {
      r = rgb.r * (1 + factor * 0.7);
      g = rgb.g * (1 + factor * 0.7);
      b = rgb.b * (1 + factor * 0.7);
    }
    shades.push(rgbToHex(r, g, b));
  }

  // 9 to 12: deep dark shades
  for (let i = 1; i <= 4; i++) {
    const factor = Math.max(0.08, 0.65 - i * 0.14);
    const r = rgb.r * factor;
    const g = rgb.g * factor;
    const b = rgb.b * factor;
    shades.push(rgbToHex(r, g, b));
  }

  return shades;
}

export default function ToolkitApp() {
  const [isDark, setIsDark] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"shades" | "picker" | "image">("shades");
  
  // Base primary color
  const [primaryColor, setPrimaryColor] = useState<string>("#0087ff");
  // Active selected swatch
  const [selectedShadeIndex, setSelectedShadeIndex] = useState<number>(0);
  
  // Feedback indicator
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);

  // Image Eyedropper states
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const shades = generate12Shades(primaryColor);
  const activeColor = shades[selectedShadeIndex] || primaryColor;
  const activeRgb = hexToRgb(activeColor);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLabel(label);
    setTimeout(() => setCopiedLabel(null), 1500);
  };

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    document.documentElement.classList.toggle("dark", nextDark);
  };

  // Image processing
  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const src = event.target?.result as string;
        setImageSrc(src);
        setTimeout(() => {
          const canvas = canvasRef.current;
          if (!canvas) return;
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          if (!ctx) return;
          const img = new Image();
          img.src = src;
          img.onload = () => {
            const maxW = 600;
            const ratio = Math.min(1, maxW / img.naturalWidth);
            canvas.width = img.naturalWidth * ratio;
            canvas.height = img.naturalHeight * ratio;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          };
        }, 80);
      };
      reader.readAsDataURL(file);
    }
  };

  const sampleCanvasPixel = (clientX: number, clientY: number) => {
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
    setPrimaryColor(hex);
    setSelectedShadeIndex(0);
  };

  return (
    <div className="min-h-screen bg-[#040914] text-white flex justify-center pb-28 pt-4 px-4 font-sans select-none antialiased">
      <div className="w-full max-w-[420px] flex flex-col gap-5">
        
        {/* Top Header */}
        <header className="flex items-center justify-between pt-2 px-1">
          <div className="flex items-center gap-3">
            {/* Toolkit layered square icon */}
            <div className="relative w-8 h-8">
              <div className="absolute top-0 left-0 w-6 h-6 rounded-lg bg-blue-500 opacity-60" />
              <div className="absolute bottom-0 right-0 w-6 h-6 rounded-lg bg-[#0087ff] shadow-lg shadow-blue-600/40" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Toolkit</h1>
          </div>

          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            className="w-10 h-10 rounded-full bg-[#0d1626] border border-white/10 flex items-center justify-center text-slate-300 active:scale-95 transition-transform"
          >
            {isDark ? <Moon size={18} className="fill-slate-200 text-slate-200" /> : <Sun size={18} className="text-amber-400" />}
          </button>
        </header>

        {/* Big Primary Color Card */}
        <section
          className="relative w-full rounded-[32px] p-6 h-80 flex flex-col justify-between shadow-2xl transition-colors duration-300"
          style={{
            backgroundColor: activeColor,
            boxShadow: `0 20px 45px -10px ${activeColor}70`,
          }}
        >
          {/* Card Top Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/25 backdrop-blur-md">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-xs font-medium text-white/95">Primary Color</span>
            </div>

            <button
              onClick={() => handleCopy(activeColor, "card-hex")}
              className="w-10 h-10 rounded-2xl bg-black/20 hover:bg-black/30 backdrop-blur-md flex items-center justify-center text-white active:scale-90 transition-transform"
            >
              {copiedLabel === "card-hex" ? <Check size={18} className="text-emerald-300" /> : <Copy size={18} />}
            </button>
          </div>

          {/* Card Bottom Row */}
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="text-4xl sm:text-[42px] font-bold tracking-tight text-white">
                {activeColor}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-white/20 text-[11px] font-bold tracking-wider text-white uppercase backdrop-blur-sm">
                HEX
              </span>
            </div>

            <button
              onClick={() => handleCopy(`rgb(${activeRgb.r}, ${activeRgb.g}, ${activeRgb.b})`, "card-rgb")}
              className="flex items-center gap-1.5 text-sm font-medium text-white/90 hover:underline active:opacity-75"
            >
              <span>
                RGB {activeRgb.r}, {activeRgb.g}, {activeRgb.b}
              </span>
              {copiedLabel === "card-rgb" ? (
                <Check size={14} className="text-emerald-300 ml-0.5" />
              ) : (
                <Copy size={14} className="ml-0.5 opacity-80" />
              )}
            </button>
          </div>
        </section>

        {/* Main Content Area */}
        {activeTab === "shades" && (
          <section className="bg-[#0b1322] border border-white/5 rounded-[32px] p-5 shadow-xl space-y-5">
            {/* Shades Card Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-[#0087ff]/10 flex items-center justify-center text-[#0087ff]">
                  <Droplet size={20} className="fill-[#0087ff]" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight leading-tight">All Shades</h2>
                  <p className="text-xs text-slate-400">Explore different shades of this color</p>
                </div>
              </div>

              <button
                onClick={() => {
                  const rotatedIndex = (selectedShadeIndex + 1) % shades.length;
                  setSelectedShadeIndex(rotatedIndex);
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#131d31] hover:bg-[#18253e] text-xs font-semibold text-slate-300 transition-colors"
              >
                <span>More</span>
                <ChevronRight size={14} />
              </button>
            </div>

            {/* 4x3 Swatch Grid */}
            <div className="grid grid-cols-4 gap-3">
              {shades.map((hex, index) => {
                const isSelected = index === selectedShadeIndex;
                return (
                  <button
                    key={index}
                    onClick={() => setSelectedShadeIndex(index)}
                    aria-label={`Select shade ${hex}`}
                    style={{ backgroundColor: hex }}
                    className={`relative aspect-square rounded-[20px] transition-transform active:scale-95 ${
                      isSelected
                        ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-[#0b1322] scale-[1.03]"
                        : "hover:scale-[1.02]"
                    }`}
                  >
                    {/* Blue circular checkmark for selected state */}
                    {isSelected && (
                      <div className="absolute bottom-2 right-2 w-5 h-5 rounded-full bg-[#0087ff] text-white flex items-center justify-center shadow-md">
                        <Check size={12} strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Tab 2: Custom Base Color Picker */}
        {activeTab === "picker" && (
          <section className="bg-[#0b1322] border border-white/5 rounded-[32px] p-6 shadow-xl space-y-5">
            <h2 className="text-base font-bold text-white tracking-tight">Pick Any Custom Color</h2>
            <div className="flex flex-col items-center gap-4 py-4">
              <label className="relative cursor-pointer">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => {
                    setPrimaryColor(e.target.value);
                    setSelectedShadeIndex(0);
                  }}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                />
                <div
                  className="w-24 h-24 rounded-3xl border-4 border-white/20 shadow-2xl transition-transform active:scale-95"
                  style={{ backgroundColor: primaryColor }}
                />
              </label>
              <div className="text-center">
                <p className="font-mono text-xl font-bold uppercase">{primaryColor}</p>
                <p className="text-xs text-slate-400 mt-1">Tap the square to open the color palette</p>
              </div>
            </div>
          </section>
        )}

        {/* Tab 3: Eyedropper from Image */}
        {activeTab === "image" && (
          <section className="bg-[#0b1322] border border-white/5 rounded-[32px] p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">Image Color Picker</h2>
                <p className="text-xs text-slate-400">Tap anywhere on the image to sample</p>
              </div>
              {imageSrc && (
                <label className="cursor-pointer text-xs font-semibold text-blue-400 underline">
                  Change
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              )}
            </div>

            {!imageSrc ? (
              <label className="flex flex-col items-center justify-center p-10 border border-dashed border-white/10 rounded-2xl bg-[#080e1a] cursor-pointer hover:border-blue-500/40 transition">
                <Upload size={28} className="text-blue-500 mb-2" />
                <span className="text-xs font-semibold text-slate-200">Upload Image</span>
                <span className="text-[10px] text-slate-500 mt-0.5">JPG, PNG, WEBP</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            ) : (
              <div className="relative rounded-2xl overflow-hidden bg-black flex justify-center border border-white/10">
                <canvas
                  ref={canvasRef}
                  className="max-w-full h-auto cursor-crosshair touch-none"
                  onClick={(e: MouseEvent<HTMLCanvasElement>) => sampleCanvasPixel(e.clientX, e.clientY)}
                  onTouchEnd={(e: TouchEvent<HTMLCanvasElement>) => {
                    if (e.changedTouches[0]) {
                      sampleCanvasPixel(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
                    }
                  }}
                />
              </div>
            )}
          </section>
        )}
      </div>

      {/* Floating Bottom Dock Navigation */}
      <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-[400px] bg-[#0c1527]/90 backdrop-blur-2xl border border-white/10 rounded-[28px] p-2 flex items-center justify-between shadow-2xl z-50">
        
        {/* Shades Tab */}
        <button
          onClick={() => setActiveTab("shades")}
          className={`relative flex-1 py-2 flex flex-col items-center gap-1 rounded-2xl transition-all ${
            activeTab === "shades" ? "text-white" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          {activeTab === "shades" && (
            <div className="absolute inset-0 bg-blue-600/20 border border-blue-500/30 rounded-2xl -z-10" />
          )}
          <LayoutGrid size={20} className={activeTab === "shades" ? "text-[#0087ff]" : ""} />
          <span className="text-[11px] font-semibold">Shades</span>
          {activeTab === "shades" && (
            <div className="absolute -bottom-1 w-10 h-0.5 bg-[#0087ff] rounded-full shadow-[0_0_8px_#0087ff]" />
          )}
        </button>

        {/* Color Picker Tab */}
        <button
          onClick={() => setActiveTab("picker")}
          className={`relative flex-1 py-2 flex flex-col items-center gap-1 rounded-2xl transition-all ${
            activeTab === "picker" ? "text-white" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          {activeTab === "picker" && (
            <div className="absolute inset-0 bg-blue-600/20 border border-blue-500/30 rounded-2xl -z-10" />
          )}
          {/* Multi-color ring icon */}
          <div className="w-5 h-5 rounded-full border-2 border-t-amber-400 border-r-emerald-400 border-b-rose-500 border-l-blue-500" />
          <span className="text-[11px] font-semibold">Color Picker</span>
          {activeTab === "picker" && (
            <div className="absolute -bottom-1 w-10 h-0.5 bg-[#0087ff] rounded-full shadow-[0_0_8px_#0087ff]" />
          )}
        </button>

        {/* From Image Tab */}
        <button
          onClick={() => setActiveTab("image")}
          className={`relative flex-1 py-2 flex flex-col items-center gap-1 rounded-2xl transition-all ${
            activeTab === "image" ? "text-white" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          {activeTab === "image" && (
            <div className="absolute inset-0 bg-blue-600/20 border border-blue-500/30 rounded-2xl -z-10" />
          )}
          <ImageIcon size={20} className={activeTab === "image" ? "text-[#0087ff]" : ""} />
          <span className="text-[11px] font-semibold">From Image</span>
          {activeTab === "image" && (
            <div className="absolute -bottom-1 w-10 h-0.5 bg-[#0087ff] rounded-full shadow-[0_0_8px_#0087ff]" />
          )}
        </button>
      </nav>
    </div>
  );
}
