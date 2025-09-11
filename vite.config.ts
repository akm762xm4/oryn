import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Enable tree shaking
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor chunks
          react: ["react", "react-dom"],
          router: ["react-router-dom"],
          ui: ["lucide-react", "react-hot-toast"],
          markdown: ["react-markdown", "rehype-highlight", "remark-gfm"],
          utils: ["date-fns", "axios"],
        },
      },
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 500,
    // Enable minification
    minify: 'terser',
    // Remove console logs in production
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  // Optimize dev server
  server: {
    hmr: {
      overlay: false,
    },
  },
});
