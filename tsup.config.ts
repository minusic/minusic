import { defineConfig } from "tsup";

export default defineConfig({
  format: ["cjs", "esm"],
  entry: ["./src/index.ts"],
  dts: true,
  shims: true,
  skipNodeModulesBundle: true,
  clean: true,
  outDir: "build",
  // outExtension({ format }) {
  //   return format === 'esm' ? { js: '.mjs' } : { js: '.cjs' };
  // },
  // minify: true,
});
