import { defineConfig } from "tsup";

export default defineConfig({
  format: ["cjs", "esm"],
  entry: ["./src/index.ts", "./src/minusic.css"],
  dts: true,
  shims: true,
  skipNodeModulesBundle: true,
  clean: true,
  outDir: "build",
});
