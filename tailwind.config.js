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
        panel: "#162033",
        line: "#314158",
        mist: "#94a3b8",
        surface: "#f8fafc",
        accent: "#0ea5a4",
        signal: "#2563eb",
        highlight: "#f59e0b",
      },
      boxShadow: {
        panel: "0 30px 80px rgba(15, 23, 42, 0.28)",
      },
      fontFamily: {
        sans: ["Manrope", "sans-serif"],
        display: ["Sora", "sans-serif"],
      },
      backgroundImage: {
        corporate:
          "radial-gradient(circle at top left, rgba(14,165,164,0.22), transparent 32%), radial-gradient(circle at bottom right, rgba(37,99,235,0.25), transparent 30%), linear-gradient(180deg, #08111f 0%, #0f172a 100%)",
      },
    },
  },
  plugins: [],
};
