import eslint from "@rollup/plugin-eslint";
import reactRefresh from "@vitejs/plugin-react-refresh";
import type { Plugin } from "vite";
import { defineConfig } from "vite";
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
    brotliSize: false
  }
}));
