import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/nagiosxi": {
        target: "localhost:3000", // your Nagios XI server
        changeOrigin: true,
        secure: false,
      },
    },
  },
});