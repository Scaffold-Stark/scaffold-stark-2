import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  daisyui: {
    themes: [
      {
        mytheme: {
          primary: "#794BFC",

          secondary: "F4F1FD",

          accent: "#ff00ff",

          neutral: "#ff00ff",

          "base-100": "#ffffff",

          info: "#0000ff",

          success: "#00ffff",

          warning: "#00ff00",

          error: "#ff0000",
        },
      },
    ],
  },
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [require("daisyui")],
};
export default config;
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./utils/**/*.{js,ts,jsx,tsx}",
  ],
  plugins: [require("daisyui")],
  darkTheme: "dark",
  // DaisyUI theme colors
  daisyui: {
    themes: [
      {
        light: {
          primary: "#93BBFB",
          "primary-content": "#2A3655",
          secondary: "#8B45FD",
          "secondary-content": "#7800FF",
          accent: "#93BBFB",
          "accent-content": "#212638",
          neutral: "#212638",
          "neutral-content": "#ffffff",
          "base-100": "#ffffff",
          "base-200": "#f4f8ff",
          "base-300": "#ffffff",
          "base-content": "#212638",
          info: "#93BBFB",
          success: "#34EEB6",
          warning: "#FFCF72",
          error: "#FF8863",
          ".bg-gradient-modal": {
            "background-image":
              "linear-gradient(270deg, #A7ECFF -17.42%, #E8B6FF 109.05%)",
          },
          ".bg-modal": {
            background: "rgba(255, 255, 255, 0.78)",
          },
          ".bg-gradient-nav": {
            background: "#000000",
          },
          ".bg-main": {
            background: "#FFFFFF",
          },
          ".bg-underline": {
            background:
              "linear-gradient(270deg, #A7ECFF -17.42%, #E8B6FF 109.05%)",
          },
          ".bg-container": {
            background: "transparent",
          },
          ".bg-btn-wallet": {
            "background-image":
              "linear-gradient(270deg, #A7ECFF -17.42%, #E8B6FF 109.05%)",
          },
          ".bg-input": {
            background: "rgba(0, 0, 0, 0.07)",
          },
          ".bg-component": {
            background: "rgba(255, 255, 255, 0.55)",
          },
          ".bg-function": {
            background:
              "linear-gradient(270deg, #A7ECFF -17.42%, #E8B6FF 109.05%)",
          },
          ".text-function": {
            color: "#3C1DFF",
          },
          ".text-network": {
            color: "#7800FF",
          },
          "--rounded-btn": "9999rem",

          ".tooltip": {
            "--tooltip-tail": "6px",
          },
          ".link": {
            textUnderlineOffset: "2px",
          },
          ".link:hover": {
            opacity: "80%",
          },
          ".contract-content": {
            background: "white",
          },
        },
      },
      {
        dark: {
          primary: "#212638",
          "primary-content": "#DAE8FF",
          secondary: "#8b45fd",
          "secondary-content": "#0FF",
          accent: "#4969A6",
          "accent-content": "#F9FBFF",
          neutral: "#F9FBFF",
          "neutral-content": "#385183",
          "base-100": "#1C223B",
          "base-200": "#2A3655",
          "base-300": "#141a30",
          "base-content": "#F9FBFF",
          info: "#385183",
          success: "#34EEB6",
          warning: "#FFCF72",
          error: "#FF8863",
          ".bg-gradient-modal": {
            background: "#385183",
          },
          ".bg-modal": {
            background: "linear-gradient(90deg, #2B2243 0%, #253751 100%)",
          },
          ".bg-gradient-nav": {
            "background-image":
              "var(--gradient, linear-gradient(90deg, #42D2F1 0%, #B248DD 100%))",
          },
          ".bg-main": {
            background: "#141A31",
          },
          ".bg-underline": {
            background: "#5368B4",
          },
          ".bg-container": {
            background: "#141a30",
          },
          ".bg-btn-wallet": {
            "background-image":
              "linear-gradient(180deg, #3457D1 0%, #8A45FC 100%)",
          },
          ".bg-input": {
            background: "rgba(255, 255, 255, 0.07)",
          },
          ".bg-component": {
            background:
              "linear-gradient(113deg,rgba(43, 34, 67, 0.6) 20.48%,rgba(37, 55, 81, 0.6) 99.67%)",
          },
          ".bg-function": {
            background: "rgba(139, 69, 253, 0.37)",
          },
          ".text-function": {
            color: "#1DD6FF",
          },
          ".text-network": {
            color: "#D0A6FF",
          },

          "--rounded-btn": "9999rem",

          ".tooltip": {
            "--tooltip-tail": "6px",
            "--tooltip-color": "oklch(var(--p))",
          },
          ".link": {
            textUnderlineOffset: "2px",
          },
          ".link:hover": {
            opacity: "80%",
          },
          ".contract-content": {
            background:
              "linear-gradient(113.34deg, rgba(43, 34, 67, 0.6) 20.48%, rgba(37, 55, 81, 0.6) 99.67%)",
          },
        },
      },
    ],
  },
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
