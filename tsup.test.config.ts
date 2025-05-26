import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["tests/**/*.test.ts"],
  format: ["esm"],
  target: "node18",
  sourcemap: false,
  clean: true,
  outDir: "build-tests",
  noExternal: ["src/**"],
});