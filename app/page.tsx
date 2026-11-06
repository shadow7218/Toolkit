"use client";

import React, { useState, useRef, useEffect, ChangeEvent, MouseEvent, TouchEvent } from "react";
import {
  Moon,
  Sun,
  Copy,
  Check,
  LayoutGrid,
  Image as ImageIcon,
  Upload,
  Pin,
  Sparkles,
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
  if (l < 10) return "Midnight";
  if (l > 92 && s < 12) return "Pure White";
  if (s < 12) return "Slate Grey";
  if (h >= 345 || h < 15) return "Crimson";
  if (h >= 15 && h < 45) return "Amber Orange";
  if (h >= 45 && h < 70) return "Sunburst Gold";
  if (h >= 70 && h < 160) return "Emerald Green";
  if (h >= 160 && h < 190) return "Teal Cyan";
  if (h >= 190 && h < 225) return "Sky Blue";
  if (h >= 225 && h < 265) return "Indigo";
  if (h >= 265 && h < 315) return "Purple Violet";
  return "Rose Pink";
}

const standardWeights = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const standardLuminances = [96, 91, 82, 72, 60, 49, 40, 30, 22, 14, 8];

export default function ToolkitApp() {
  const [activeTab, setActiveTab] = useState<"shades" | "picker" | "image">("shades");
  const [isDark, setIsDark] = useState<boolean>(true);
  const [activeHex, setActiveHex] = useState<string>("#A5CDFD");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showAllShades, setShowAllShades] = useState<boolean>(false);

  // Wheel values
  const activeRgb = hexToRgb(activeHex);
  const hsl = rgbToHsl(activeRgb.r, activeRgb.g, activeRgb.b);
  const [hue, setHue] = useState<number>(hsl.h);
  const [sat, setSat] = useState<number>(hsl.s);
  const [lum, setLum] = useState<number>(hsl.l);

  // Eyedropper Magnifier
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [pickerPos, setPickerPos] = useState<{ x: number; y: number } | null>(null);
  const [magnifierData, setMagnifierData] = useState<string | null>(null);
  const [pinnedColors, setPinnedColors] = useState<string[]>(["#A5CDFD", "#0087FF", "#10B981"]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wheelCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Generate sequence
  const fullShades = standardWeights.map((weight, i) => {
    const l = standardLuminances[i];
    const targetRgb = hslToRgb(hue, Math.min(sat, 95), l);
    const hex = rgbToHex(targetRgb.r, targetRgb.g, targetRgb.b);
    return {
      weight: `${weight}`,
      hex,
      rgb: `RGB ${targetRgb.r}, ${targetRgb.g}, ${targetRgb.b}`,
      lum: l,
    };
  });

  const displayedShades = showAllShades
    ? fullShades
    : fullShades.filter((s) => s.weight !== "950");

  const colorName = getColorName(hue, sat, lum);
  const isLight = getLuminance(activeRgb.r, activeRgb.g, activeRgb.b) > 0.58;
  const textColor = isLight ? "#0B1120" : "#FFFFFF";
  const subTextColor = isLight ? "rgba(11,17,32,0.8)" : "rgba(255,255,255,0.75)";

  const triggerCopy = (val: string, key: string) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1400);
  };

  const updateHsl = (newH: number, newS: number, newL: number) => {
    setHue(newH);
    setSat(newS);
    setLum(newL);
    const converted = hslToRgb(newH, newS, newL);
    setActiveHex(rgbToHex(converted.r, converted.g, converted.b));
  };

  // Draw Circular Color Wheel
  useEffect(() => {
    const canvas = wheelCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = canvas.width;
    const center = size / 2;
    const radius = center - 4;

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

    ctx.beginPath();
    ctx.arc(center, center, radius * 0.55, 0, Math.PI * 2);
    ctx.fillStyle = isDark ? "#1E293B" : "#FFFFFF";
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.stroke();
  }, [sat, lum, isDark]);

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
            inspectPixel(canvas.width / 2, canvas.height / 2);
          };
        }, 120);
      };
      reader.readAsDataURL(file);
    }
  };

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

    const magCanvas = document.createElement("canvas");
    magCanvas.width = 44;
    magCanvas.height = 44;
    const magCtx = magCanvas.getContext("2d");
    if (magCtx) {
      magCtx.imageSmoothingEnabled = false;
      magCtx.drawImage(canvas, clampedX - 5, clampedY - 5, 10, 10, 0, 0, 44, 44);
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
        minHeight: "100dvh",
        backgroundColor: isDark ? "#0B1120" : "#F8FAFC",
        color: isDark ? "#F8FAFC" : "#0F172A",
        padding: "12px 16px 82px 16px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxSizing: "border-box",
      }}
    >
      <div style={{ width: "100%", maxWidth: "420px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "10px" }}>
        
        {/* Top Header */}
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 2px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #0087FF 0%, #38BDF8 100%)",
                boxShadow: "0 0 16px rgba(0, 135, 255, 0.4)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
              }}
            />
            <h1 style={{ fontSize: "19px", fontWeight: "800", letterSpacing: "-0.4px" }}>Toolkit</h1>
          </div>

          <button
            onClick={() => setIsDark(!isDark)}
            aria-label="Toggle Theme"
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {isDark ? <Moon size={16} color="#CBD5E1" fill="#CBD5E1" /> : <Sun size={16} color="#F59E0B" />}
          </button>
        </header>

        {/* Primary Color Preview Card */}
        <div
          style={{
            position: "relative",
            width: "100%",
            borderRadius: "18px",
            padding: "14px 18px",
            height: "140px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            backgroundColor: activeHex,
            border: "1px solid rgba(255, 255, 255, 0.18)",
            boxShadow: `0 14px 28px -8px ${activeHex}90`,
            transition: "background-color 0.2s ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "3px 10px",
                borderRadius: "9999px",
                backgroundColor: isLight ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.18)",
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

        {/* Tab 1: COMPACT FIT SHADES BOX (Expands smoothly on Show All) */}
        {activeTab === "shades" && (
          <div
            style={{
              backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "18px",
              padding: "12px 14px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              transition: "all 0.25s ease-out",
            }}
          >
            {/* Header with Dynamic Expand/Shrink Button */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <span style={{ fontSize: "14px", fontWeight: "700" }}>Shades Sequence</span>
                <span style={{ fontSize: "11px", color: "#94A3B8", display: "block" }}>
                  {showAllShades ? "11 Steps • Full Spectrum" : "Standard 50 → 900"}
                </span>
              </div>

              <button
                onClick={() => setShowAllShades(!showAllShades)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "4px 10px",
                  borderRadius: "9999px",
                  backgroundColor: showAllShades ? "#0087FF" : "rgba(255, 255, 255, 0.08)",
                  color: showAllShades ? "#FFFFFF" : "#94A3B8",
                  fontSize: "10px",
                  fontWeight: "700",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                }}
              >
                <Sparkles size={11} />
                <span>{showAllShades ? "Collapse" : "Show All"}</span>
              </button>
            </div>

            {/* Tight Swatches Container with Zero Empty Space */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: "8px 6px",
                width: "100%",
                alignItems: "center",
                justifyItems: "center",
                padding: "4px 0",
              }}
            >
              {displayedShades.map((s, idx) => {
                const isSelected = s.hex.toUpperCase() === activeHex.toUpperCase();
                return (
                  <div
                    key={idx}
                    onClick={() => setActiveHex(s.hex)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "3px",
                      cursor: "pointer",
                      width: "100%",
                    }}
                  >
                    <span className="mono" style={{ fontSize: "9px", color: isSelected ? "#38BDF8" : "#94A3B8", fontWeight: "600" }}>
                      {s.weight}
                    </span>

                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        backgroundColor: s.hex,
                        border: isSelected ? "2.5px solid #0087FF" : "1px solid rgba(255, 255, 255, 0.18)",
                        boxShadow: isSelected ? "0 0 10px #0087FF" : "none",
                        transform: isSelected ? "scale(1.1)" : "scale(1)",
                        transition: "transform 0.15s ease",
                      }}
                    />

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerCopy(s.hex, `shade-${s.hex}`);
                      }}
                      className="mono"
                      style={{
                        fontSize: "9px",
                        fontWeight: "700",
                        padding: "2px 4px",
                        borderRadius: "9999px",
                        backgroundColor: isSelected ? "#0087FF" : "rgba(11, 17, 32, 0.8)",
                        color: isSelected ? "#FFFFFF" : "#CBD5E1",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        width: "100%",
                        maxWidth: "52px",
                        textAlign: "center",
                      }}
                    >
                      {copiedKey === `shade-${s.hex}` ? "✓" : s.hex.replace("#", "")}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Tight Inspector Footer */}
            <div
              style={{
                padding: "6px 12px",
                borderRadius: "10px",
                backgroundColor: "rgba(11, 17, 32, 0.6)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: "11px",
              }}
            >
              <span style={{ color: "#94A3B8" }}>Selected Node</span>
              <span className="mono" style={{ fontWeight: "700", color: "#F8FAFC" }}>
                {activeHex} • {colorName}
              </span>
            </div>
          </div>
        )}

        {/* Tab 2: Color Wheel */}
        {activeTab === "picker" && (
          <div
            style={{
              backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "18px",
              padding: "14px 16px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              alignItems: "center",
            }}
          >
            <div style={{ position: "relative", width: "136px", height: "136px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <canvas
                ref={wheelCanvasRef}
                width={136}
                height={136}
                onClick={handleWheelPick}
                onTouchMove={handleWheelPick}
                style={{ borderRadius: "50%", cursor: "crosshair", touchAction: "none" }}
              />
              <div
                style={{
                  position: "absolute",
                  width: "46px",
                  height: "46px",
                  borderRadius: "50%",
                  backgroundColor: activeHex,
                  border: "2px solid rgba(255, 255, 255, 0.4)",
                  boxShadow: `0 0 14px ${activeHex}80`,
                }}
              />
            </div>

            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "6px" }}>
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

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "11px", color: "#94A3B8" }}>
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

            <div
              style={{
                width: "100%",
                padding: "6px 12px",
                borderRadius: "10px",
                backgroundColor: "rgba(11, 17, 32, 0.6)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <span style={{ fontSize: "12px", fontWeight: "700" }}>{colorName}</span>
                <span style={{ fontSize: "10px", color: "#94A3B8", display: "block" }}>Family</span>
              </div>
              <span className="mono" style={{ fontSize: "12px", fontWeight: "700", color: "#38BDF8" }}>
                {activeHex}
              </span>
            </div>
          </div>
        )}

        {/* Tab 3: Eyedropper */}
        {activeTab === "image" && (
          <div
            style={{
              backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "18px",
              padding: "12px 14px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "14px", fontWeight: "700" }}>Eyedropper Canvas</span>
              {imageSrc && (
                <label style={{ fontSize: "11px", fontWeight: "600", color: "#0087FF", cursor: "pointer" }}>
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
                <Upload size={24} color="#0087FF" style={{ marginBottom: "6px" }} />
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
                        border: "2px solid #0087FF",
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
                  backgroundColor: "rgba(0, 135, 255, 0.15)",
                  color: "#0087FF",
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

      {/* SOLID FUSION BOTTOM BAR (No Liquid Glass) */}
      <nav
        style={{
          position: "fixed",
          bottom: "12px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "calc(100% - 24px)",
          maxWidth: "390px",
          backgroundColor: isDark ? "#121824" : "#FFFFFF",
          border: isDark ? "1px solid #1E283A" : "1px solid rgba(0, 0, 0, 0.08)",
          borderRadius: "28px",
          padding: "5px 6px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.6)",
          zIndex: 100,
        }}
      >
        {/* 1. Shades */}
        <button
          onClick={() => setActiveTab("shades")}
          style={{
            flex: 1,
            padding: "8px 0",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "3px",
            borderRadius: "22px",
            backgroundColor: activeTab === "shades" ? (isDark ? "#1D283C" : "#E2E8F0") : "transparent",
            color: activeTab === "shades" ? (isDark ? "#FFFFFF" : "#0F172A") : isDark ? "#64748B" : "#94A3B8",
            transition: "background-color 0.15s ease",
          }}
        >
          <LayoutGrid size={18} color={activeTab === "shades" ? "#0087FF" : "currentColor"} />
          <span style={{ fontSize: "11px", fontWeight: "600" }}>Shades</span>
        </button>

        {/* 2. Color Picker */}
        <button
          onClick={() => setActiveTab("picker")}
          style={{
            flex: 1,
            padding: "8px 0",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "3px",
            borderRadius: "22px",
            backgroundColor: activeTab === "picker" ? (isDark ? "#1D283C" : "#E2E8F0") : "transparent",
            color: activeTab === "picker" ? (isDark ? "#FFFFFF" : "#0F172A") : isDark ? "#64748B" : "#94A3B8",
            transition: "background-color 0.15s ease",
          }}
        >
          <div
            style={{
              width: "16px",
              height: "16px",
              borderRadius: "50%",
              border: "2.5px solid #3B82F6",
              borderTopColor: "#F59E0B",
              borderRightColor: "#10B981",
              borderBottomColor: "#EF4444",
            }}
          />
          <span style={{ fontSize: "11px", fontWeight: "600" }}>Color Picker</span>
        </button>

        {/* 3. From Image */}
        <button
          onClick={() => setActiveTab("image")}
          style={{
            flex: 1,
            padding: "8px 0",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "3px",
            borderRadius: "22px",
            backgroundColor: activeTab === "image" ? (isDark ? "#1D283C" : "#E2E8F0") : "transparent",
            color: activeTab === "image" ? (isDark ? "#FFFFFF" : "#0F172A") : isDark ? "#64748B" : "#94A3B8",
            transition: "background-color 0.15s ease",
          }}
        >
          <ImageIcon size={18} color={activeTab === "image" ? "#0087FF" : "currentColor"} />
          <span style={{ fontSize: "11px", fontWeight: "600" }}>From Image</span>
        </button>
      </nav>
    </div>
  );
}
