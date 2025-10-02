import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';


export default defineConfig({
  integrations: [react()],
  site: "https://adriancpo.github.io/portfolio",
  base: "/portfolio",
  vite: {
    plugins: [tailwindcss()],
  },
});