import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [svelte()],
  css: { preprocessorOptions: { scss: { quietDeps: true } } },
  server: { port: 5100 },
  preview: { port: 5100 },
});
