import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default ({ mode }) => {
  // Load env variables based on mode
  const env = loadEnv(mode, process.cwd(), '');
  return defineConfig({
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: 'http://172.17.19.13' || 'https://172.17.19.13',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
  });
};