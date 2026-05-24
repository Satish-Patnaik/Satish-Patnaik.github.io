import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { viteSourceLocator } from "@metagptx/vite-plugin-source-locator";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Root-domain deploy (Satish-Patnaik.github.io). Use '/' so asset paths work.
  // If you ever move to a subpath repo (yourname.github.io/repo-name), change to '/repo-name/'.
  base: "/",
  plugins: [
    viteSourceLocator({
      prefix: "mgx",
    }),
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
