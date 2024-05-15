import typescript from "@rollup/plugin-typescript";
import autoExternal from "rollup-plugin-auto-external";
import nodeResolve from "@rollup/plugin-node-resolve";

export default {
  input: "src/cli.ts",
  output: {
    dir: "dist",
    format: "es",
    sourcemap: true,
  },
  plugins: [nodeResolve(), autoExternal(), typescript({ exclude: ["templates/**"] })],
};