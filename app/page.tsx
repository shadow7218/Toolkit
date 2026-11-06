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
  Image as ImageIcon,
  Upload,
} from "lucide-react";

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

function rgbToHex(r: number, g: number, b: number): string {
  const h = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`.toLowerCase();
}

function generate12Shades(hex: string): string[] {
  const rgb = hexToRgb(hex);
  const shades: string[] = [];

  // 1 to 3: Light tint steps
  for (let i = 0; i < 3; i++) {
    const factor = (3 - i) * 0.28;
    const r = rgb.r + (255 - rgb.r) * factor;
    const g = rgb.g + (255 - rgb.g) * factor;
    const b = rgb.b + (255 - rgb.b) * factor;
    shades.push(rgbToHex(r, g, b));
  }

  // 4 to 8: Mid-range base colors
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

  // 9 to 12: Deep shades
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

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLabel(label);
    setTimeout(() => setCopiedLabel(null), 1500);
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
            const maxW = 500;
            const ratio = Math.min(1, maxW / img.naturalWidth);
            canvas.width = img.naturalWidth * ratio;
            canvas.height = img.naturalHeight * ratio;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          };
        }, 100);
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
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: isDark ? "#030712" : "#f1f5f9",
        color: isDark ? "#ffffff" : "#0f172a",
        padding: "16px 16px 110px 16px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div style={{ width: "100%", maxWidth: "420px", display: "flex", flexDirection: "column", gap: "20px" }}>
        
        {/* Top Header */}
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* Toolkit layered square icon */}
            <div style={{ position: "relative", width: "32px", height: "32px" }}>
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "24px",
                  height: "24px",
                  borderRadius: "8px",
                  backgroundColor: "#2563eb",
                  opacity: 0.6,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  width: "24px",
                  height: "24px",
                  borderRadius: "8px",
                  backgroundColor: "#0087ff",
                  boxShadow: "0 4px 14px rgba(0, 135, 255, 0.4)",
                }}
              />
            </div>
            <h1 style={{ fontSize: "24px", fontWeight: "800", letterSpacing: "-0.5px" }}>Toolkit</h1>
          </div>

          <button
            onClick={() => setIsDark(!isDark)}
            aria-label="Toggle Theme"
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "50%",
              backgroundColor: isDark ? "#0a1324" : "#ffffff",
              border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            {isDark ? <Moon size={19} color="#cbd5e1" fill="#cbd5e1" /> : <Sun size={19} color="#f59e0b" />}
          </button>
        </header>

        {/* Big Primary Color Card */}
        <div
          style={{
            position: "relative",
            width: "100%",
            borderRadius: "32px",
            padding: "24px",
            height: "320px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            backgroundColor: activeColor,
            boxShadow: `0 24px 50px -12px ${activeColor}90`,
            transition: "background-color 0.3s ease, box-shadow 0.3s ease",
          }}
        >
          {/* Card Top Row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 14px",
                borderRadius: "9999px",
                backgroundColor: "rgba(0, 0, 0, 0.28)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
              }}
            >
              <span
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  backgroundColor: "#60a5fa",
                  display: "inline-block",
                }}
              />
              <span style={{ fontSize: "12px", fontWeight: "600", color: "#ffffff" }}>Primary Color</span>
            </div>

            <button
              onClick={() => handleCopy(activeColor, "card-hex")}
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "16px",
                backgroundColor: "rgba(0, 0, 0, 0.22)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
              }}
            >
              {copiedLabel === "card-hex" ? <Check size={18} color="#86efac" /> : <Copy size={18} />}
            </button>
          </div>

          {/* Card Bottom Row */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
              <span style={{ fontSize: "42px", fontWeight: "800", letterSpacing: "-1px", color: "#ffffff" }}>
                {activeColor}
              </span>
              <span
                style={{
                  padding: "3px 8px",
                  borderRadius: "6px",
                  backgroundColor: "rgba(255, 255, 255, 0.22)",
                  fontSize: "11px",
                  fontWeight: "800",
                  letterSpacing: "1px",
                  color: "#ffffff",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
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
                gap: "6px",
                fontSize: "14px",
                fontWeight: "600",
                color: "rgba(255, 255, 255, 0.92)",
              }}
            >
              <span>RGB {activeRgb.r}, {activeRgb.g}, {activeRgb.b}</span>
              {copiedLabel === "card-rgb" ? <Check size={14} color="#86efac" /> : <Copy size={14} opacity={0.8} />}
            </button>
          </div>
        </div>

        {/* Tab 1: Shades View */}
        {activeTab === "shades" && (
          <div
            style={{
              backgroundColor: isDark ? "#091222" : "#ffffff",
              border: isDark ? "1px solid rgba(255, 255, 255, 0.06)" : "1px solid rgba(0, 0, 0, 0.06)",
              borderRadius: "32px",
              padding: "22px",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.25)",
              display: "flex",
              flexDirection: "column",
              gap: "18px",
            }}
          >
            {/* All Shades Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "14px",
                    backgroundColor: "rgba(0, 135, 255, 0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#0087ff",
                  }}
                >
                  <Droplet size={20} color="#0087ff" fill="#0087ff" />
                </div>
                <div>
                  <h2 style={{ fontSize: "16px", fontWeight: "700", lineHeight: "1.2" }}>All Shades</h2>
                  <p style={{ fontSize: "12px", color: isDark ? "#94a3b8" : "#64748b" }}>
                    Explore different shades of this color
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedShadeIndex((selectedShadeIndex + 1) % shades.length)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "6px 14px",
                  borderRadius: "9999px",
                  backgroundColor: isDark ? "#121d33" : "#f1f5f9",
                  fontSize: "12px",
                  fontWeight: "600",
                  color: isDark ? "#cbd5e1" : "#334155",
                }}
              >
                <span>More</span>
                <ChevronRight size={14} />
              </button>
            </div>

            {/* 4x3 Rounded Swatch Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "12px",
                width: "100%",
              }}
            >
              {shades.map((hex, index) => {
                const isSelected = index === selectedShadeIndex;
                return (
                  <button
                    key={index}
                    onClick={() => setSelectedShadeIndex(index)}
                    aria-label={`Select shade ${hex}`}
                    style={{
                      position: "relative",
                      width: "100%",
                      aspectRatio: "1 / 1",
                      borderRadius: "20px",
                      backgroundColor: hex,
                      outline: isSelected ? "3px solid #0087ff" : "none",
                      outlineOffset: "2px",
                      transform: isSelected ? "scale(1.02)" : "scale(1)",
                      transition: "transform 0.15s ease",
                    }}
                  >
                    {/* Blue checkmark on active item */}
                    {isSelected && (
                      <div
                        style={{
                          position: "absolute",
                          bottom: "8px",
                          right: "8px",
                          width: "20px",
                          height: "20px",
                          borderRadius: "50%",
                          backgroundColor: "#0087ff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#ffffff",
                          boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
                        }}
                      >
                        <Check size={12} strokeWidth={3} />
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
              border: isDark ? "1px solid rgba(255, 255, 255, 0.06)" : "1px solid rgba(0, 0, 0, 0.06)",
              borderRadius: "32px",
              padding: "24px",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.25)",
              display: "flex",
              flexDirection: "column",
              gap: "18px",
              alignItems: "center",
            }}
          >
            <h2 style={{ fontSize: "16px", fontWeight: "700" }}>Pick Base Color</h2>
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
                  width: "90px",
                  height: "90px",
                  borderRadius: "28px",
                  backgroundColor: primaryColor,
                  border: "4px solid rgba(255,255,255,0.2)",
                  boxShadow: `0 14px 28px ${primaryColor}70`,
                }}
              />
            </label>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "monospace", fontSize: "20px", fontWeight: "700" }}>
                {primaryColor.toUpperCase()}
              </div>
              <p style={{ fontSize: "12px", color: isDark ? "#94a3b8" : "#64748b", marginTop: "4px" }}>
                Tap the color box above to change spectrum
              </p>
            </div>
          </div>
        )}

        {/* Tab 3: Eyedropper from Image */}
        {activeTab === "image" && (
          <div
            style={{
              backgroundColor: isDark ? "#091222" : "#ffffff",
              border: isDark ? "1px solid rgba(255, 255, 255, 0.06)" : "1px solid rgba(0, 0, 0, 0.06)",
              borderRadius: "32px",
              padding: "22px",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.25)",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ fontSize: "16px", fontWeight: "700" }}>Image Color Picker</h2>
                <p style={{ fontSize: "12px", color: isDark ? "#94a3b8" : "#64748b" }}>
                  Tap anywhere on the image to sample color
                </p>
              </div>
              {imageSrc && (
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#0087ff", cursor: "pointer" }}>
                  Change
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
                  padding: "40px 16px",
                  borderRadius: "24px",
                  border: isDark ? "1px dashed rgba(255,255,255,0.15)" : "1px dashed rgba(0,0,0,0.15)",
                  backgroundColor: isDark ? "#060c18" : "#f8fafc",
                  cursor: "pointer",
                }}
              >
                <Upload size={28} color="#0087ff" style={{ marginBottom: "8px" }} />
                <span style={{ fontSize: "13px", fontWeight: "600" }}>Upload Image</span>
                <span style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>Tap to select photo</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
              </label>
            ) : (
              <div
                style={{
                  borderRadius: "20px",
                  overflow: "hidden",
                  backgroundColor: "#000000",
                  display: "flex",
                  justifyContent: "center",
                  border: "1px solid rgba(255,255,255,0.08)",
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

      {/* Floating Bottom Pill Dock Navigation */}
      <nav
        style={{
          position: "fixed",
          bottom: "16px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "calc(100% - 32px)",
          maxWidth: "400px",
          backgroundColor: isDark ? "rgba(10, 18, 32, 0.94)" : "rgba(255, 255, 255, 0.94)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: isDark ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid rgba(0, 0, 0, 0.08)",
          borderRadius: "28px",
          padding: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
          zIndex: 100,
        }}
      >
        {/* Shades Tab */}
        <button
          onClick={() => setActiveTab("shades")}
          style={{
            position: "relative",
            flex: 1,
            padding: "8px 0",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "4px",
            borderRadius: "20px",
            backgroundColor: activeTab === "shades" ? "rgba(0, 135, 255, 0.12)" : "transparent",
            color: activeTab === "shades" ? (isDark ? "#ffffff" : "#0f172a") : isDark ? "#64748b" : "#94a3b8",
          }}
        >
          <LayoutGrid size={20} color={activeTab === "shades" ? "#0087ff" : "currentColor"} />
          <span style={{ fontSize: "11px", fontWeight: "600" }}>Shades</span>
          {activeTab === "shades" && (
            <div
              style={{
                position: "absolute",
                bottom: "2px",
                width: "36px",
                height: "2px",
                borderRadius: "9999px",
                backgroundColor: "#0087ff",
                boxShadow: "0 0 8px #0087ff",
              }}
            />
          )}
        </button>

        {/* Color Picker Tab */}
        <button
          onClick={() => setActiveTab("picker")}
          style={{
            position: "relative",
            flex: 1,
            padding: "8px 0",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "4px",
            borderRadius: "20px",
            backgroundColor: activeTab === "picker" ? "rgba(0, 135, 255, 0.12)" : "transparent",
            color: activeTab === "picker" ? (isDark ? "#ffffff" : "#0f172a") : isDark ? "#64748b" : "#94a3b8",
          }}
        >
          <div
            style={{
              width: "18px",
              height: "18px",
              borderRadius: "50%",
              border: "3px solid #3b82f6",
              borderTopColor: "#f59e0b",
              borderRightColor: "#10b981",
              borderBottomColor: "#ef4444",
            }}
          />
          <span style={{ fontSize: "11px", fontWeight: "600" }}>Color Picker</span>
          {activeTab === "picker" && (
            <div
              style={{
                position: "absolute",
                bottom: "2px",
                width: "36px",
                height: "2px",
                borderRadius: "9999px",
                backgroundColor: "#0087ff",
                boxShadow: "0 0 8px #0087ff",
              }}
            />
          )}
        </button>

        {/* From Image Tab */}
        <button
          onClick={() => setActiveTab("image")}
          style={{
            position: "relative",
            flex: 1,
            padding: "8px 0",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "4px",
            borderRadius: "20px",
            backgroundColor: activeTab === "image" ? "rgba(0, 135, 255, 0.12)" : "transparent",
            color: activeTab === "image" ? (isDark ? "#ffffff" : "#0f172a") : isDark ? "#64748b" : "#94a3b8",
          }}
        >
          <ImageIcon size={20} color={activeTab === "image" ? "#0087ff" : "currentColor"} />
          <span style={{ fontSize: "11px", fontWeight: "600" }}>From Image</span>
          {activeTab === "image" && (
            <div
              style={{
                position: "absolute",
                bottom: "2px",
                width: "36px",
                height: "2px",
                borderRadius: "9999px",
                backgroundColor: "#0087ff",
                boxShadow: "0 0 8px #0087ff",
              }}
            />
          )}
        </button>
      </nav>
    </div>
  );
}
