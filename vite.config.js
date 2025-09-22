import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/nagiosxi": {
        target: "http://172.24.213.65", // your Nagios XI server
        changeOrigin: true,
        secure: false,
      },
    },
  },
});