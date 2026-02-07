import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Expose env vars to the browser
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      'process.env.DEEPGRAM_API_KEY': JSON.stringify(env.DEEPGRAM_API_KEY || "73c540241ef5debcb10445d74d7e63612ac1942f") // Fallback to provided key
    }
  };
});