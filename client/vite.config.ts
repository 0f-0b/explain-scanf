import eslint from "@rollup/plugin-eslint";
import react from "@vitejs/plugin-react";
import type { Plugin } from "vite";
import { defineConfig } from "vite";
import { minifyHtml } from "vite-plugin-html";

function preprocessor(plugin: Plugin): Plugin {
  return { ...plugin, enforce: "pre" };
}

export default defineConfig(({ command }) => ({
  plugins: [
    command === "build" ? preprocessor(eslint({ include: ["./src/**/*.ts", "./src/**/*.tsx"] })) : [],
    react(),
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
