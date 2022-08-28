import { defineConfig } from "vite";
import path from "path";
import hmr from "./.blaze/system/hmr";

export default defineConfig({
  plugins: [hmr()],
  resolve: {
    alias: {
      "@blaze": path.resolve(__dirname, "./.blaze"),
      "@blaze.d": path.resolve(__dirname, "./.blaze/blaze.d"),
      "@blaze.utils": path.resolve(__dirname, "./.blaze/utils"),
      "@root": path.resolve(__dirname, "./.blaze"),
      "@route": path.resolve(__dirname, "./src/route"),
      "@component": path.resolve(__dirname, "./src/component"),
      "@style": path.resolve(__dirname, "./src/style"),
      "@store": path.resolve(__dirname, "./src/store"),
      "@app": path.resolve(__dirname, "./"),
      "@": path.resolve(__dirname, "./src"),
    },
  },
  esbuild: {
    jsxFactory: "this.$h.h",
    jsxFragment: "this.$h.Fragment",
    jsxInject: `import { init } from "@blaze";`
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
      },
    },
  },
});
