import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: '/uoh-market/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        auth: resolve(__dirname, 'auth.html'),
        account: resolve(__dirname, 'account.html'),
        sell: resolve(__dirname, 'sell.html')
      }
    }
  }
});