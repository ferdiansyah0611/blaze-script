import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  resolve: {
  	alias: {
  		'blaze': path.resolve(__dirname, './blaze'),
      'blaze.d': path.resolve(__dirname, './blaze.d'),
      'blaze.component': path.resolve(__dirname, './blaze.component'),
      'blaze.store': path.resolve(__dirname, './blaze.store'),
  	}
  },
  esbuild: {
    jsxFactory: 'this.$h.h',
    jsxFragment: 'this.$h.Fragment',
    jsxInject: 'import { render, state, watch, batch, mount, refs, log, init } from "./blaze"'
  }
})
