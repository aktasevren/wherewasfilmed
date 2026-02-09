/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#1111d4",
        "accent-gold": "#D4AF37",
        "amber-accent": "#ffbf00",
        "background-light": "#f6f6f8",
        "background-dark": "#080810",
        "cinema-black": "#050505",
        "glass-black": "#0a0a0a",
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "1rem",
        lg: "2rem",
        xl: "3rem",
      },
    },
  },
  plugins: [],
};
