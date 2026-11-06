"use client";

import React, { useState, useRef, useEffect, ChangeEvent, MouseEvent, TouchEvent } from "react";
import {
  Moon,
  Sun,
  Copy,
  Check,
  Pin,
  Upload,
  RotateCcw,
  Sliders,
  Palette,
  Layers,
  Image as ImageIcon,
} from "lucide-react";

// --- Color Helpers ---
function hexToRgb(hex: string) {
  let c = hex.replace("#", "");
  if (c.length === 3) c = c.split("").map((x) => x + x).join("");
  const num = parseInt(c, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function rgbToHex(r: number, g: number, b: number): string {
  const h = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`.toUpperCase();
}

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h *= 60;
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToRgb(h: number, s: number, l: number) {
  s /= 100; l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return { r: Math.round(f(0) * 255), g: Math.round(f(8) * 255), b: Math.round(f(4) * 255) };
}

function getLuminance(r: number, g: number, b: number): number {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

function getColorName(h: number, s: number, l: number): string {
  if (l < 12) return "Midnight";
  if (l > 92 && s < 15) return "Pure White";
  if (s < 12) return "Slate Grey";
  if (h >= 345 || h < 15) return "Crimson";
  if (h >= 15 && h < 45) return "Amber Orange";
  if (h >= 45 && h < 70) return "Sunburst Gold";
  if (h >= 70 && h < 160) return "Emerald Green";
  if (h >= 160 && h < 190) return "Teal Cyan";
  if (h >= 190 && h < 225) return "Sky Blue";
  if (h >= 225 && h < 265) return "Indigo";
  if (h >= 265 && h < 315) return "Purple Violet";
  return "Hot Pink";
}

const standardWeights = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

function generateConnectedShades(baseHex: string) {
  const rgb = hexToRgb(baseHex);
  const { h, s } = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const lumStops = [96, 91, 82, 72, 60, 49, 40, 30, 22, 14, 8];

  return standardWeights.map((weight, i) => {
    const l = lumStops[i];
    const targetRgb = hslToRgb(h, Math.min(s, 95), l);
    const hex = rgbToHex(targetRgb.r, targetRgb.g, targetRgb.b);
    return {
      weight: `${weight}`,
      hex,
      rgb: `RGB ${targetRgb.r}, ${targetRgb.g}, ${targetRgb.b}`,
      lum: l,
    };
  });
}

export default function ToolkitModern() {
  const [activeTab, setActiveTab] = useState<"picker" | "shades" | "image">("picker");
  const [isDark, setIsDark] = useState<boolean>(true);
  const [activeHex, setActiveHex] = useState<string>("#6366F1");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Wheel & HSL controls
  const activeRgb = hexToRgb(activeHex);
  const hsl = rgbToHsl(activeRgb.r, activeRgb.g, activeRgb.b);
  const [hue, setHue] = useState<number>(hsl.h);
  const [sat, setSat] = useState<number>(hsl.s);
  const [lum, setLum] = useState<number>(hsl.l);

  // Eyedropper Magnifier
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [pickerPos, setPickerPos] = useState<{ x: number; y: number } | null>(null);
  const [magnifierData, setMagnifierData] = useState<string | null>(null);
  const [pinnedColors, setPinnedColors] = useState<string[]>(["#6366F1", "#38BDF8", "#10B981"]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wheelCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const shades = generateConnectedShades(activeHex);
  const colorName = getColorName(hue, sat, lum);
  const isLight = getLuminance(activeRgb.r, activeRgb.g, activeRgb.b) > 0.58;
  const textColor = isLight ? "#0B1120" : "#FFFFFF";
  const subTextColor = isLight ? "rgba(11,17,32,0.8)" : "rgba(255,255,255,0.75)";

  const triggerCopy = (val: string, key: string) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1400);
  };

  // Sync sliders to Hex
  const updateHsl = (newH: number, newS: number, newL: number) => {
    setHue(newH);
    setSat(newS);
    setLum(newL);
    const converted = hslToRgb(newH, newS, newL);
    setActiveHex(rgbToHex(converted.r, converted.g, converted.b));
  };

  // Render Hue Wheel
  useEffect(() => {
    const canvas = wheelCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = canvas.width;
    const center = size / 2;
    const radius = center - 6;

    ctx.clearRect(0, 0, size, size);

    for (let angle = 0; angle < 360; angle += 1) {
      const startAngle = ((angle - 1) * Math.PI) / 180;
      const endAngle = ((angle + 1) * Math.PI) / 180;
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = `hsl(${angle}, ${sat}%, ${lum}%)`;
      ctx.fill();
    }

    // Inner Cutout for Modern Ring Aesthetic
    ctx.beginPath();
    ctx.arc(center, center, radius * 0.52, 0, Math.PI * 2);
    ctx.fillStyle = "#1E293B";
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.stroke();
  }, [sat, lum]);

  // Wheel interaction
  const handleWheelPick = (e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>) => {
    const canvas = wheelCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

    const x = clientX - rect.left - rect.width / 2;
    const y = clientY - rect.top - rect.height / 2;
    let angle = Math.atan2(y, x) * (180 / Math.PI);
    if (angle < 0) angle += 360;

    updateHsl(Math.round(angle), sat, lum);
  };

  // Image upload & canvas render
  const handleImageLoad = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const src = ev.target?.result as string;
        setImageSrc(src);
        setTimeout(() => {
          const canvas = canvasRef.current;
          if (!canvas) return;
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          if (!ctx) return;
          const img = new Image();
          img.src = src;
          img.onload = () => {
            const maxWidth = 380;
            const scale = Math.min(1, maxWidth / img.naturalWidth);
            canvas.width = img.naturalWidth * scale;
            canvas.height = img.naturalHeight * scale;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            // Default picker to center
            inspectPixel(canvas.width / 2, canvas.height / 2);
          };
        }, 120);
      };
      reader.readAsDataURL(file);
    }
  };

  // Eyedropper with 4x Pixel Magnifier Bubble
  const inspectPixel = (canvasX: number, canvasY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const clampedX = Math.max(0, Math.min(canvas.width - 1, canvasX));
    const clampedY = Math.max(0, Math.min(canvas.height - 1, canvasY));

    const pixel = ctx.getImageData(clampedX, clampedY, 1, 1).data;
    const hex = rgbToHex(pixel[0], pixel[1], pixel[2]);
    setActiveHex(hex);

    const converted = rgbToHsl(pixel[0], pixel[1], pixel[2]);
    setHue(converted.h);
    setSat(converted.s);
    setLum(converted.l);

    setPickerPos({ x: clampedX, y: clampedY });

    // Render Magnifier Snapshot
    const magCanvas = document.createElement("canvas");
    magCanvas.width = 44;
    magCanvas.height = 44;
    const magCtx = magCanvas.getContext("2d");
    if (magCtx) {
      magCtx.imageSmoothingEnabled = false;
      magCtx.drawImage(
        canvas,
        clampedX - 5, clampedY - 5, 10, 10,
        0, 0, 44, 44
      );
      setMagnifierData(magCanvas.toDataURL());
    }
  };

  const onCanvasTouch = (e: TouchEvent<HTMLCanvasElement> | MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;
    inspectPixel(x, y);
  };

  return (
    <div
      style={{
        height: "100dvh",
        maxHeight: "100dvh",
        backgroundColor: "#0B1120",
        color: "#F8FAFC",
        padding: "12px 16px 86px 16px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      <div style={{ width: "100%", maxWidth: "410px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "10px", flex: 1, minHeight: 0 }}>
        
        {/* Top Header */}
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 2px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #38BDF8 0%, #6366F1 100%)",
                boxShadow: "0 0 16px rgba(56, 189, 248, 0.4)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
              }}
            />
            <h1 style={{ fontSize: "19px", fontWeight: "800", letterSpacing: "-0.4px" }}>Toolkit</h1>
          </div>

          <button
            onClick={() => setIsDark(!isDark)}
            aria-label="Toggle theme"
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              backgroundColor: "#1E293B",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {isDark ? <Moon size={16} color="#94A3B8" fill="#94A3B8" /> : <Sun size={16} color="#F59E0B" />}
          </button>
        </header>

        {/* Primary Color Preview Card (With Global 1px Stroke & Contrast Handling) */}
        <div
          style={{
            position: "relative",
            width: "100%",
            borderRadius: "16px",
            padding: "14px 18px",
            height: "142px",
            minHeight: "142px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            backgroundColor: activeHex,
            border: "1px solid rgba(255, 255, 255, 0.18)",
            boxShadow: `0 14px 28px -8px ${activeHex}90`,
            transition: "background-color 0.2s ease",
          }}
        >
          {/* Top Row: Pill Tag & Copy Icon */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "3px 10px",
                borderRadius: "9999px",
                backgroundColor: isLight ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.18)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
              }}
            >
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: isLight ? "#0284C7" : "#38BDF8" }} />
              <span style={{ fontSize: "11px", fontWeight: "600", color: textColor }}>Primary Color</span>
            </div>

            <button
              onClick={() => triggerCopy(activeHex, "primary-hex")}
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "10px",
                backgroundColor: isLight ? "rgba(0,0,0,0.08)" : "rgba(0,0,0,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: textColor,
                border: "1px solid rgba(255, 255, 255, 0.15)",
              }}
            >
              {copiedKey === "primary-hex" ? <Check size={16} color={isLight ? "#15803D" : "#4ADE80"} /> : <Copy size={15} />}
            </button>
          </div>

          {/* Bottom Row: Hex + RGB */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="mono" style={{ fontSize: "28px", fontWeight: "800", letterSpacing: "-0.5px", color: textColor }}>
                {activeHex}
              </span>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: "700",
                  padding: "2px 6px",
                  borderRadius: "5px",
                  backgroundColor: isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.15)",
                  color: textColor,
                }}
              >
                HEX
              </span>
            </div>
            <div style={{ fontSize: "11px", fontWeight: "600", color: subTextColor, marginTop: "2px" }}>
              RGB {activeRgb.r}, {activeRgb.g}, {activeRgb.b} • L {lum}%
            </div>
          </div>
        </div>

        {/* Tab 1: Vibrant Color Wheel & Sliders */}
        {activeTab === "picker" && (
          <div
            style={{
              backgroundColor: "#1E293B",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "16px",
              padding: "12px 16px",
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            {/* Color Wheel with Radial Touch */}
            <div style={{ position: "relative", width: "132px", height: "132px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <canvas
                ref={wheelCanvasRef}
                width={132}
                height={132}
                onClick={handleWheelPick}
                onTouchMove={handleWheelPick}
                style={{ borderRadius: "50%", cursor: "crosshair", touchAction: "none" }}
              />
              {/* Center Core Preview Swatch */}
              <div
                style={{
                  position: "absolute",
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  backgroundColor: activeHex,
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  boxShadow: `0 0 12px ${activeHex}80`,
                }}
              />
            </div>

            {/* Sliders Container */}
            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "11px", color: "#94A3B8" }}>
                <span>Lightness</span>
                <span className="mono">{lum}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="95"
                value={lum}
                onChange={(e) => updateHsl(hue, sat, parseInt(e.target.value))}
                style={{ width: "100%" }}
              />

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "11px", color: "#94A3B8", marginTop: "2px" }}>
                <span>Saturation</span>
                <span className="mono">{sat}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={sat}
                onChange={(e) => updateHsl(hue, parseInt(e.target.value), lum)}
                style={{ width: "100%" }}
              />
            </div>

            {/* Color Name & Hex Badge */}
            <div
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "10px",
                backgroundColor: "rgba(11, 17, 32, 0.6)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <span style={{ fontSize: "13px", fontWeight: "700" }}>{colorName}</span>
                <span style={{ fontSize: "10px", color: "#94A3B8", display: "block" }}>Dominant Family</span>
              </div>
              <span className="mono" style={{ fontSize: "12px", fontWeight: "700", color: "#38BDF8" }}>
                {activeHex}
              </span>
            </div>
          </div>
        )}

        {/* Tab 2: Connected Node Line Spectrum (Hue Style) */}
        {activeTab === "shades" && (
          <div
            style={{
              backgroundColor: "#1E293B",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "16px",
              padding: "14px 12px",
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "14px", fontWeight: "700" }}>Shades Sequence</span>
              <span
                style={{
                  fontSize: "11px",
                  padding: "2px 8px",
                  borderRadius: "9999px",
                  backgroundColor: "rgba(255, 255, 255, 0.06)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "#94A3B8",
                }}
              >
                11 Connected Nodes
              </span>
            </div>

            {/* Connecting Baseline with Circular Swatches & Pill Hex Boxes */}
            <div style={{ position: "relative", width: "100%", overflowX: "auto", padding: "16px 4px 6px 4px" }}>
              {/* Continuous horizontal connecting line */}
              <div
                style={{
                  position: "absolute",
                  top: "35px",
                  left: "12px",
                  right: "12px",
                  height: "2px",
                  backgroundColor: "rgba(255, 255, 255, 0.12)",
                  zIndex: 1,
                }}
              />

              <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", position: "relative", zIndex: 2, minWidth: "max-content" }}>
                {shades.map((s, idx) => {
                  const isSelected = s.hex.toUpperCase() === activeHex.toUpperCase();
                  return (
                    <div
                      key={idx}
                      onClick={() => setActiveHex(s.hex)}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "6px",
                        cursor: "pointer",
                      }}
                    >
                      {/* Weight Tag */}
                      <span className="mono" style={{ fontSize: "10px", color: isSelected ? "#38BDF8" : "#94A3B8", fontWeight: "600" }}>
                        {s.weight}
                      </span>

                      {/* Circular Swatch Node with 1px Safety Stroke */}
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "50%",
                          backgroundColor: s.hex,
                          border: isSelected ? "2.5px solid #38BDF8" : "1px solid rgba(255, 255, 255, 0.18)",
                          boxShadow: isSelected ? "0 0 10px #38BDF8" : "none",
                          transform: isSelected ? "scale(1.12)" : "scale(1)",
                          transition: "transform 0.15s ease",
                        }}
                      />

                      {/* Pill-shaped Hex Box */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerCopy(s.hex, `shade-${s.hex}`);
                        }}
                        className="mono"
                        style={{
                          fontSize: "10px",
                          fontWeight: "700",
                          padding: "3px 7px",
                          borderRadius: "9999px",
                          backgroundColor: isSelected ? "#38BDF8" : "rgba(11, 17, 32, 0.8)",
                          color: isSelected ? "#0B1120" : "#CBD5E1",
                          border: "1px solid rgba(255, 255, 255, 0.12)",
                          marginTop: "2px",
                        }}
                      >
                        {copiedKey === `shade-${s.hex}` ? "COPIED" : s.hex.replace("#", "")}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Shade Inspector Banner */}
            <div
              style={{
                padding: "8px 12px",
                borderRadius: "10px",
                backgroundColor: "rgba(11, 17, 32, 0.6)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: "12px",
              }}
            >
              <span style={{ color: "#94A3B8" }}>Selected Node</span>
              <span className="mono" style={{ fontWeight: "700", color: "#F8FAFC" }}>
                {activeHex} • {colorName}
              </span>
            </div>
          </div>
        )}

        {/* Tab 3: Interactive Eyedropper with Real Magnifier Bubble & Pinned Palette */}
        {activeTab === "image" && (
          <div
            style={{
              backgroundColor: "#1E293B",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "16px",
              padding: "12px 14px",
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "14px", fontWeight: "700" }}>Eyedropper Canvas</span>
              {imageSrc && (
                <label style={{ fontSize: "11px", fontWeight: "600", color: "#38BDF8", cursor: "pointer" }}>
                  Replace
                  <input type="file" accept="image/*" onChange={handleImageLoad} style={{ display: "none" }} />
                </label>
              )}
            </div>

            {!imageSrc ? (
              <label
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "24px 12px",
                  borderRadius: "12px",
                  border: "1px dashed rgba(255, 255, 255, 0.2)",
                  backgroundColor: "rgba(11, 17, 32, 0.5)",
                  cursor: "pointer",
                }}
              >
                <Upload size={24} color="#38BDF8" style={{ marginBottom: "6px" }} />
                <span style={{ fontSize: "12px", fontWeight: "600" }}>Select Image</span>
                <span style={{ fontSize: "10px", color: "#94A3B8" }}>Tap to sample pixels</span>
                <input type="file" accept="image/*" onChange={handleImageLoad} style={{ display: "none" }} />
              </label>
            ) : (
              <div
                style={{
                  position: "relative",
                  borderRadius: "12px",
                  overflow: "hidden",
                  backgroundColor: "#000000",
                  display: "flex",
                  justifyContent: "center",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                }}
              >
                <canvas
                  ref={canvasRef}
                  style={{ maxWidth: "100%", maxHeight: "140px", display: "block", touchAction: "none" }}
                  onClick={onCanvasTouch}
                  onTouchMove={onCanvasTouch}
                />

                {/* Draggable Crosshair with Magnifier Loupe Bubble */}
                {pickerPos && magnifierData && (
                  <div
                    style={{
                      position: "absolute",
                      left: `${pickerPos.x}px`,
                      top: `${pickerPos.y}px`,
                      transform: "translate(-50%, -50%)",
                      pointerEvents: "none",
                    }}
                  >
                    {/* Hovering Zoom Loupe Bubble */}
                    <div
                      style={{
                        position: "absolute",
                        bottom: "24px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: "44px",
                        height: "44px",
                        borderRadius: "50%",
                        overflow: "hidden",
                        border: "2px solid #38BDF8",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.6)",
                        backgroundColor: "#000",
                      }}
                    >
                      <img src={magnifierData} alt="loupe" style={{ width: "100%", height: "100%" }} />
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <div style={{ width: "4px", height: "4px", backgroundColor: "#EF4444", borderRadius: "50%" }} />
                      </div>
                    </div>

                    {/* Target Crosshair */}
                    <div
                      style={{
                        width: "22px",
                        height: "22px",
                        borderRadius: "50%",
                        border: "2px solid #FFFFFF",
                        boxShadow: "0 0 6px rgba(0,0,0,0.8)",
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Pinned Color Shelf (Save Multiple Colors) */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "11px", color: "#94A3B8" }}>Pinned:</span>
                <div style={{ display: "flex", gap: "6px" }}>
                  {pinnedColors.map((pin, i) => (
                    <div
                      key={i}
                      onClick={() => setActiveHex(pin)}
                      style={{
                        width: "22px",
                        height: "22px",
                        borderRadius: "50%",
                        backgroundColor: pin,
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        cursor: "pointer",
                      }}
                    />
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  if (!pinnedColors.includes(activeHex)) {
                    setPinnedColors([activeHex, ...pinnedColors.slice(0, 4)]);
                  }
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "4px 8px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(56, 189, 248, 0.15)",
                  color: "#38BDF8",
                  fontSize: "10px",
                  fontWeight: "700",
                }}
              >
                <Pin size={11} />
                <span>Pin Hex</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation Dock */}
      <nav
        style={{
          width: "100%",
          maxWidth: "400px",
          margin: "0 auto",
          backgroundColor: "#1E293B",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "24px",
          padding: "6px 8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.7)",
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => setActiveTab("picker")}
          style={{
            flex: 1,
            padding: "8px 0",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "3px",
            borderRadius: "18px",
            backgroundColor: activeTab === "picker" ? "rgba(56, 189, 248, 0.15)" : "transparent",
            color: activeTab === "picker" ? "#38BDF8" : "#94A3B8",
          }}
        >
          <Palette size={18} />
          <span style={{ fontSize: "11px", fontWeight: "600" }}>Color Picker</span>
        </button>

        <button
          onClick={() => setActiveTab("shades")}
          style={{
            flex: 1,
            padding: "8px 0",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "3px",
            borderRadius: "18px",
            backgroundColor: activeTab === "shades" ? "rgba(56, 189, 248, 0.15)" : "transparent",
            color: activeTab === "shades" ? "#38BDF8" : "#94A3B8",
          }}
        >
          <Layers size={18} />
          <span style={{ fontSize: "11px", fontWeight: "600" }}>Shades</span>
        </button>

        <button
          onClick={() => setActiveTab("image")}
          style={{
            flex: 1,
            padding: "8px 0",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "3px",
            borderRadius: "18px",
            backgroundColor: activeTab === "image" ? "rgba(56, 189, 248, 0.15)" : "transparent",
            color: activeTab === "image" ? "#38BDF8" : "#94A3B8",
          }}
        >
          <ImageIcon size={18} />
          <span style={{ fontSize: "11px", fontWeight: "600" }}>From Image</span>
        </button>
      </nav>
    </div>
  );
}
