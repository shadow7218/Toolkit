"use client";

import React, { useState, useRef, ChangeEvent, MouseEvent, TouchEvent } from "react";
import {
  Moon,
  Sun,
  Copy,
  Check,
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

// Calculate perceived luminance to flip text color between dark and light
function getLuminance(r: number, g: number, b: number): number {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

// Generate 12 clean shades from light to dark
function generate12Shades(hex: string): string[] {
  const rgb = hexToRgb(hex);
  const shades: string[] = [];

  // 1 to 4: light tint steps
  for (let i = 0; i < 4; i++) {
    const factor = (4 - i) * 0.22;
    const r = rgb.r + (255 - rgb.r) * factor;
    const g = rgb.g + (255 - rgb.g) * factor;
    const b = rgb.b + (255 - rgb.b) * factor;
    shades.push(rgbToHex(r, g, b));
  }

  // 5 to 8: mid-range shades
  for (let i = 0; i < 4; i++) {
    const factor = (2 - i) * 0.14;
    let r = rgb.r, g = rgb.g, b = rgb.b;
    if (factor > 0) {
      r = rgb.r + (255 - rgb.r) * factor;
      g = rgb.g + (255 - rgb.g) * factor;
      b = rgb.b + (255 - rgb.b) * factor;
    } else {
      r = rgb.r * (1 + factor * 0.65);
      g = rgb.g * (1 + factor * 0.65);
      b = rgb.b * (1 + factor * 0.65);
    }
    shades.push(rgbToHex(r, g, b));
  }

  // 9 to 12: deep dark steps
  for (let i = 1; i <= 4; i++) {
    const factor = Math.max(0.08, 0.65 - i * 0.14);
    const r = rgb.r * factor;
    const g = rgb.g * factor;
    const b = rgb.b * factor;
    shades.push(rgbToHex(r, g, b));
  }

  return shades;
}

export default function Toolkit() {
  const [isDark, setIsDark] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"shades" | "picker" | "image">("shades");
  const [primaryColor, setPrimaryColor] = useState<string>("#0087ff");
  const [selectedShadeIndex, setSelectedShadeIndex] = useState<number>(0);
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const shades = generate12Shades(primaryColor);
  const activeColor = shades[selectedShadeIndex] || primaryColor;
  const activeRgb = hexToRgb(activeColor);

  // Dynamic contrast: If luminance is > 0.55, text turns dark black/navy
  const isLightColor = getLuminance(activeRgb.r, activeRgb.g, activeRgb.b) > 0.55;
  const textColor = isLightColor ? "#091120" : "#ffffff";
  const pillBg = isLightColor ? "rgba(0, 0, 0, 0.1)" : "rgba(255, 255, 255, 0.18)";
  const copyBtnBg = isLightColor ? "rgba(0, 0, 0, 0.08)" : "rgba(0, 0, 0, 0.25)";

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLabel(label);
    setTimeout(() => setCopiedLabel(null), 1400);
  };

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
            const maxW = 400;
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
    setActiveTab("shades");
  };

  return (
    <div
      style={{
        height: "100dvh",
        maxHeight: "100dvh",
        backgroundColor: isDark ? "#040914" : "#f1f5f9",
        color: isDark ? "#ffffff" : "#0f172a",
        padding: "12px 16px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      <div style={{ width: "100%", maxWidth: "420px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "10px", flex: 1, minHeight: 0 }}>
        
        {/* Top Header */}
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 2px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ position: "relative", width: "28px", height: "28px" }}>
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "20px",
                  height: "20px",
                  borderRadius: "6px",
                  backgroundColor: "#2563eb",
                  opacity: 0.6,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  width: "20px",
                  height: "20px",
                  borderRadius: "6px",
                  backgroundColor: "#0087ff",
                  boxShadow: "0 4px 10px rgba(0, 135, 255, 0.4)",
                }}
              />
            </div>
            <h1 style={{ fontSize: "20px", fontWeight: "800", letterSpacing: "-0.4px" }}>Toolkit</h1>
          </div>

          <button
            onClick={() => setIsDark(!isDark)}
            aria-label="Toggle Theme"
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              backgroundColor: isDark ? "#0c1527" : "#ffffff",
              border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {isDark ? <Moon size={16} color="#cbd5e1" fill="#cbd5e1" /> : <Sun size={16} color="#f59e0b" />}
          </button>
        </header>

        {/* Small Rectangular Preview Card */}
        <div
          style={{
            position: "relative",
            width: "100%",
            borderRadius: "22px",
            padding: "14px 16px",
            height: "155px",
            minHeight: "155px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            backgroundColor: activeColor,
            boxShadow: `0 14px 28px -8px ${activeColor}80`,
            transition: "background-color 0.25s ease",
          }}
        >
          {/* Card Top Row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 10px",
                borderRadius: "9999px",
                backgroundColor: pillBg,
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
              }}
            >
              <span
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  backgroundColor: isLightColor ? "#0284c7" : "#60a5fa",
                  display: "inline-block",
                }}
              />
              <span style={{ fontSize: "11px", fontWeight: "600", color: textColor }}>Primary Color</span>
            </div>

            <button
              onClick={() => handleCopy(activeColor, "card-hex")}
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "12px",
                backgroundColor: copyBtnBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: textColor,
              }}
            >
              {copiedLabel === "card-hex" ? <Check size={16} color={isLightColor ? "#15803d" : "#86efac"} /> : <Copy size={16} />}
            </button>
          </div>

          {/* Card Bottom Row with Dynamic Contrast */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
              <span style={{ fontSize: "30px", fontWeight: "800", letterSpacing: "-0.5px", color: textColor }}>
                {activeColor}
              </span>
              <span
                style={{
                  padding: "2px 6px",
                  borderRadius: "5px",
                  backgroundColor: pillBg,
                  fontSize: "10px",
                  fontWeight: "800",
                  letterSpacing: "0.8px",
                  color: textColor,
                }}
              >
                HEX
              </span>
            </div>

            <button
              onClick={() => handleCopy(`RGB ${activeRgb.r}, ${activeRgb.g}, ${activeRgb.b}`, "card-rgb")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "12px",
                fontWeight: "600",
                color: textColor,
                opacity: 0.9,
              }}
            >
              <span>RGB {activeRgb.r}, {activeRgb.g}, {activeRgb.b}</span>
              {copiedLabel === "card-rgb" ? (
                <Check size={13} color={isLightColor ? "#15803d" : "#86efac"} />
              ) : (
                <Copy size={13} opacity={0.7} />
              )}
            </button>
          </div>
        </div>

        {/* Tab 1: Clean Shades Section */}
        {activeTab === "shades" && (
          <div
            style={{
              backgroundColor: isDark ? "#091222" : "#ffffff",
              border: isDark ? "1px solid rgba(255, 255, 255, 0.05)" : "1px solid rgba(0, 0, 0, 0.06)",
              borderRadius: "22px",
              padding: "12px 14px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              flex: 1,
              justifyContent: "center",
            }}
          >
            {/* Simple Heading */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h2 style={{ fontSize: "14px", fontWeight: "700", letterSpacing: "-0.2px" }}>Shades</h2>
              <span style={{ fontSize: "10px", color: isDark ? "#64748b" : "#94a3b8" }}>12 Steps</span>
            </div>

            {/* 4x3 Swatch Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "8px",
                width: "100%",
              }}
            >
              {shades.map((hex, index) => {
                const isSelected = index === selectedShadeIndex;
                const shadeRgb = hexToRgb(hex);
                const isLightShade = getLuminance(shadeRgb.r, shadeRgb.g, shadeRgb.b) > 0.6;

                return (
                  <button
                    key={index}
                    onClick={() => setSelectedShadeIndex(index)}
                    aria-label={`Select shade ${hex}`}
                    style={{
                      position: "relative",
                      width: "100%",
                      aspectRatio: "1.1 / 1",
                      borderRadius: "14px",
                      backgroundColor: hex,
                      outline: isSelected ? "2.5px solid #0087ff" : "none",
                      outlineOffset: "1.5px",
                    }}
                  >
                    {isSelected && (
                      <div
                        style={{
                          position: "absolute",
                          bottom: "5px",
                          right: "5px",
                          width: "16px",
                          height: "16px",
                          borderRadius: "50%",
                          backgroundColor: "#0087ff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#ffffff",
                          boxShadow: "0 2px 5px rgba(0,0,0,0.4)",
                        }}
                      >
                        <Check size={10} strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Custom Base Color Picker */}
        {activeTab === "picker" && (
          <div
            style={{
              backgroundColor: isDark ? "#091222" : "#ffffff",
              border: isDark ? "1px solid rgba(255, 255, 255, 0.05)" : "1px solid rgba(0, 0, 0, 0.06)",
              borderRadius: "22px",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              alignItems: "center",
              justifyContent: "center",
              flex: 1,
            }}
          >
            <h2 style={{ fontSize: "14px", fontWeight: "700" }}>Select Color</h2>
            <label style={{ position: "relative", cursor: "pointer", display: "inline-block" }}>
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => {
                  setPrimaryColor(e.target.value);
                  setSelectedShadeIndex(0);
                }}
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: 0,
                  width: "100%",
                  height: "100%",
                  cursor: "pointer",
                }}
              />
              <div
                style={{
                  width: "72px",
                  height: "72px",
                  borderRadius: "20px",
                  backgroundColor: primaryColor,
                  border: "3px solid rgba(255,255,255,0.2)",
                  boxShadow: `0 10px 20px ${primaryColor}70`,
                }}
              />
            </label>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "monospace", fontSize: "16px", fontWeight: "700" }}>
                {primaryColor.toUpperCase()}
              </div>
              <p style={{ fontSize: "11px", color: isDark ? "#64748b" : "#94a3b8", marginTop: "2px" }}>
                Tap box to choose spectrum
              </p>
            </div>
          </div>
        )}

        {/* Tab 3: Eyedropper from Image */}
        {activeTab === "image" && (
          <div
            style={{
              backgroundColor: isDark ? "#091222" : "#ffffff",
              border: isDark ? "1px solid rgba(255, 255, 255, 0.05)" : "1px solid rgba(0, 0, 0, 0.06)",
              borderRadius: "22px",
              padding: "14px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              flex: 1,
              justifyContent: "center",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "14px", fontWeight: "700" }}>Image Eyedropper</h2>
              {imageSrc && (
                <label style={{ fontSize: "11px", fontWeight: "600", color: "#0087ff", cursor: "pointer" }}>
                  Replace
                  <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
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
                  borderRadius: "18px",
                  border: isDark ? "1px dashed rgba(255,255,255,0.15)" : "1px dashed rgba(0,0,0,0.15)",
                  backgroundColor: isDark ? "#050a14" : "#f8fafc",
                  cursor: "pointer",
                }}
              >
                <Upload size={22} color="#0087ff" style={{ marginBottom: "6px" }} />
                <span style={{ fontSize: "12px", fontWeight: "600" }}>Upload Image</span>
                <span style={{ fontSize: "10px", color: "#64748b" }}>Tap to inspect pixels</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
              </label>
            ) : (
              <div
                style={{
                  borderRadius: "16px",
                  overflow: "hidden",
                  backgroundColor: "#000000",
                  display: "flex",
                  justifyContent: "center",
                  maxHeight: "160px",
                }}
              >
                <canvas
                  ref={canvasRef}
                  style={{ maxWidth: "100%", height: "auto", display: "block" }}
                  onClick={(e: MouseEvent<HTMLCanvasElement>) => sampleCanvasPixel(e.clientX, e.clientY)}
                  onTouchEnd={(e: TouchEvent<HTMLCanvasElement>) => {
                    if (e.changedTouches[0]) {
                      sampleCanvasPixel(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
                    }
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Solid OLED Bottom Navigation Bar (Fusion Style) */}
      <nav
        style={{
          width: "100%",
          maxWidth: "400px",
          margin: "0 auto",
          backgroundColor: isDark ? "#0d131f" : "#ffffff",
          border: isDark ? "1px solid #1a2233" : "1px solid rgba(0,0,0,0.08)",
          borderRadius: "32px",
          padding: "6px 8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: isDark ? "0 8px 24px rgba(0, 0, 0, 0.7)" : "0 8px 24px rgba(0, 0, 0, 0.08)",
          flexShrink: 0,
        }}
      >
        {/* Shades Tab */}
        <button
          onClick={() => setActiveTab("shades")}
          style={{
            flex: 1,
            padding: "8px 0",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "3px",
            borderRadius: "24px",
            backgroundColor: activeTab === "shades" ? (isDark ? "#1b2539" : "#e2e8f0") : "transparent",
            color: activeTab === "shades" ? (isDark ? "#ffffff" : "#0f172a") : isDark ? "#62728d" : "#94a3b8",
            transition: "background-color 0.2s ease",
          }}
        >
          <LayoutGrid size={18} color={activeTab === "shades" ? "#0087ff" : "currentColor"} />
          <span style={{ fontSize: "11px", fontWeight: "600" }}>Shades</span>
        </button>

        {/* Color Picker Tab */}
        <button
          onClick={() => setActiveTab("picker")}
          style={{
            flex: 1,
            padding: "8px 0",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "3px",
            borderRadius: "24px",
            backgroundColor: activeTab === "picker" ? (isDark ? "#1b2539" : "#e2e8f0") : "transparent",
            color: activeTab === "picker" ? (isDark ? "#ffffff" : "#0f172a") : isDark ? "#62728d" : "#94a3b8",
            transition: "background-color 0.2s ease",
          }}
        >
          <div
            style={{
              width: "16px",
              height: "16px",
              borderRadius: "50%",
              border: "2.5px solid #3b82f6",
              borderTopColor: "#f59e0b",
              borderRightColor: "#10b981",
              borderBottomColor: "#ef4444",
            }}
          />
          <span style={{ fontSize: "11px", fontWeight: "600" }}>Color Picker</span>
        </button>

        {/* From Image Tab */}
        <button
          onClick={() => setActiveTab("image")}
          style={{
            flex: 1,
            padding: "8px 0",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "3px",
            borderRadius: "24px",
            backgroundColor: activeTab === "image" ? (isDark ? "#1b2539" : "#e2e8f0") : "transparent",
            color: activeTab === "image" ? (isDark ? "#ffffff" : "#0f172a") : isDark ? "#62728d" : "#94a3b8",
            transition: "background-color 0.2s ease",
          }}
        >
          <ImageIcon size={18} color={activeTab === "image" ? "#0087ff" : "currentColor"} />
          <span style={{ fontSize: "11px", fontWeight: "600" }}>From Image</span>
        </button>
      </nav>
    </div>
  );
}
