"use client";

import { useState, useEffect } from "react";
import ShadesView from "../components/ShadesView";
import EyedropperView from "../components/EyedropperView";
import { Sun, Moon } from "lucide-react";

export default function Home() {
  const [tab, setTab] = useState<"shades" | "eyedropper">("shades");
  const [currentColor, setCurrentColor] = useState<string>("#1D4ED8");
  const [isDark, setIsDark] = useState<boolean>(true);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  return (
    <main className="max-w-md mx-auto min-h-screen px-4 py-8 flex flex-col justify-between">
      <div className="space-y-6">
        {/* Minimal Header */}
        <header className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-borderline">
          <div>
            <span className="text-[11px] font-mono tracking-widest uppercase text-zinc-400">
              COLOR SYSTEM
            </span>
            <h1 className="text-xl font-bold tracking-tight">Toolkit</h1>
          </div>

          <button
            onClick={() => setIsDark(!isDark)}
            aria-label="Toggle Mode"
            className="w-9 h-9 rounded-xl flex items-center justify-center border border-zinc-200 dark:border-borderline bg-zinc-100 dark:bg-card text-zinc-600 dark:text-zinc-300"
          >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </header>

        {/* Tab Selectors */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-zinc-100 dark:bg-card border border-zinc-200 dark:border-borderline text-xs font-mono">
          <button
            onClick={() => setTab("shades")}
            className={`py-2 rounded-lg font-medium transition-all ${
              tab === "shades"
                ? "bg-white dark:bg-zinc-800 text-black dark:text-white shadow-sm"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            Spectrum Shades
          </button>
          <button
            onClick={() => setTab("eyedropper")}
            className={`py-2 rounded-lg font-medium transition-all ${
              tab === "eyedropper"
                ? "bg-white dark:bg-zinc-800 text-black dark:text-white shadow-sm"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            Image Eyedropper
          </button>
        </div>

        {/* Views */}
        {tab === "shades" ? (
          <ShadesView
            baseColor={currentColor}
            onColorChange={(color) => setCurrentColor(color)}
          />
        ) : (
          <EyedropperView
            onPickColor={(hex) => {
              setCurrentColor(hex);
              setTab("shades");
            }}
          />
        )}
      </div>

      <footer className="mt-8 pt-4 border-t border-zinc-200 dark:border-borderline text-center text-[10px] font-mono text-zinc-500">
        TOOLKIT PWA • OFFLINE CAPABLE
      </footer>
    </main>
  );
}
