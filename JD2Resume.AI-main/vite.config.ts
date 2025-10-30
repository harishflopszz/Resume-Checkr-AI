import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: mode === 'development' ? {
    host: "0.0.0.0",
    port: 5173,
    allowedHosts: true,
  } : undefined,
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Separate large PDF libraries
          if (id.includes('pdfjs-dist') || id.includes('tesseract.js')) {
            return 'pdf-utils';
          }
          // Group common libraries
          if (id.includes('jspdf') || id.includes('docx') || id.includes('mammoth')) {
            return 'doc-utils';
          }
          if (id.includes('lucide-react') || id.includes('gsap') || id.includes('framer-motion')) {
            return 'ui-libs';
          }
          if (id.includes('react') || id.includes('react-dom')) {
            return 'react-vendor';
          }
          if (id.includes('date-fns') || id.includes('next-themes') || id.includes('@tanstack')) {
            return 'misc-utils';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000, // Allow larger chunks for heavy libraries
  },
}));
