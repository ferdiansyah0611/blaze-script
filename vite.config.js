import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@blaze": path.resolve(__dirname, "./.blaze/blaze"),
      "@blaze.d": path.resolve(__dirname, "./.blaze/blaze.d"),
      "@blaze.utils": path.resolve(__dirname, "./.blaze/utils"),
      "@blaze.router": path.resolve(__dirname, "./.blaze/router"),
      "@root": path.resolve(__dirname, "./.blaze"),
    },
  },
  esbuild: {
    jsxFactory: "this.$h.h",
    jsxFragment: "this.$h.Fragment"
  },
});
