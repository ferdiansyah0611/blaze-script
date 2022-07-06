import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  resolve: {
  	alias: {
      '@blaze': path.resolve(__dirname, './.blaze/blaze'),
      '@blaze.utils': path.resolve(__dirname, './.blaze/utils'),
      '@blaze.router': path.resolve(__dirname, './.blaze/router'),
  	}
  },
  esbuild: {
    jsxFactory: 'this.$h.h',
    jsxFragment: 'this.$h.Fragment',
    jsxInject: 'import { render, state, watch, batch, mount, refs, log, init, context } from "@blaze"'
  }
})
