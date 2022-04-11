import { defineConfig } from 'vite'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  // define: {
  //   $app: JSON.stringify('$app'),
  //   $router: JSON.stringify('$router'),
  //   store: JSON.stringify('store'),
  // },
  resolve: {
  	alias: {
  		'blaze': path.resolve(__dirname, './blaze'),
      'blaze.d': path.resolve(__dirname, './blaze.d'),
      'blaze.component': path.resolve(__dirname, './blaze.component'),
      'blaze.store': path.resolve(__dirname, './blaze.store'),
  	}
  }
})
