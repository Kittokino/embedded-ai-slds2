import { defineConfig } from "vite";

// SLDS icon sprites and the profile avatar are served from `public/assets/`.
// Vite serves everything under public/ at the site root as-is, in both dev and
// the production build, which is more reliable than copying them out of
// node_modules per-request. See public/assets/ for the sprite symbols.svg files
// referenced by the markup (e.g. /assets/icons/utility-sprite/svg/symbols.svg).
// base: "./" emits relative asset URLs so the build works when served from a
// subpath (e.g. GitHub Pages at /embedded-ai-slds2/) as well as from a root.
// The app is a single page, so relative references resolve against the page URL.
export default defineConfig({
  base: "./",
});
