import { defineConfig, PluginOption } from 'vite';
import aurelia from '@aurelia/vite-plugin';
// import { resolve } from 'path';

export default defineConfig({
  base: './',
  css: {
    preprocessorOptions: {
      scss: {
        quietDeps: true,
      },
    },
  },
  esbuild: {
    target: "es2020"
  },
  // resolve: {
  //   alias: {
  //     '@': resolve(__dirname, 'src') // Adjust if your source folder is different
  //   }
  // },
  plugins: [
    aurelia({
      // useDev: true,
    }) as PluginOption,
  ],
  preview: {
    port: 9000,
  },
  server: {
    port: 9000,
    cors: true,
    host: 'localhost',
    hmr: {
      clientPort: 9000,
    },
  },
  build: {
    outDir: 'website',
    emptyOutDir: true,
    sourcemap: true
  }
});
