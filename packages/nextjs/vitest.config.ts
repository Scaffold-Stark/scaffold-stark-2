import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    // coverage: {  
    //   reporter: ['text', 'json', 'html'],
    //   include: ['src/**/*.ts', 'src/**/*.tsx', "jsdom"],
    
    // },
    environment: "jsdom",

  },
  resolve: {
    alias: {
      "~~": path.resolve(__dirname, "./"),
    },
  },
});


