"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const isDark =
      localStorage.theme === "dark" ||
      (!("theme" in localStorage) &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggle = () => {
    const nextDark = !dark;
    setDark(nextDark);
    document.documentElement.classList.toggle("dark", nextDark);
    localStorage.theme = nextDark ? "dark" : "light";
  };

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="p-2.5 rounded-2xl glass-panel text-slate-700 dark:text-slate-200 hover:scale-105 active:scale-95 transition-all duration-200"
    >
      {dark ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-blue-600" />}
    </button>
  );
}
