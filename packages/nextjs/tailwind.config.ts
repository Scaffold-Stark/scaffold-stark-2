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



          "primary": "#794BFC",



          "secondary": "F4F1FD",



          "accent": "#ff00ff",



          "neutral": "#ff00ff",



          "base-100": "#ffffff",



          "info": "#0000ff",



          "success": "#00ffff",



          "warning": "#00ff00",



          "error": "#ff0000",
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
  plugins: [
    require("daisyui")
  ],
};
export default config;
