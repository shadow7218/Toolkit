"use client";

import { useState } from "react";
import ThemeToggle from "../components/ThemeToggle";
import ShadeGenerator from "../components/ShadeGenerator";
import ImageEyedropper from "../components/ImageEyedropper";
import { Layers, Image as ImageIcon } from "lucide-react";

export default function Page() {
  const [activeTab, setActiveTab] = useState<"shades" | "eyedropper">("shades");
  const [currentColor, setCurrentColor] = useState<string>("#0E2F76");

  const handlePickColor = (hex: string) => {
    setCurrentColor(hex);
    setActiveTab("shades");
  };

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <header className="flex items-center justify-between pb-4 border-b border-slate-200/50 dark:border-white/5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Toolkit<span className="text-blue-500">.</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Color shades spectrum & precision eyedropper
          </p>
        </div>
        <ThemeToggle />
      </header>

      {/* Mode Navigation Tabs */}
      <div className="flex p-1.5 rounded-2xl glass-panel max-w-sm mx-auto shadow-sm">
        <button
          onClick={() => setActiveTab("shades")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
            activeTab === "shades"
              ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Layers size={16} />
          <span>Shades</span>
        </button>
        <button
          onClick={() => setActiveTab("eyedropper")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
            activeTab === "eyedropper"
              ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <ImageIcon size={16} />
          <span>Image Picker</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div>
        {activeTab === "shades" ? (
          <ShadeGenerator
            baseColor={currentColor}
            onColorChange={(hex) => setCurrentColor(hex)}
          />
        ) : (
          <ImageEyedropper onPickColor={handlePickColor} />
        )}
      </div>
    </main>
  );
}
