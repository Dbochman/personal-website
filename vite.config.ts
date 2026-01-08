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
      buffer: 'buffer/',
    },
  },
  define: {
    global: 'globalThis',
  },
  build: {
    // Enable build optimizations
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks(id) {
          // Core vendor chunks
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) {
              return 'vendor';
            }
            if (id.includes('@radix-ui')) {
              return 'ui';
            }
            if (id.includes('react-router')) {
              return 'router';
            }
            if (id.includes('@tanstack/react-query')) {
              return 'query';
            }
            if (id.includes('@sentry')) {
              return 'monitoring';
            }
            if (id.includes('gray-matter') || id.includes('date-fns')) {
              return 'blog-loader';
            }
            // Split MDX into smaller chunks for better loading
            if (id.includes('@mdx-js/mdx') || id.includes('@mdx-js/react')) {
              return 'mdx-core';
            }
            if (id.includes('remark-') || id.includes('unified') || id.includes('micromark')) {
              return 'mdx-remark';
            }
            if (id.includes('rehype-')) {
              return 'mdx-rehype';
            }
            if (id.includes('lucide-react')) {
              return 'icons';
            }
            if (id.includes('next-themes')) {
              return 'theme';
            }
          }
        },
      },
    },
    // Compress assets
    assetsInlineLimit: 4096,
    // Optimize chunk size warnings
    chunkSizeWarningLimit: 500,
  },
}));
