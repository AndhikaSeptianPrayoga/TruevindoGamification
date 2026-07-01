/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        ink: "#0f172a",
        panel: "#ffffff",
        line: "#dbe4f0",
        mist: "#64748b",
        surface: "#f8fbff",
        accent: "#ef233c",
        signal: "#1d4ed8",
        highlight: "#f59e0b",
        success: "#0f766e",
      },
      boxShadow: {
        panel: "0 24px 90px rgba(15, 23, 42, 0.10)",
        float: "0 18px 45px rgba(29, 78, 216, 0.14)",
      },
      fontFamily: {
        sans: ["Manrope", "sans-serif"],
        display: ["Space Grotesk", "sans-serif"],
      },
      backgroundImage: {
        corporate:
          "linear-gradient(180deg, #f8fbff 0%, #eef4ff 46%, #ffffff 100%)",
      },
    },
  },
  plugins: [],
};
