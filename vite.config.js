import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { tamaguiPlugin } from '@tamagui/vite-plugin'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tamaguiPlugin({
      components: ['tamagui'],
      config: './tamagui.config.js',
    }),
  ],
  server: {
    host: true, // Listen on all addresses including LAN
    port: 5173,
  },
  resolve: {
    alias: {
      'react-native': 'react-native-web',
    },
  },
  optimizeDeps: {
    include: ['react-native-web'],
    exclude: ['@tamagui/core'],
  },
})
