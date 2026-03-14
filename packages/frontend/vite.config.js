import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const envDir = path.resolve(__dirname, '../..');
  const env = loadEnv(mode, envDir, '');

  const apiBase = env.VITE_API_URL || 'http://localhost:3001/api';
  let proxyTarget = 'http://localhost:3001';
  try {
    const url = new URL(apiBase);
    proxyTarget = `${url.protocol}//${url.host}`;
  } catch {
    // VITE_API_URL geçersizse güvenli lokal varsayılanına dön.
  }

  const devPort = Number(env.VITE_DEV_PORT || 5173);

  return {
    plugins: [react()],
    envDir,
    server: {
      port: devPort,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
