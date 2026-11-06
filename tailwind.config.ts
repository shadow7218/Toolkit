import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        oled: "#000000",
        surface: "#0a0a0a",
        card: "#121212",
        borderline: "rgba(255, 255, 255, 0.08)",
      },
      fontFamily: {
        mono: ["SF Mono", "Fira Code", "Courier New", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
