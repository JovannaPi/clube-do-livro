/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        rose:    { DEFAULT: "#e07a5f", light: "#fdf0ec", dark: "#c45f44" },
        sage:    { DEFAULT: "#81b29a", light: "#eef5f1", dark: "#5f8f7a" },
        cream:   { DEFAULT: "#fdf8f5" },
        ink:     { DEFAULT: "#2d2d2d" },
        muted:   { DEFAULT: "#9a8f8f" },
      },
      fontFamily: {
        serif:  ["Georgia", "Cambria", "serif"],
        sans:   ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: { "2xl": "1rem", "3xl": "1.5rem" },
    },
  },
  plugins: [],
};
