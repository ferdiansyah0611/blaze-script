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
      "@route": path.resolve(__dirname, "./src/route"),
      "@component": path.resolve(__dirname, "./src/component"),
      "@style": path.resolve(__dirname, "./src/style"),
      "@": path.resolve(__dirname, "./src"),
    },
  },
  esbuild: {
    jsxFactory: "this.$h.h",
    jsxFragment: "this.$h.Fragment"
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
        test: path.resolve(__dirname, "test", "index.html"),
      }
    }
  }
});
