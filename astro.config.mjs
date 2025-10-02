import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import react from "@astrojs/react";

export default defineConfig({
  integrations: [react()],
  site: "https://adriancpo.github.io/portfolio",
  base: "/portfolio/",     // måste sluta med "/"
  trailingSlash: "always", // matcha dina länkar som slutar på "/"
  vite: { plugins: [tailwindcss()] },
  devToolbar: { enabled: false }, // ⬅️ lägg till
});


 
