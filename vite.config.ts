import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { componentTagger } from "lovable-tagger";
import { visualizer } from "rollup-plugin-visualizer";
import mdx from "@mdx-js/rollup";
import remarkGfm from "remark-gfm";
import remarkFrontmatter from "remark-frontmatter";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrism from "rehype-prism-plus";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    mdx({
      remarkPlugins: [remarkGfm, remarkFrontmatter],
      rehypePlugins: [
        rehypeSlug,
        [rehypeAutolinkHeadings, { behavior: 'wrap' }],
        rehypePrism,
      ],
    }),
    react(),
    mode === 'development' &&
    componentTagger(),
    process.env.ANALYZE === 'true' && visualizer({
      filename: 'dist/bundle-analysis.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Enable build optimizations
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-accordion', '@radix-ui/react-dialog', '@radix-ui/react-toast', '@radix-ui/react-tooltip'],
          router: ['react-router-dom'],
          query: ['@tanstack/react-query'],
          monitoring: ['@sentry/react'],
          mdx: ['@mdx-js/rollup', 'gray-matter', 'reading-time', 'date-fns'],
        },
      },
    },
    // Compress assets
    assetsInlineLimit: 4096,
    // Optimize chunk size warnings
    chunkSizeWarningLimit: 500,
  },
}));
