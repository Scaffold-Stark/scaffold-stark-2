import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],

  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
};
export default config;
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./utils/**/*.{js,ts,jsx,tsx}",
  ],

  darkTheme: "dark",

  theme: {
    extend: {
      boxShadow: {
        center: "0 0 12px -2px rgb(0 0 0 / 0.05)",
      },
      animation: {
        "pulse-fast": "pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      backgroundImage: {
        "gradient-light":
          "linear-gradient(270deg, #A7ECFF -17.42%, #E8B6FF 109.05%)",
        "gradient-dark":
          "var(--gradient, linear-gradient(90deg, #42D2F1 0%, #B248DD 100%))",
        "gradient-vertical":
          "linear-gradient(180deg, #3457D1 0%, #8A45FC 100%)",
        "gradient-icon":
          "var(--gradient, linear-gradient(90deg, #42D2F1 0%, #B248DD 100%))",
      },
    },
  },
};
