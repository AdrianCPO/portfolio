import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

import react from "@astrojs/react";

export default defineConfig({
  // Uppdatera dessa i steg 6:
  site: "https://AdrianCPO.github.io",

  // base: "/<repo-namn>", // lägg till om repo ≠ <user>.github.io
  vite: { plugins: [tailwindcss()] },

  integrations: [react()],
});