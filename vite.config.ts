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
    'import.meta.env.VITE_COMMIT_SHA': JSON.stringify(process.env.GITHUB_SHA || 'local'),
  },
  build: {
    // Enable build optimizations
    minify: 'esbuild',
    sourcemap: true,
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
            // Keep all MDX dependencies together to avoid circular dependency issues
            if (id.includes('@mdx-js') || id.includes('remark-') || id.includes('rehype-') ||
                id.includes('unified') || id.includes('micromark')) {
              return 'mdx-runtime';
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
