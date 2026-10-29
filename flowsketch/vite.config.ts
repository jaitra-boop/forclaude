/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  // Dedicated ports so FlowSketch never lands on another app's default 5173.
  const env = { ...loadEnv(mode, process.cwd(), ""), ...process.env };
  const serverPort = Number(env.PORT || 8799);
  const clientPort = Number(env.CLIENT_PORT || 5199);
  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: clientPort,
      strictPort: true, // fail loudly instead of silently moving to another port
      open: !env.CI && !env.NO_OPEN,
      proxy: { "/api": `http://localhost:${serverPort}` },
    },
    test: {
      environment: "jsdom",
      include: ["tests/**/*.test.{ts,tsx}"],
      setupFiles: ["tests/setup.ts"],
    },
  };
});
