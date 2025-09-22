import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://adriancpo.github.io/portfolio",
  base: "/portfolio",
  vite: {
    plugins: [tailwindcss()],
  },
});