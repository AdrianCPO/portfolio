import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import react from "@astrojs/react";

export default defineConfig({
  integrations: [react()],
  site: "https://adrian-portfolio.vercel.app",
  base: "/",
  trailingSlash: "always",
  vite: { plugins: [tailwindcss()] },
  devToolbar: { enabled: false },
});