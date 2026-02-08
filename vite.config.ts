import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import {VitePWA} from 'vite-plugin-pwa';

const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1];
const isGitHubActions = process.env.GITHUB_ACTIONS === 'true';

export default defineConfig({
  base: isGitHubActions && repoName ? `/${repoName}/` : '/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['icons/pwa-192x192.png', 'icons/pwa-512x512.png', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Laugh Ojisan',
        short_name: 'Ojisan',
        description: 'Find the one laughing Ojisan.',
        theme_color: '#9e673f',
        background_color: '#9e673f',
        display: 'standalone',
        start_url: './',
        scope: './',
        icons: [
          {
            src: 'icons/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icons/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        mode: 'development',
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest,woff2}'],
      },
    }),
  ],
});
