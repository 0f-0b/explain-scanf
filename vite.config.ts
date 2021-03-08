import eslint from "@rollup/plugin-eslint";
import reactRefresh from "@vitejs/plugin-react-refresh";
import { defineConfig, Plugin } from "vite";
import { minifyHtml } from "vite-plugin-html";

function preprocessor(plugin: Plugin): Plugin {
  return { ...plugin, enforce: "pre" };
}

export default defineConfig(({ command }) => ({
  plugins: [
    command === "build" ? preprocessor(eslint({ include: ["./src/**/*.ts", "./src/**/*.tsx"] })) : [],
    reactRefresh(),
    minifyHtml()
  ],
  css: {
    modules: {
      localsConvention: "camelCaseOnly"
    }
  },
  build: {
    target: "es2020",
    sourcemap: true,
    rollupOptions: {
      input: ["index.html", "internal/redirect.html"]
    },
    brotliSize: false
  }
}));
