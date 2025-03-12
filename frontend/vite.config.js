import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load env variables based on mode
  const env = loadEnv(mode, process.cwd(), '');
  
  // Set up API URL for proxying in development or direct use in production
  const apiUrl = env.VITE_API_URL || 'http://localhost:5000';
  
  console.log(`Mode: ${mode}, API URL: ${apiUrl}`);
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    // Remove proxy configuration as we're now using direct URLs
    // This prevents requests from being sent to Vite's dev server itself
    
    // For production build, make sure environment variables are properly injected
    define: {
      'process.env.VITE_API_URL': JSON.stringify(apiUrl),
    },
  };
});
