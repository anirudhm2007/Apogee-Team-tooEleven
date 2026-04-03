/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: {
        bg: "#0a0a0f",
        neonPurple: "#8f00ff",
        neonCyan: "#00f0ff",
      },
      fontFamily: {
        mono: ["Consolas", "Menlo", "Monaco", "monospace"],
      },
      boxShadow: {
        glow: "0 0 12px rgba(0, 240, 255, 0.35)",
        purpleGlow: "0 0 12px rgba(143, 0, 255, 0.35)",
      },
    },
  },
  plugins: [],
};
